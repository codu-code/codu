import { TRPCError } from "@trpc/server";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import * as Sentry from "@sentry/nextjs";

/**
 * Rate limiting. Two backends behind one async API: DynamoDB (when
 * `RATE_LIMIT_TABLE` is set) and an in-memory window for local dev / fallback.
 * A DynamoDB error fails open so a misconfigured table can't take the site down.
 */

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetAt: number;
}

export interface RateLimitOptions {
  /** Stable identifier for the limit bucket, e.g. `search:user-123`. */
  key: string;
  /** Max requests allowed within the window. */
  limit: number;
  /** Window length in milliseconds. */
  windowMs: number;
}

type Hit = { count: number; resetAt: number };
const buckets = new Map<string, Hit>();
let lastSweep = 0;
let warnedInMemoryInProd = false;

/**
 * Warn (once) when we silently fall back to the per-process in-memory limiter
 * in production — it's ineffective across serverless/multi-instance deploys, so
 * operators need to notice the missing RATE_LIMIT_TABLE.
 */
function warnInMemoryFallback() {
  if (warnedInMemoryInProd) return;
  if (process.env.NODE_ENV !== "production") return;
  warnedInMemoryInProd = true;
  Sentry.captureMessage(
    "Rate limiting fell back to in-memory store in production (RATE_LIMIT_TABLE unset) — ineffective on serverless/multi-instance.",
    "warning",
  );
}

function sweep(now: number) {
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [key, hit] of buckets) {
    if (hit.resetAt <= now) buckets.delete(key);
  }
}

function rateLimitInMemory(
  key: string,
  limit: number,
  windowMs: number,
  now: number = Date.now(),
): RateLimitResult {
  sweep(now);
  const existing = buckets.get(key);
  if (!existing || existing.resetAt <= now) {
    const resetAt = now + windowMs;
    buckets.set(key, { count: 1, resetAt });
    return { success: true, remaining: limit - 1, resetAt };
  }
  if (existing.count >= limit) {
    return { success: false, remaining: 0, resetAt: existing.resetAt };
  }
  existing.count += 1;
  return {
    success: true,
    remaining: limit - existing.count,
    resetAt: existing.resetAt,
  };
}

let docClient: DynamoDBDocumentClient | null = null;
function getDocClient(): DynamoDBDocumentClient {
  if (!docClient) {
    const hasKeys = process.env.ACCESS_KEY && process.env.SECRET_KEY;
    const base = new DynamoDBClient({
      region: process.env.AWS_REGION || "eu-west-1",
      ...(hasKeys
        ? {
            credentials: {
              accessKeyId: process.env.ACCESS_KEY || "",
              secretAccessKey: process.env.SECRET_KEY || "",
            },
          }
        : {}),
    });
    docClient = DynamoDBDocumentClient.from(base, {
      marshallOptions: { removeUndefinedValues: true },
    });
  }
  return docClient;
}

/**
 * Fixed-window counter in DynamoDB. The item key embeds the window start so a
 * new window is a new item; TTL reaps old windows. `ADD` is atomic, so the
 * returned count is race-safe across instances.
 */
async function rateLimitDynamo(
  table: string,
  key: string,
  limit: number,
  windowMs: number,
  now: number = Date.now(),
): Promise<RateLimitResult> {
  const windowStart = Math.floor(now / windowMs) * windowMs;
  const resetAt = windowStart + windowMs;
  const pk = `${key}#${windowStart}`;

  const res = await getDocClient().send(
    new UpdateCommand({
      TableName: table,
      Key: { pk },
      UpdateExpression: "ADD #c :one SET #ttl = if_not_exists(#ttl, :ttl)",
      ExpressionAttributeNames: { "#c": "count", "#ttl": "ttl" },
      ExpressionAttributeValues: {
        ":one": 1,
        // DynamoDB TTL is epoch seconds.
        ":ttl": Math.ceil(resetAt / 1000),
      },
      ReturnValues: "UPDATED_NEW",
    }),
  );

  const count = Number(res.Attributes?.count ?? 1);
  return {
    success: count <= limit,
    remaining: Math.max(0, limit - count),
    resetAt,
  };
}

/**
 * Check (and consume) one unit against the limit for `key`. Uses DynamoDB when
 * `RATE_LIMIT_TABLE` is set, otherwise an in-memory window. Never throws — a
 * DynamoDB error fails open (allows the request) and is reported to Sentry.
 */
export async function rateLimit(
  opts: RateLimitOptions,
): Promise<RateLimitResult> {
  const { key, limit, windowMs } = opts;
  const table = process.env.RATE_LIMIT_TABLE;
  if (!table) {
    warnInMemoryFallback();
    return rateLimitInMemory(key, limit, windowMs);
  }
  try {
    return await rateLimitDynamo(table, key, limit, windowMs);
  } catch (err) {
    Sentry.captureException(err);
    // Fail open: don't let a DynamoDB hiccup block legitimate traffic.
    return { success: true, remaining: limit, resetAt: Date.now() + windowMs };
  }
}

/**
 * Convenience wrapper for tRPC procedures: throws TOO_MANY_REQUESTS when the
 * limit is exceeded. `await enforceRateLimit({ key, limit, windowMs })`.
 */
export async function enforceRateLimit(
  opts: RateLimitOptions & { message?: string },
): Promise<void> {
  const { success } = await rateLimit(opts);
  if (!success) {
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: opts.message ?? "Too many requests. Please slow down.",
    });
  }
}

/** Best-effort client IP from forwarding headers. */
export function clientIpFromHeaders(headers: Headers): string {
  const fwd = headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return headers.get("x-real-ip")?.trim() || "unknown";
}

/** Reset in-memory buckets — test helper only. */
export function __resetRateLimits() {
  buckets.clear();
  lastSweep = 0;
}
