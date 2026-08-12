import { and, eq, inArray, lte, or, type SQL } from "drizzle-orm";
import { posts } from "@/server/db/schema";

/**
 * Statuses a post can be in and still be readable by someone other than its
 * author. `draft` is deliberately absent: a draft is private work in progress,
 * and nothing — not the public reader, not the moderation preview — should
 * surface one to anybody else.
 */
export const NON_DRAFT_STATUSES = [
  "published",
  "in_review",
  "rejected",
] as const;

/**
 * Who may see a post on the public reader routes.
 *
 * A post is visible when it is published and its publish time has passed, OR it
 * is awaiting/failed review and the viewer wrote it. Admins get no bypass here:
 * moderators read submissions through /admin/moderation/preview/{id}, so the
 * public routes mean the same thing for everyone.
 *
 * Callers that already pin an author in their WHERE (the /{username}/{slug}
 * resolvers) still get the right answer: the authorId predicate here is simply
 * redundant with theirs.
 */
export function postVisibilityFilter(viewer: {
  viewerId?: string | null;
}): SQL {
  const live = and(
    eq(posts.status, "published"),
    lte(posts.publishedAt, new Date().toISOString()),
  )!;

  const notLiveYet = inArray(posts.status, ["in_review", "rejected"]);

  if (viewer.viewerId) {
    return or(live, and(notLiveYet, eq(posts.authorId, viewer.viewerId)))!;
  }

  return live;
}

/**
 * Which posts a moderator may open in the review preview. Everything that has
 * been submitted — queued, already rejected, or live and since reported — but
 * never a private draft.
 */
export function moderationPreviewFilter(): SQL {
  return inArray(posts.status, [...NON_DRAFT_STATUSES]);
}
