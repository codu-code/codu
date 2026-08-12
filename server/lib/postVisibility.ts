import { and, eq, inArray, lte, or, type SQL } from "drizzle-orm";
import { posts } from "@/server/db/schema";

/**
 * Who is allowed to see a post that is not live yet.
 *
 * Every reader resolver applies the same rule, so it lives here rather than
 * being restated per route: a post is visible when it is published and its
 * publish time has passed, OR it is awaiting/failed review and the viewer is
 * either its author or an admin. Admins get the author's view so the moderation
 * queue can link straight to a full preview of a post it is asking them to
 * approve.
 *
 * Callers that already pin an author in their WHERE (the /{username}/{slug}
 * resolvers) still get the right answer: the extra authorId predicate here is
 * simply redundant with theirs.
 */
export function postVisibilityFilter(viewer: {
  viewerId?: string | null;
  viewerIsAdmin?: boolean;
}): SQL {
  const live = and(
    eq(posts.status, "published"),
    lte(posts.publishedAt, new Date().toISOString()),
  )!;

  const notLiveYet = inArray(posts.status, ["in_review", "rejected"]);

  if (viewer.viewerIsAdmin) {
    return or(live, notLiveYet)!;
  }

  if (viewer.viewerId) {
    return or(live, and(notLiveYet, eq(posts.authorId, viewer.viewerId)))!;
  }

  return live;
}
