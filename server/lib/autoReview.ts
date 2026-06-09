import { InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";
import * as Sentry from "@sentry/nextjs";
import { bedrockClient, isBedrockEnabled } from "@/server/lib/bedrock";
import { screenContent } from "@/server/lib/moderation";
import { fetchPageText } from "@/server/lib/fetchPage";

export type Verdict = {
  verdict: "allow" | "review";
  category: string;
  reason: string;
};

// Codú moderation policy. Deliberately LOOSE & FAIR: allow by default —
// including people sharing their OWN projects/launches — and only flag the
// obvious bad stuff for human review.
const SYSTEM_PROMPT = `You are a content moderator for Codú, a community for AI builders and indie hackers.

Be LOOSE and FAIR. Allow by default. People sharing their OWN projects, launches, side-projects, "Show HN" style posts, and self-promotion of their own work are ALLOWED — that is what this community is for.

Only return "review" for the clearly bad:
- pornographic / NSFW / sexual content
- crypto / token shilling, pump-and-dump, "free crypto", airdrops
- malicious, scam, phishing, or obviously fraudulent links
- dead, fake, or fabricated sources (link clearly doesn't support the post)
- content that is plainly off-theme for an AI-builders / indie-hacker developer community

When in doubt, allow.

Reply with ONLY a JSON object, no prose, in this exact shape:
{"verdict":"allow"|"review","category":string,"reason":string}
Use category "none" and reason "" for an allow.`;

const MAX_BODY_CHARS = 6000;

export interface AutoReviewInput {
  type?: string | null;
  title?: string | null;
  body?: string | null;
  externalUrl?: string | null;
}

/**
 * Synchronous auto-review at publish time. Gated and FAIL-OPEN:
 *  - If Bedrock isn't configured -> fall back to the cheap heuristic
 *    screenContent(); ok -> allow, not ok -> review.
 *  - If Bedrock is configured -> pre-visit any external link, ask Claude
 *    Haiku for a verdict, and parse it.
 *  - On ANY thrown error -> capture to Sentry and return allow (never block
 *    publishing on an infra/model failure).
 */
export async function autoReview(input: AutoReviewInput): Promise<Verdict> {
  const { type, title, body, externalUrl } = input;

  if (!isBedrockEnabled()) {
    const result = screenContent({ title, body });
    if (result.ok) {
      return { verdict: "allow", category: "none", reason: "" };
    }
    return {
      verdict: "review",
      category: "heuristic",
      reason: result.reasons.join(", "),
    };
  }

  try {
    // Do NOT hardcode the model id. Bedrock model ids are region-sensitive:
    // some regions require a cross-region inference-profile prefix
    // (e.g. "eu.anthropic.claude-haiku-4-5-20251001-v1:0" or
    // "us.anthropic...") rather than the bare foundation-model id. Always
    // read whatever is configured for this region from the env.
    const modelId = process.env.BEDROCK_MODEL_ID as string;

    const pageText = externalUrl ? await fetchPageText(externalUrl) : "";

    const userMessage = [
      `Type: ${type ?? "post"}`,
      `Title: ${title ?? ""}`,
      `Body: ${(body ?? "").slice(0, MAX_BODY_CHARS)}`,
      externalUrl ? `External URL: ${externalUrl}` : "",
      pageText ? `Linked page text:\n${pageText}` : "",
    ]
      .filter(Boolean)
      .join("\n\n");

    const res = await bedrockClient.send(
      new InvokeModelCommand({
        modelId,
        contentType: "application/json",
        accept: "application/json",
        body: JSON.stringify({
          // Required by Bedrock's Anthropic Messages API; confirmed value.
          anthropic_version: "bedrock-2023-05-31",
          max_tokens: 256,
          system: SYSTEM_PROMPT,
          messages: [{ role: "user", content: userMessage }],
        }),
      }),
    );

    const decoded = JSON.parse(new TextDecoder().decode(res.body)) as {
      content?: Array<{ type?: string; text?: string }>;
    };
    const text = decoded.content?.[0]?.text ?? "";
    return parseVerdict(text);
  } catch (err) {
    Sentry.captureException(err);
    // FAIL OPEN: never block publishing on a Bedrock/infra error.
    return { verdict: "allow", category: "none", reason: "bedrock-error" };
  }
}

/** Pull the first {...} object out of text that may be wrapped in prose. */
function extractJson(raw: string): string {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  return start >= 0 && end > start ? raw.slice(start, end + 1) : raw;
}

/**
 * Parse the model's JSON verdict. Note the deliberate asymmetry:
 *  - UNPARSEABLE  -> allow  (fail OPEN: signals infra/model failure, and we
 *    never block publishing on infra failure).
 *  - PARSED but UNKNOWN verdict -> review (fail SAFE: the model returned
 *    something structured we didn't expect, so route to human review).
 */
export function parseVerdict(raw: string): Verdict {
  let obj: unknown;
  try {
    obj = JSON.parse(extractJson(raw));
  } catch {
    return { verdict: "allow", category: "none", reason: "unparseable" };
  }
  const o = obj as { verdict?: unknown; category?: unknown; reason?: unknown };
  if (o?.verdict === "allow") {
    return {
      verdict: "allow",
      category: typeof o.category === "string" ? o.category : "none",
      reason: typeof o.reason === "string" ? o.reason : "",
    };
  }
  return {
    verdict: "review",
    category: typeof o?.category === "string" ? o.category : "unknown",
    reason: typeof o?.reason === "string" ? o.reason : "",
  };
}
