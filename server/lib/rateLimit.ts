/**
 * Lightweight in-memory sliding-window rate limiter.
 *
 * Used to keep cheap-but-abusable endpoints (e.g. live search) from being
 * hammered. It's per-process (not shared across serverless instances), so it's
 * a first line of defence, not a hard global guarantee — pair it with short
 * result caps and minimum query lengths at the call site. Swap the store for
 * Upstash/Redis if you need cross-instance limits.
 */

type Hit = { count: number; resetAt: number };

const buckets = new Map<string, Hit>();

// Opportunistic cleanup so the map can't grow unbounded.
let lastSweep = 0;
function sweep(now: number) {
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [key, hit] of buckets) {
    if (hit.resetAt <= now) buckets.delete(key);
  }
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetAt: number;
}

/**
 * Allow `limit` requests per `windowMs` for a given `key`. Returns whether the
 * call is allowed plus remaining budget. `now` is injectable for tests.
 */
export function rateLimit(
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

/** Best-effort client IP from forwarding headers. */
export function clientIpFromHeaders(headers: Headers): string {
  const fwd = headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return headers.get("x-real-ip")?.trim() || "unknown";
}

/** Reset all buckets — test helper only. */
export function __resetRateLimits() {
  buckets.clear();
  lastSweep = 0;
}
