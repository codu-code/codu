import { cache } from "react";
import { headers } from "next/headers";
import { notFound, permanentRedirect } from "next/navigation";
import { getServerAuthSession } from "@/server/auth";
import { type Metadata } from "next";
import { SITE_ORIGIN } from "@/config/site";
import { db } from "@/server/db";
import { posts, user, feed_sources, post_tags, tag } from "@/server/db/schema";
import { eq, and, lte, inArray, sql } from "drizzle-orm";
import UserLinkDetail from "./_userLinkDetail";
import PostReader from "@/components/ContentDetail/PostReader";
import { parseUrlId, canonicalMismatch } from "@/server/lib/content-url";
import { postVisibilityFilter } from "@/server/lib/postVisibility";
import { serverApi } from "@/server/trpc/caller";
import { JsonLd } from "@/components/JsonLd";
import { getArticleSchema, getBreadcrumbSchema } from "@/lib/structured-data";
import { ogPostImage } from "@/lib/og/url";

// Bare host for a link's "via {source}" chip, e.g. "anthropic.com".
const hostFromUrl = (value?: string | null): string | undefined => {
  if (!value) return undefined;
  try {
    return new URL(value).hostname.replace(/^www\./, "");
  } catch {
    return undefined;
  }
};

type Props = { params: Promise<{ username: string; slug: string }> };

async function getUserPostUncached(
  username: string,
  postSlug: string,
  viewerId?: string | null,
  viewerIsAdmin = false,
) {
  // Case-insensitive handle resolution (GitHub-style), matching the profile page.
  const userRecord = await db.query.user.findFirst({
    columns: { id: true },
    where: sql`lower(${user.username}) = ${username.toLowerCase()}`,
  });

  if (!userRecord) return null;

  const visibilityFilter = postVisibilityFilter({ viewerId, viewerIsAdmin });

  const postResults = await db
    .select({
      id: posts.id,
      title: posts.title,
      body: posts.body,
      status: posts.status,
      publishedAt: posts.publishedAt,
      updatedAt: posts.updatedAt,
      readingTime: posts.readingTime,
      slug: posts.slug,
      excerpt: posts.excerpt,
      canonicalUrl: posts.canonicalUrl,
      showComments: posts.showComments,
      upvotesCount: posts.upvotesCount,
      downvotesCount: posts.downvotesCount,
      type: posts.type,
      moderationNote: posts.moderationNote,
      authorId: user.id,
      authorName: user.name,
      authorImage: user.image,
      authorUsername: user.username,
      authorBio: user.bio,
      authorJobTitle: user.jobTitle,
    })
    .from(posts)
    .leftJoin(user, eq(posts.authorId, user.id))
    .where(
      and(
        eq(posts.slug, postSlug),
        eq(posts.authorId, userRecord.id),
        // Text-content kinds render via the article reader; links resolve below.
        inArray(posts.type, [
          "article",
          "discussion",
          "question",
          "til",
          "resource",
        ]),
        visibilityFilter,
      ),
    )
    .limit(1);

  if (postResults.length === 0) return null;

  const postRecord = postResults[0];

  const tagsResult = await db
    .select({ title: tag.title, slug: tag.slug })
    .from(post_tags)
    .innerJoin(tag, eq(post_tags.tagId, tag.id))
    .where(eq(post_tags.postId, postRecord.id));

  return {
    ...postRecord,
    published: postRecord.publishedAt,
    readTimeMins: postRecord.readingTime,
    upvotes: postRecord.upvotesCount,
    downvotes: postRecord.downvotesCount,
    tags: tagsResult.map((t) => ({ tag: { title: t.title, slug: t.slug } })),
    user: {
      id: postRecord.authorId,
      name: postRecord.authorName,
      image: postRecord.authorImage,
      username: postRecord.authorUsername,
      bio: postRecord.authorBio,
      jobTitle: postRecord.authorJobTitle,
    },
  };
}

async function getUserLinkPostUncached(username: string, postSlug: string) {
  const userRecord = await db.query.user.findFirst({
    columns: { id: true },
    where: sql`lower(${user.username}) = ${username.toLowerCase()}`,
  });

  if (!userRecord) return null;

  const linkPostResults = await db
    .select({
      id: posts.id,
      title: posts.title,
      body: posts.body,
      excerpt: posts.excerpt,
      slug: posts.slug,
      externalUrl: posts.externalUrl,
      coverImage: posts.coverImage,
      status: posts.status,
      publishedAt: posts.publishedAt,
      updatedAt: posts.updatedAt,
      readingTime: posts.readingTime,
      showComments: posts.showComments,
      upvotesCount: posts.upvotesCount,
      downvotesCount: posts.downvotesCount,
      type: posts.type,
      authorId: user.id,
      authorName: user.name,
      authorImage: user.image,
      authorUsername: user.username,
      authorBio: user.bio,
      authorJobTitle: user.jobTitle,
    })
    .from(posts)
    .leftJoin(user, eq(posts.authorId, user.id))
    .where(
      and(
        eq(posts.slug, postSlug),
        eq(posts.authorId, userRecord.id),
        eq(posts.status, "published"),
        eq(posts.type, "link"),
        lte(posts.publishedAt, new Date().toISOString()),
      ),
    )
    .limit(1);

  if (linkPostResults.length === 0) return null;

  const linkPost = linkPostResults[0];

  const tagsResult = await db
    .select({ title: tag.title })
    .from(post_tags)
    .innerJoin(tag, eq(post_tags.tagId, tag.id))
    .where(eq(post_tags.postId, linkPost.id));

  return {
    ...linkPost,
    published: linkPost.publishedAt,
    readTimeMins: linkPost.readingTime,
    upvotes: linkPost.upvotesCount,
    downvotes: linkPost.downvotesCount,
    tags: tagsResult.map((t) => ({ tag: { title: t.title } })),
    user: {
      id: linkPost.authorId,
      name: linkPost.authorName,
      image: linkPost.authorImage,
      username: linkPost.authorUsername,
      bio: linkPost.authorBio,
      jobTitle: linkPost.authorJobTitle,
    },
  };
}

async function getFeedArticleUncached(
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

// Per-request dedupe: generateMetadata and the page body run the same
// resolution cascade; cache() makes each (resolver, args) pair hit the DB once.
const getUserPost = cache(getUserPostUncached);
const getUserLinkPost = cache(getUserLinkPostUncached);
const getFeedArticle = cache(getFeedArticleUncached);
const resolveMemberCanonicalByUrlId = cache(
  resolveMemberCanonicalByUrlIdUncached,
);
const exactPublishedPostExists = cache(exactPublishedPostExistsUncached);

async function getUserArticleContent(username: string, contentSlug: string) {
  return getUserPost(username, contentSlug);
}

// Resolve a member post by its urlId to its canonical username + slug.
// Aggregated/source content (no author) is excluded; a miss returns null so
// callers fall back to username+slug resolution.
async function resolveMemberCanonicalByUrlIdUncached(urlId: string) {
  if (!urlId) return null;

  const [match] = await db
    .select({
      slug: posts.slug,
      username: user.username,
      type: posts.type,
    })
    .from(posts)
    .innerJoin(user, eq(posts.authorId, user.id))
    .where(
      and(
        eq(posts.urlId, urlId),
        eq(posts.status, "published"),
        lte(posts.publishedAt, new Date().toISOString()),
        inArray(posts.type, [
          "article",
          "discussion",
          "question",
          "til",
          "resource",
          "link",
        ]),
      ),
    )
    .limit(1);

  if (!match || !match.username || !match.slug) return null;
  return { username: match.username, slug: match.slug, type: match.type };
}

// Discussions and questions live under the /d/ namespace. Everything else
// (articles, TIL, resource, link) stays at /{username}/{slug}.
function isDiscussionKind(type: string | null | undefined): boolean {
  return type === "discussion" || type === "question";
}

// Does a published post live at the EXACT (username, slug) requested? Suppresses
// urlId-based redirects so a slug whose trailing token collides with another
// post's urlId isn't hijacked (301'd) to that other post.
async function exactPublishedPostExistsUncached(
  username: string,
  slug: string,
): Promise<boolean> {
  const [match] = await db
    .select({ id: posts.id })
    .from(posts)
    .innerJoin(user, eq(posts.authorId, user.id))
    .where(
      and(
        sql`lower(${user.username}) = ${username.toLowerCase()}`,
        eq(posts.slug, slug),
        eq(posts.status, "published"),
        lte(posts.publishedAt, new Date().toISOString()),
      ),
    )
    .limit(1);

  return !!match;
}

// 301 to canonical when the request's urlId resolves to a member post whose
// canonical path differs (title edit / username rename). Discussion/question
// kinds always 301 to /d/{slug}.
async function redirectMemberToCanonical(username: string, slug: string) {
  const canonical = await resolveMemberCanonicalByUrlId(parseUrlId(slug));
  if (!canonical) return;

  // Discussions/questions always move to /d/, even if an exact post exists here.
  if (isDiscussionKind(canonical.type)) {
    permanentRedirect(`/d/${canonical.slug}`);
  }

  // Hijack guard: if a real post already lives at the EXACT requested URL, the
  // token collided with another post's urlId — let the normal render path serve
  // the correct post (the discussion redirect above stays unconditional).
  if (await exactPublishedPostExists(username, slug)) {
    return;
  }

  const canonicalPath = `/${canonical.username}/${canonical.slug}`;
  if (canonicalMismatch(`/${username}/${slug}`, canonicalPath)) {
    permanentRedirect(canonicalPath);
  }
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  const { username, slug } = params;

  // 301 stale member URLs (title edits / username renames) before metadata work.
  await redirectMemberToCanonical(username, slug);

  // Same viewerId as the page body so the cache()d resolver runs once per request.
  const session = await getServerAuthSession();
  const userPost = await getUserPost(
    username,
    slug,
    session?.user?.id,
    session?.user?.role === "ADMIN",
  );
  if (userPost) {
    // Discussions/questions canonicalize to /d/{slug}; redirect before metadata.
    if (isDiscussionKind(userPost.type)) {
      permanentRedirect(`/d/${userPost.slug}`);
    }
    const tags = userPost.tags.map((tag) => tag.tag.title);
    const authorName = userPost.user.name || "Unknown";
    const postOgImage = ogPostImage({
      kind: "article",
      title: userPost.title,
      authorName,
      authorRole: userPost.user.jobTitle,
      authorKey: userPost.user.username ?? authorName,
      tags,
      readMins: userPost.readTimeMins,
      updatedAt: userPost.updatedAt,
    });

    return {
      title: `${userPost.title} | by ${authorName} | Codú`,
      authors: {
        name: authorName,
        // Author URLs always point at the canonical production host —
        // host-header values vary on previews.
        url: `${SITE_ORIGIN}/${userPost.user.username}`,
      },
      keywords: tags,
      description: userPost.excerpt ?? undefined,
      openGraph: {
        description: userPost.excerpt ?? undefined,
        type: "article",
        url: `/${userPost.user.username ?? username}/${userPost.slug}`,
        publishedTime: userPost.published ?? undefined,
        modifiedTime: userPost.updatedAt ?? undefined,
        images: [postOgImage],
        siteName: "Codú",
      },
      twitter: {
        card: "summary_large_image",
        description: userPost.excerpt ?? undefined,
        images: [postOgImage],
      },
      alternates: {
        // Cross-posted content points at the original; native posts
        // self-canonical at the stored handle casing.
        canonical:
          userPost.canonicalUrl ??
          `/${userPost.user.username ?? username}/${userPost.slug}`,
      },
    };
  }

  const userArticle = await getUserArticleContent(username, slug);
  if (userArticle && userArticle.user) {
    const tags = userArticle.tags?.map((t) => t.tag.title) || [];
    const articleAuthorName = userArticle.user.name || "Unknown";
    const articleOgImage = ogPostImage({
      kind: "article",
      title: userArticle.title,
      authorName: articleAuthorName,
      authorKey: userArticle.user.username ?? articleAuthorName,
      tags,
      readMins: userArticle.readTimeMins || 5,
      updatedAt: userArticle.updatedAt,
    });

    return {
      title: `${userArticle.title} | by ${articleAuthorName} | Codú`,
      authors: {
        name: articleAuthorName,
        url: `${SITE_ORIGIN}/${userArticle.user.username}`,
      },
      keywords: tags,
      description: userArticle.excerpt,
      openGraph: {
        description: userArticle.excerpt || "",
        type: "article",
        url: `/${userArticle.user.username ?? username}/${userArticle.slug}`,
        publishedTime: userArticle.published ?? undefined,
        modifiedTime: userArticle.updatedAt ?? undefined,
        images: [articleOgImage],
        siteName: "Codú",
      },
      twitter: {
        card: "summary_large_image",
        description: userArticle.excerpt || "",
        images: [articleOgImage],
      },
      alternates: {
        canonical:
          userArticle.canonicalUrl ??
          `/${userArticle.user.username ?? username}/${userArticle.slug}`,
      },
    };
  }

  const userLinkPost = await getUserLinkPost(username, slug);
  if (userLinkPost && userLinkPost.user) {
    const linkAuthorName = userLinkPost.user.name || "Unknown";
    const linkOgImage = ogPostImage({
      kind: "link",
      title: userLinkPost.title,
      authorName: linkAuthorName,
      authorRole: userLinkPost.user.jobTitle,
      authorKey: userLinkPost.user.username ?? linkAuthorName,
      tags: userLinkPost.tags.map((t) => t.tag.title),
      source: hostFromUrl(userLinkPost.externalUrl),
      cover: userLinkPost.coverImage,
      updatedAt: userLinkPost.updatedAt,
    });

    return {
      title: `${userLinkPost.title} | shared by ${linkAuthorName} | Codú`,
      authors: {
        name: linkAuthorName,
        url: `${SITE_ORIGIN}/${userLinkPost.user.username}`,
      },
      description: userLinkPost.excerpt || `Link shared by ${linkAuthorName}`,
      openGraph: {
        title: userLinkPost.title,
        description: userLinkPost.excerpt || `Link shared by ${linkAuthorName}`,
        images: [linkOgImage],
        siteName: "Codú",
      },
      twitter: {
        card: "summary_large_image",
        description: userLinkPost.excerpt || `Link shared by ${linkAuthorName}`,
        images: [linkOgImage],
      },
      // Member-shared links keep Codú as canonical (aggregated links point to source).
      alternates: {
        canonical: `/${userLinkPost.user.username ?? username}/${userLinkPost.slug}`,
      },
    };
  }

  // Aggregated/source content moved to /s/{sourceSlug}/{slug} — 301 rather than
  // emit feed metadata at the legacy URL.
  const feedArticle = await getFeedArticle(username, slug);
  if (feedArticle) {
    permanentRedirect(`/s/${username}/${feedArticle.slug}`);
  }

  return { title: "Content Not Found" };
}

const UnifiedPostPage = async (props: Props) => {
  const params = await props.params;
  const session = await getServerAuthSession();
  const { username, slug } = params;

  // 301 stale member URLs (title edits / username renames) to canonical.
  await redirectMemberToCanonical(username, slug);

  const host = (await headers()).get("host") || "";

  const userPost = await getUserPost(
    username,
    slug,
    session?.user?.id,
    session?.user?.role === "ADMIN",
  );

  if (userPost) {
    // Discussions/questions live under /d/{slug} — redirect before rendering.
    if (isDiscussionKind(userPost.type)) {
      permanentRedirect(`/d/${userPost.slug}`);
    }

    // Handle resolution is case-insensitive; only the stored casing renders.
    if (userPost.user.username && userPost.user.username !== username) {
      permanentRedirect(`/${userPost.user.username}/${userPost.slug}`);
    }

    return (
      <PostReader
        post={userPost}
        session={session}
        host={host}
        canonicalPath={`/${userPost.user.username}/${userPost.slug}`}
        commentsDisabledLabel="post"
      />
    );
  }

  const userArticle = await getUserArticleContent(username, slug);

  if (userArticle && userArticle.user && userArticle.body) {
    if (isDiscussionKind(userArticle.type)) {
      permanentRedirect(`/d/${userArticle.slug}`);
    }

    if (userArticle.user.username && userArticle.user.username !== username) {
      permanentRedirect(`/${userArticle.user.username}/${userArticle.slug}`);
    }

    return (
      <PostReader
        post={userArticle}
        session={session}
        host={host}
        canonicalPath={`/${userArticle.user.username}/${userArticle.slug}`}
        commentsDisabledLabel="article"
      />
    );
  }

  const userLinkPost = await getUserLinkPost(username, slug);

  if (userLinkPost && userLinkPost.user) {
    if (userLinkPost.user.username && userLinkPost.user.username !== username) {
      permanentRedirect(`/${userLinkPost.user.username}/${userLinkPost.slug}`);
    }

    // Member-shared links are self-canonical, so emit BlogPosting + BreadcrumbList
    // JSON-LD like member articles.
    const linkAuthorName = userLinkPost.user.name || "Unknown";
    const articleSchema = getArticleSchema({
      title: userLinkPost.title,
      excerpt: userLinkPost.excerpt,
      slug: userLinkPost.slug,
      image: userLinkPost.coverImage,
      publishedAt: userLinkPost.published,
      updatedAt: userLinkPost.updatedAt,
      readingTime: userLinkPost.readTimeMins,
      // Self-canonical: omit canonicalUrl so the builder uses the Codú URL.
      tags: userLinkPost.tags.map((t) => ({ title: t.tag.title })),
      author: {
        name: userLinkPost.user.name,
        username: userLinkPost.user.username,
        image: userLinkPost.user.image,
        bio: userLinkPost.user.bio,
      },
    });
    const breadcrumbSchema = getBreadcrumbSchema([
      { name: "Home", url: SITE_ORIGIN },
      {
        name: linkAuthorName,
        url: `${SITE_ORIGIN}/${userLinkPost.user.username}`,
      },
      { name: userLinkPost.title },
    ]);

    // Server-fetch the tRPC-shaped content (in-process, includes the viewer's
    // vote) so the link body is in the crawlable HTML, not client-fetched.
    const initialLinkContent = await serverApi()
      .then((api) => api.content.getUserLinkBySlug({ username, slug }))
      .catch(() => null);

    return (
      <>
        <JsonLd data={articleSchema} />
        <JsonLd data={breadcrumbSchema} />
        <UserLinkDetail
          username={username}
          contentSlug={slug}
          initialContent={initialLinkContent}
        />
      </>
    );
  }

  // Aggregated content now lives at /s/{sourceSlug}/{slug} — 301 there.
  const feedArticle = await getFeedArticle(username, slug);

  if (feedArticle) {
    permanentRedirect(`/s/${username}/${feedArticle.slug}`);
  }

  return notFound();
};

export default UnifiedPostPage;
