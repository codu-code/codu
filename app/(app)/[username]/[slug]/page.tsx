import { headers } from "next/headers";
import { notFound, permanentRedirect } from "next/navigation";
import { getServerAuthSession } from "@/server/auth";
import { type Metadata } from "next";
import { db } from "@/server/db";
import { posts, user, feed_sources, post_tags, tag } from "@/server/db/schema";
import { eq, and, lte, inArray, or } from "drizzle-orm";
import UserLinkDetail from "./_userLinkDetail";
import PostReader from "@/components/ContentDetail/PostReader";
import { parseUrlId, canonicalMismatch } from "@/server/lib/content-url";
import { JsonLd } from "@/components/JsonLd";
import { getArticleSchema, getBreadcrumbSchema } from "@/lib/structured-data";

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

  // Owner bypass: the author may view their own in_review/rejected post;
  // everyone else only sees published posts whose publish time has passed.
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

async function getUserArticleContent(username: string, contentSlug: string) {
  return getUserPost(username, contentSlug);
}

// Resolve a member post by its urlId to its canonical username + slug.
// Aggregated/source content (no author) is excluded; a miss returns null so
// callers fall back to username+slug resolution.
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

// Does a published post live at the EXACT (username, slug) requested? Suppresses
// urlId-based redirects so a slug whose trailing token collides with another
// post's urlId isn't hijacked (301'd) to that other post.
async function exactPublishedPostExists(
  username: string,
  slug: string,
): Promise<boolean> {
  const [match] = await db
    .select({ id: posts.id })
    .from(posts)
    .innerJoin(user, eq(posts.authorId, user.id))
    .where(
      and(
        eq(user.username, username),
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

  const userPost = await getUserPost(username, slug);
  if (userPost) {
    // Discussions/questions canonicalize to /d/{slug}; redirect before metadata.
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
        url: `https://${host}/${userPost.user.username}`,
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
        // Cross-posted content points at the original; native posts self-canonical.
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
        url: `https://${host}/${userArticle.user.username}`,
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
        url: `https://${host}/${userLinkPost.user.username}`,
      },
      description: userLinkPost.excerpt || `Link shared by ${linkAuthorName}`,
      openGraph: {
        title: userLinkPost.title,
        description: userLinkPost.excerpt || `Link shared by ${linkAuthorName}`,
        images: userLinkPost.coverImage ? [userLinkPost.coverImage] : undefined,
        siteName: "Codú",
      },
      // Member-shared links keep Codú as canonical (aggregated links point to source).
      alternates: {
        canonical: `/${username}/${slug}`,
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
      { name: "Home", url: "https://www.codu.co" },
      {
        name: linkAuthorName,
        url: `https://www.codu.co/${userLinkPost.user.username}`,
      },
      { name: userLinkPost.title },
    ]);

    return (
      <>
        <JsonLd data={articleSchema} />
        <JsonLd data={breadcrumbSchema} />
        <UserLinkDetail username={username} contentSlug={slug} />
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
