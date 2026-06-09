/**
 * Pure freshness-window logic, kept free of any DB import so it can be unit
 * tested without loading the env/db layer. The DB-backed dedupe helpers in
 * `dedupe.ts` re-export these.
 */

/**
 * Content stays fresh: a link/discussion/question is considered a duplicate
 * only if a matching post was published within this many months.
 */
export const FRESHNESS_MONTHS = 6;

/**
 * True if `publishedAt` falls within the freshness window ending at `now`.
 *
 * Boundary: the cutoff is computed with `setMonth(getMonth() - FRESHNESS_MONTHS)`,
 * so a post published exactly FRESHNESS_MONTHS ago is `>=` the cutoff and counts
 * as IN the window (inclusive). Anything older is out.
 */
export function isWithinFreshnessWindow(publishedAt: Date, now: Date): boolean {
  const cutoff = new Date(now);
  cutoff.setMonth(cutoff.getMonth() - FRESHNESS_MONTHS);
  return publishedAt >= cutoff;
}
