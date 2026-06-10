import { db } from "@/server/db";
import { posts, feed_sources } from "@/server/db/schema";
import { eq, and } from "drizzle-orm";

// Resolves aggregated (source-imported) link content by source slug + article
// slug. Server-only — must never be imported into a client component (pulls in
// @/server/db and would trigger a `Module not found: 'fs'` client-bundle error).
export async function getFeedArticle(
  sourceSlug: string,
  articleSlugOrShortId: string,
) {
  const source = await db.query.feed_sources.findFirst({
    where: eq(feed_sources.slug, sourceSlug),
  });

  if (!source) return null;

  const linkPostResults = await db
    .select({
      id: posts.id,
      title: posts.title,
      body: posts.body,
      excerpt: posts.excerpt,
      slug: posts.slug,
      urlId: posts.urlId,
      externalUrl: posts.externalUrl,
      coverImage: posts.coverImage,
      upvotesCount: posts.upvotesCount,
      downvotesCount: posts.downvotesCount,
      publishedAt: posts.publishedAt,
      createdAt: posts.createdAt,
      updatedAt: posts.updatedAt,
      showComments: posts.showComments,
      sourceName: feed_sources.name,
      sourceSlug: feed_sources.slug,
      sourceLogo: feed_sources.logoUrl,
      sourceWebsite: feed_sources.websiteUrl,
    })
    .from(posts)
    .leftJoin(feed_sources, eq(posts.sourceId, feed_sources.id))
    .where(
      and(
        eq(posts.slug, articleSlugOrShortId),
        eq(posts.sourceId, source.id),
        eq(posts.type, "link"),
        eq(posts.status, "published"),
      ),
    )
    .limit(1);

  if (linkPostResults.length === 0) return null;

  const linkPost = linkPostResults[0];

  return {
    ...linkPost,
    shortId: linkPost.slug.split("-").pop() || "",
    imageUrl: linkPost.coverImage,
    ogImageUrl: linkPost.coverImage,
    upvotes: linkPost.upvotesCount,
    downvotes: linkPost.downvotesCount,
    source: {
      name: linkPost.sourceName,
      slug: linkPost.sourceSlug,
      logoUrl: linkPost.sourceLogo,
      websiteUrl: linkPost.sourceWebsite,
    },
  };
}

// Alias retained for the legacy `getLinkContent` call sites. Both resolve the
// same aggregated link content.
export async function getLinkContent(
  sourceSlug: string,
  contentSlug: string,
) {
  return getFeedArticle(sourceSlug, contentSlug);
}

// urlId-first canonical resolver for aggregated content. Given a slug param,
// parse its trailing urlId and look up the canonical post slug for this source
// so the route can slug-correct (301 to the canonical /s/{source}/{slug}).
export async function resolveAggregatedCanonical(
  sourceSlug: string,
  slugParam: string,
) {
  const source = await db.query.feed_sources.findFirst({
    columns: { id: true },
    where: eq(feed_sources.slug, sourceSlug),
  });
  if (!source) return null;

  const urlId = slugParam.split("-").pop() ?? slugParam;

  const [byUrlId] = await db
    .select({ slug: posts.slug })
    .from(posts)
    .where(
      and(
        eq(posts.urlId, urlId),
        eq(posts.sourceId, source.id),
        eq(posts.type, "link"),
        eq(posts.status, "published"),
      ),
    )
    .limit(1);

  if (byUrlId?.slug) return { slug: byUrlId.slug };

  // Full-slug fallback: the param may be the exact canonical slug already.
  const [byFullSlug] = await db
    .select({ slug: posts.slug })
    .from(posts)
    .where(
      and(
        eq(posts.slug, slugParam),
        eq(posts.sourceId, source.id),
        eq(posts.type, "link"),
        eq(posts.status, "published"),
      ),
    )
    .limit(1);

  return byFullSlug?.slug ? { slug: byFullSlug.slug } : null;
}
