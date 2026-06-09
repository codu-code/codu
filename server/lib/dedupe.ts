import { and, eq, gte, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

import { db } from "@/server/db";
import { posts } from "@/server/db/schema";
import { FRESHNESS_MONTHS } from "@/server/lib/freshness";
import { normalizeUrl } from "@/server/lib/normalizeUrl";
import {
  gatePublish,
  isModerationEnabled,
  type GateResult,
} from "@/server/lib/moderation";

// Re-export the pure freshness predicate so callers can pull everything from
// `dedupe`. The logic itself lives in `freshness.ts` (no DB import) so it can be
// unit tested without booting the env/db layer.
export {
  FRESHNESS_MONTHS,
  isWithinFreshnessWindow,
} from "@/server/lib/freshness";

/** An existing PUBLISHED post sharing this normalized URL within the freshness window, or null. */
export async function findFreshDuplicateLink(
  normalized: string,
): Promise<{ id: string; slug: string | null } | null> {
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - FRESHNESS_MONTHS);
  const rows = await db
    .select({ id: posts.id, slug: posts.slug })
    .from(posts)
    .where(
      and(
        eq(posts.externalUrlNormalized, normalized),
        eq(posts.status, "published"),
        // publishedAt is a `mode: "string"` timestamp column, so compare against
        // an ISO string.
        gte(posts.publishedAt, cutoff.toISOString()),
      ),
    )
    .limit(1);
  return rows[0] ?? null;
}

/**
 * Recent same/very-similar discussion or question by title; null if none above
 * the candidate threshold.
 *
 * Thresholds: this helper surfaces any match with pg_trgm `similarity()` > 0.5.
 * Callers decide what to do with the score — treat >= 0.8 as a hard duplicate
 * and 0.5–0.8 as "route to review". This helper only returns the best match +
 * its similarity; it does not make that decision.
 *
 * Uses lower(title) to line up with the `posts_title_trgm_idx` GIN trigram index.
 */
export async function findSimilarDiscussion(
  title: string,
): Promise<{ id: string; slug: string | null; similarity: number } | null> {
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - FRESHNESS_MONTHS);
  // NOTE: the drizzle column `publishedAt` maps to the SQL column `published_at`
  // (snake_case) — see pgTable("posts") in schema.ts. Use the real identifier.
  const result = await db.execute(sql`
    SELECT id, slug, similarity(lower(title), lower(${title})) AS sim
    FROM "posts"
    WHERE type IN ('discussion','question')
      AND status = 'published'
      AND "published_at" >= ${cutoff.toISOString()}
      AND similarity(lower(title), lower(${title})) > 0.5
    ORDER BY sim DESC
    LIMIT 1
  `);
  // postgres-js returns rows as a plain array (RowList extends Array), not
  // `{ rows: [...] }`. The `.rows` branch keeps this safe if the driver changes.
  const row =
    (result as unknown as { rows?: unknown[] }).rows?.[0] ??
    (Array.isArray(result) ? result[0] : undefined);
  return row
    ? {
        id: String((row as { id: unknown }).id),
        slug: (row as { slug: string | null }).slug ?? null,
        similarity: Number((row as { sim: unknown }).sim),
      }
    : null;
}

// Above this best-match similarity a discussion/question is treated as a hard
// duplicate (CONFLICT). Between findSimilarDiscussion's floor (0.5) and this,
// the post is allowed through but routed to human review.
const HARD_DUPLICATE_SIMILARITY = 0.8;

/**
 * The single entry point the publish path uses. Run the DB-backed dedupe
 * pre-checks, then delegate the published-vs-in_review decision to the pure
 * `gatePublish`. Returns the {status, publishedAt, moderationNote,
 * externalUrlNormalized} the caller writes into the row.
 *
 * Only call this on a GOING-LIVE transition (publishing) — drafts/non-status
 * updates must not be deduped or gated.
 *
 * Dedupe only runs when moderation is ENABLED, so the moderation-off path keeps
 * its exact previous behaviour (everything publishes immediately, no dedupe).
 *
 * Throws TRPCError CONFLICT for a hard duplicate; that propagates to the client
 * so it can point the author at the existing post.
 */
export async function runDedupeAndGate(input: {
  type: string;
  title: string;
  body?: string | null;
  externalUrl?: string | null;
}): Promise<GateResult> {
  let forceInReview = false;

  if (isModerationEnabled()) {
    // Link/resource: reject an exact (normalized) repost that's still fresh.
    if (
      (input.type === "link" || input.type === "resource") &&
      input.externalUrl
    ) {
      const normalized = normalizeUrl(input.externalUrl);
      if (normalized) {
        const dupe = await findFreshDuplicateLink(normalized);
        if (dupe) {
          throw new TRPCError({
            code: "CONFLICT",
            message:
              "This link was already shared on Codú recently. Find it on the site instead of reposting.",
          });
        }
      }
    }

    // Discussion/question: reject a near-identical recent title; a weaker
    // best-match (0.5–0.8) is allowed but routed to human review.
    if (input.type === "discussion" || input.type === "question") {
      const similar = await findSimilarDiscussion(input.title);
      if (similar && similar.similarity >= HARD_DUPLICATE_SIMILARITY) {
        throw new TRPCError({
          code: "CONFLICT",
          message:
            "This has already been asked recently — join the existing discussion.",
        });
      }
      forceInReview = !!similar;
    }
  }

  return gatePublish({ ...input, forceInReview });
}
