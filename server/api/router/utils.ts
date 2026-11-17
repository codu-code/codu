import type { AnyColumn } from "drizzle-orm";
import { and, count, eq, isNotNull, or, sql } from "drizzle-orm";
import type { db as Database } from "@/server/db";
import { posts, reports } from "@/server/db/schema";

export const increment = (column: AnyColumn, value = 1) => {
  return sql`${column} + ${value}`;
};

export const decrement = (column: AnyColumn, value = 1) => {
  return sql`${column} - ${value}`;
};

/**
 * Pending system (auto-flagged) reports an admin can act on: those on a
 * comment, or on a post that is still published. Matches what the moderation
 * queue lists, so the pending badge never counts a report nobody can see.
 */
export const countOpenSystemReports = async (db: typeof Database) => {
  const [row] = await db
    .select({ count: count() })
    .from(reports)
    .leftJoin(posts, eq(reports.postId, posts.id))
    .where(
      and(
        eq(reports.status, "pending"),
        eq(reports.source, "system"),
        or(isNotNull(reports.commentId), eq(posts.status, "published")),
      ),
    );
  return row.count;
};
