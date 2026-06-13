import { cache } from "react";
import { and, count, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/server/db";
import {
  banned_users,
  feed_sources,
  posts,
  publication_follow,
} from "@/server/db/schema";
import { type RouterOutputs } from "@/server/trpc/shared";

export type SourceProfile = RouterOutputs["publication"]["getBySlug"];

// Server-side mirror of api.publication.getBySlug for the anonymous/first-paint
// case: same source lookup, stats and first page of published articles, minus
// the per-user vote/bookmark/follow joins (those hydrate client-side). Wrapped
// in React cache() so generateMetadata + the page share one resolution per
// request. Returns null instead of throwing so callers drive notFound().
export const getSourceProfile = cache(async function getSourceProfile(
  sourceSlug: string,
): Promise<SourceProfile | null> {
  const source = await db.query.feed_sources.findFirst({
    where: eq(feed_sources.slug, sourceSlug),
  });

  if (!source) return null;

  const [followerRow] = await db
    .select({ c: count() })
    .from(publication_follow)
    .where(eq(publication_follow.sourceId, source.id));

  const [articleRow] = await db
    .select({ c: count() })
    .from(posts)
    .where(and(eq(posts.sourceId, source.id), eq(posts.status, "published")));

  const rows = await db
    .select({
      id: posts.id,
      slug: posts.slug,
      title: posts.title,
      excerpt: posts.excerpt,
      url: posts.externalUrl,
      imageUrl: posts.coverImage,
      author: posts.sourceAuthor,
      publishedAt: posts.publishedAt,
      upvotes: posts.upvotesCount,
      downvotes: posts.downvotesCount,
    })
    .from(posts)
    .leftJoin(banned_users, eq(posts.authorId, banned_users.userId))
    .where(
      and(
        eq(posts.sourceId, source.id),
        eq(posts.status, "published"),
        isNull(banned_users.userId),
      ),
    )
    .orderBy(desc(posts.publishedAt))
    .limit(50);

  const articles = rows.map((item) => ({
    ...item,
    userVote: null as "up" | "down" | null,
    isBookmarked: false,
  }));

  return {
    id: source.id,
    name: source.name,
    slug: source.slug,
    // No dedicated handle column — derive a stable @handle from the slug.
    handle: source.slug,
    logoUrl: source.logoUrl,
    websiteUrl: source.websiteUrl,
    // Reuse the existing `description` column as the tagline.
    tagline: source.description,
    followerCount: Number(followerRow?.c ?? 0),
    articleCount: Number(articleRow?.c ?? 0),
    isFollowing: false,
    articles,
  };
});
