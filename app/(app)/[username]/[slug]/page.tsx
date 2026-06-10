import { headers } from "next/headers";
import { notFound, permanentRedirect } from "next/navigation";
import { getServerAuthSession } from "@/server/auth";
import { type Metadata } from "next";
import { db } from "@/server/db";
import { posts, user, feed_sources, post_tags, tag } from "@/server/db/schema";
import { eq, and, lte, inArray, or } from "drizzle-orm";
import FeedArticleContent from "./_feedArticleContent";
import LinkContentDetail from "./_linkContentDetail";
import UserLinkDetail from "./_userLinkDetail";
import { JsonLd } from "@/components/JsonLd";
import PostReader from "@/components/ContentDetail/PostReader";
import { parseUrlId, canonicalMismatch } from "@/server/lib/content-url";
import {
  getBreadcrumbSchema,
  getNewsArticleSchema,
} from "@/lib/structured-data";

type Props = { params: Promise<{ username: string; slug: string }> };

async function getUserPost(
  username: string,
  postSlug: string,
  viewerId?: string | null,
) {
  const userRecord = await db.query.user.findFirst({
    columns: { id: true },
    where: eq(user.username, username),
  });

  if (!userRecord) return null;

  // Owner bypass: the post's author may view their own post while it is
  // awaiting review or has been hidden by a moderator. Everyone else only ever
  // sees published posts whose publish time has passed (the public filter
  // below). The author check is `viewerId === post author's id` — a hard
  // identity match — so non-authors can never reach the relaxed branch.
  const isAuthor = !!viewerId && viewerId === userRecord.id;

  const visibilityFilter = isAuthor
    ? or(
        and(
          eq(posts.status, "published"),
          lte(posts.publishedAt, new Date().toISOString()),
        ),
        inArray(posts.status, ["in_review", "rejected"]),
      )
    : and(
        eq(posts.status, "published"),
        lte(posts.publishedAt, new Date().toISOString()),
      );

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
    })
    .from(posts)
    .leftJoin(user, eq(posts.authorId, user.id))
    .where(
      and(
        eq(posts.slug, postSlug),
        eq(posts.authorId, userRecord.id),
        // Text-content kinds all render via the article reader (title + body +
        // discussion). Links have their own resolver below.
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
    .select({ title: tag.title })
    .from(post_tags)
    .innerJoin(tag, eq(post_tags.tagId, tag.id))
    .where(eq(post_tags.postId, postRecord.id));

  return {
    ...postRecord,
    published: postRecord.publishedAt,
    readTimeMins: postRecord.readingTime,
    upvotes: postRecord.upvotesCount,
    downvotes: postRecord.downvotesCount,
    tags: tagsResult.map((t) => ({ tag: { title: t.title } })),
    user: {
      id: postRecord.authorId,
      name: postRecord.authorName,
      image: postRecord.authorImage,
      username: postRecord.authorUsername,
      bio: postRecord.authorBio,
    },
  };
}

async function getUserLinkPost(username: string, postSlug: string) {
  const userRecord = await db.query.user.findFirst({
    columns: { id: true },
    where: eq(user.username, username),
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
    },
  };
}

async function getFeedArticle(
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

async function getLinkContent(sourceSlug: string, contentSlug: string) {
  return getFeedArticle(sourceSlug, contentSlug);
}

async function getUserArticleContent(username: string, contentSlug: string) {
  return getUserPost(username, contentSlug);
}

// urlId-first lookup for MEMBER (user-authored) content. The urlId is the
// immutable, canonical resolver: parse it from the slug param, look up the
// post (text kinds + member link-posts), and return the canonical username +
// slug. Aggregated/source content (no author) is intentionally excluded — it
// resolves via the existing getFeedArticle/getLinkContent paths. A miss (legacy
// link whose trailing token isn't a real urlId, or aggregated content) returns
// null so callers fall back to the username+slug resolution unchanged.
async function resolveMemberCanonicalByUrlId(urlId: string) {
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

// If the request's urlId resolves to a member post whose canonical path differs
// from what was requested (title edit or username rename), 301 to canonical.
// Discussion/question kinds 301 to their /d/{slug} canonical regardless of the
// requested username path.
async function redirectMemberToCanonical(username: string, slug: string) {
  const canonical = await resolveMemberCanonicalByUrlId(parseUrlId(slug));
  if (!canonical) return;

  if (isDiscussionKind(canonical.type)) {
    permanentRedirect(`/d/${canonical.slug}`);
  }

  const canonicalPath = `/${canonical.username}/${canonical.slug}`;
  if (canonicalMismatch(`/${username}/${slug}`, canonicalPath)) {
    permanentRedirect(canonicalPath);
  }
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  const { username, slug } = params;

  // urlId-first canonicalization: 301 stale member URLs (title edits / username
  // renames) before metadata work. No-op when already canonical or on a miss.
  await redirectMemberToCanonical(username, slug);

  const userPost = await getUserPost(username, slug);
  if (userPost) {
    // Discussions/questions canonicalize to /d/{slug}; redirect before
    // rendering metadata so the legacy URL never serves discussion metadata.
    if (isDiscussionKind(userPost.type)) {
      permanentRedirect(`/d/${userPost.slug}`);
    }
    const tags = userPost.tags.map((tag) => tag.tag.title);
    const host = (await headers()).get("host") || "";
    const authorName = userPost.user.name || "Unknown";

    return {
      title: `${userPost.title} | by ${authorName} | Codú`,
      authors: {
        name: authorName,
        url: `https://www.${host}/${userPost.user.username}`,
      },
      keywords: tags,
      description: userPost.excerpt ?? undefined,
      openGraph: {
        description: userPost.excerpt ?? undefined,
        type: "article",
        images: [
          `/og?title=${encodeURIComponent(
            userPost.title,
          )}&readTime=${userPost.readTimeMins}&author=${encodeURIComponent(
            authorName,
          )}&date=${userPost.updatedAt}`,
        ],
        siteName: "Codú",
      },
      twitter: {
        description: userPost.excerpt ?? undefined,
        images: [`/og?title=${encodeURIComponent(userPost.title)}`],
      },
      alternates: {
        // Cross-posted content points at the original; native posts self-canonical
        // so trailing-slash / query-param / legacy-path variants don't dilute.
        canonical: userPost.canonicalUrl ?? `/${username}/${slug}`,
      },
    };
  }

  const userArticle = await getUserArticleContent(username, slug);
  if (userArticle && userArticle.user) {
    const tags = userArticle.tags?.map((t) => t.tag.title) || [];
    const host = (await headers()).get("host") || "";
    const articleAuthorName = userArticle.user.name || "Unknown";

    return {
      title: `${userArticle.title} | by ${articleAuthorName} | Codú`,
      authors: {
        name: articleAuthorName,
        url: `https://www.${host}/${userArticle.user.username}`,
      },
      keywords: tags,
      description: userArticle.excerpt,
      openGraph: {
        description: userArticle.excerpt || "",
        type: "article",
        images: [
          `/og?title=${encodeURIComponent(
            userArticle.title,
          )}&readTime=${userArticle.readTimeMins || 5}&author=${encodeURIComponent(
            userArticle.user.name || "",
          )}&date=${userArticle.updatedAt}`,
        ],
        siteName: "Codú",
      },
      twitter: {
        description: userArticle.excerpt || "",
        images: [`/og?title=${encodeURIComponent(userArticle.title)}`],
      },
      alternates: {
        canonical: userArticle.canonicalUrl ?? `/${username}/${slug}`,
      },
    };
  }

  const userLinkPost = await getUserLinkPost(username, slug);
  if (userLinkPost && userLinkPost.user) {
    const host = (await headers()).get("host") || "";
    const linkAuthorName = userLinkPost.user.name || "Unknown";

    return {
      title: `${userLinkPost.title} | shared by ${linkAuthorName} | Codú`,
      authors: {
        name: linkAuthorName,
        url: `https://www.${host}/${userLinkPost.user.username}`,
      },
      description: userLinkPost.excerpt || `Link shared by ${linkAuthorName}`,
      openGraph: {
        title: userLinkPost.title,
        description: userLinkPost.excerpt || `Link shared by ${linkAuthorName}`,
        images: userLinkPost.coverImage ? [userLinkPost.coverImage] : undefined,
        siteName: "Codú",
      },
      // Member-shared links carry the user's own commentary + discussion, so we
      // keep Codú as canonical (aggregated feed links canonical to their source).
      alternates: {
        canonical: `/${username}/${slug}`,
      },
    };
  }

  const feedArticle = await getFeedArticle(username, slug);
  if (feedArticle) {
    return {
      title: `${feedArticle.title} | Codú Feed`,
      description:
        feedArticle.excerpt || `Discussion about ${feedArticle.title}`,
      openGraph: {
        title: feedArticle.title,
        description:
          feedArticle.excerpt || `Discussion about ${feedArticle.title}`,
        images:
          feedArticle.ogImageUrl || feedArticle.imageUrl
            ? [feedArticle.ogImageUrl || feedArticle.imageUrl!]
            : undefined,
      },
    };
  }

  const linkContent = await getLinkContent(username, slug);
  if (linkContent) {
    return {
      title: `${linkContent.title} | Codú Feed`,
      description:
        linkContent.excerpt || `Discussion about ${linkContent.title}`,
      openGraph: {
        title: linkContent.title,
        description:
          linkContent.excerpt || `Discussion about ${linkContent.title}`,
        images:
          linkContent.ogImageUrl || linkContent.imageUrl
            ? [linkContent.ogImageUrl || linkContent.imageUrl!]
            : undefined,
      },
    };
  }

  return { title: "Content Not Found" };
}

const UnifiedPostPage = async (props: Props) => {
  const params = await props.params;
  const session = await getServerAuthSession();
  const { username, slug } = params;

  // urlId-first canonicalization: 301 stale member URLs (title edits / username
  // renames) to the canonical /{username}/{slug}. No-op when already canonical
  // or when the urlId doesn't resolve to a member post (legacy/aggregated).
  await redirectMemberToCanonical(username, slug);

  const host = (await headers()).get("host") || "";

  const userPost = await getUserPost(username, slug, session?.user?.id);

  if (userPost) {
    // Discussions/questions live under /d/{slug} — redirect before rendering.
    if (isDiscussionKind(userPost.type)) {
      permanentRedirect(`/d/${userPost.slug}`);
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
    return <UserLinkDetail username={username} contentSlug={slug} />;
  }

  const feedArticle = await getFeedArticle(username, slug);

  if (feedArticle) {
    const newsArticleSchema = getNewsArticleSchema({
      title: feedArticle.title,
      excerpt: feedArticle.excerpt,
      slug: feedArticle.slug,
      externalUrl: feedArticle.externalUrl || "",
      coverImage: feedArticle.imageUrl || feedArticle.ogImageUrl,
      publishedAt: feedArticle.publishedAt,
      source: {
        name: feedArticle.source?.name || null,
        slug: feedArticle.source?.slug || username,
        logoUrl: feedArticle.source?.logoUrl,
      },
    });

    const breadcrumbSchema = getBreadcrumbSchema([
      { name: "Home", url: "https://www.codu.co" },
      { name: "Feed", url: "https://www.codu.co/feed" },
      {
        name: feedArticle.source?.name || username,
        url: `https://www.codu.co/${feedArticle.source?.slug || username}`,
      },
      { name: feedArticle.title },
    ]);

    return (
      <>
        <JsonLd data={newsArticleSchema} />
        <JsonLd data={breadcrumbSchema} />
        <FeedArticleContent sourceSlug={username} articleSlug={slug} />
      </>
    );
  }

  const linkContent = await getLinkContent(username, slug);

  if (linkContent) {
    const newsArticleSchema = getNewsArticleSchema({
      title: linkContent.title,
      excerpt: linkContent.excerpt,
      slug: linkContent.slug,
      externalUrl: linkContent.externalUrl || "",
      coverImage: linkContent.imageUrl || linkContent.ogImageUrl,
      publishedAt: linkContent.publishedAt,
      source: {
        name: linkContent.source?.name || null,
        slug: linkContent.source?.slug || username,
        logoUrl: linkContent.source?.logoUrl,
      },
    });

    const breadcrumbSchema = getBreadcrumbSchema([
      { name: "Home", url: "https://www.codu.co" },
      { name: "Feed", url: "https://www.codu.co/feed" },
      {
        name: linkContent.source?.name || username,
        url: `https://www.codu.co/${linkContent.source?.slug || username}`,
      },
      { name: linkContent.title },
    ]);

    return (
      <>
        <JsonLd data={newsArticleSchema} />
        <JsonLd data={breadcrumbSchema} />
        <LinkContentDetail sourceSlug={username} contentSlug={slug} />
      </>
    );
  }

  return notFound();
};

export default UnifiedPostPage;
