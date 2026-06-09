import { and, eq, gte, sql } from "drizzle-orm";

import { db } from "@/server/db";
import { posts } from "@/server/db/schema";
import { FRESHNESS_MONTHS } from "@/server/lib/freshness";

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
