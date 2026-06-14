import { cache } from "react";
import { headers } from "next/headers";
import { notFound, permanentRedirect } from "next/navigation";
import { type Metadata } from "next";
import { SITE_ORIGIN } from "@/config/site";
import { ogPostImage } from "@/lib/og/url";
import { getServerAuthSession } from "@/server/auth";
import { db } from "@/server/db";
import { posts, user, post_tags, tag, comments } from "@/server/db/schema";
import { eq, and, lte, inArray, or, isNull, asc, type SQL } from "drizzle-orm";
import PostReader, {
  type ReaderPost,
} from "@/components/ContentDetail/PostReader";
import { parseUrlId, canonicalMismatch } from "@/server/lib/content-url";
import { JsonLd } from "@/components/JsonLd";
import {
  getDiscussionForumPostingSchema,
  getBreadcrumbSchema,
} from "@/lib/structured-data";

type Props = { params: Promise<{ slug: string }> };

// Resolve a discussion/question post by its urlId (parsed from the slug).
// Mirrors getUserPost's query shape but scoped to discussion kinds; canonical
// path is /d/{slug}.
async function getDiscussionPostUncached(
  slug: string,
  viewerId?: string | null,
): Promise<ReaderPost | null> {
  const urlId = parseUrlId(slug);
  if (!urlId) return null;

  // Match on urlId, falling back to a full-slug match for legacy posts whose
  // slug predates the slug-ends-with-urlId convention.
  const idMatch: SQL =
    urlId === slug
      ? eq(posts.urlId, urlId)
      : or(eq(posts.urlId, urlId), eq(posts.slug, slug))!;

  const publicFilter = and(
    eq(posts.status, "published"),
    lte(posts.publishedAt, new Date().toISOString()),
  );

  // Owner bypass: the author may view their own in_review/rejected discussion;
  // everyone else only sees published.
  const [row] = await db
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
        idMatch,
        inArray(posts.type, ["discussion", "question"]),
        viewerId
          ? or(
              publicFilter,
              and(
                eq(posts.authorId, viewerId),
                inArray(posts.status, ["in_review", "rejected"]),
              ),
            )
          : publicFilter,
      ),
    )
    .limit(1);

  if (!row) return null;

  const tagsResult = await db
    .select({ title: tag.title, slug: tag.slug })
    .from(post_tags)
    .innerJoin(tag, eq(post_tags.tagId, tag.id))
    .where(eq(post_tags.postId, row.id));

  return {
    id: row.id,
    title: row.title,
    body: row.body,
    status: row.status,
    publishedAt: row.publishedAt,
    published: row.publishedAt,
    updatedAt: row.updatedAt,
    readTimeMins: row.readingTime,
    slug: row.slug,
    excerpt: row.excerpt,
    canonicalUrl: row.canonicalUrl,
    showComments: row.showComments,
    upvotes: row.upvotesCount,
    downvotes: row.downvotesCount,
    type: row.type,
    moderationNote: row.moderationNote,
    tags: tagsResult.map((t) => ({ tag: { title: t.title, slug: t.slug } })),
    user: {
      id: row.authorId,
      name: row.authorName,
      image: row.authorImage,
      username: row.authorUsername,
      bio: row.authorBio,
    },
  };
}

// Per-request dedupe between generateMetadata and the page body.
const getDiscussionPost = cache(getDiscussionPostUncached);

// Fetch comments to populate the DiscussionForumPosting `comment[]` for crawlers
// (the visible thread is client-rendered). Excludes soft-deleted; oldest-first.
type ForumComment = {
  id: string;
  body: string | null;
  createdAt: string | null;
  author: { name: string | null; username: string | null };
};

async function getDiscussionComments(postId: string): Promise<ForumComment[]> {
  const rows = await db
    .select({
      id: comments.id,
      body: comments.body,
      createdAt: comments.createdAt,
      authorName: user.name,
      authorUsername: user.username,
    })
    .from(comments)
    .leftJoin(user, eq(comments.authorId, user.id))
    .where(and(eq(comments.postId, postId), isNull(comments.deletedAt)))
    .orderBy(asc(comments.createdAt));

  return rows.map((r) => ({
    id: r.id,
    body: r.body,
    createdAt: r.createdAt,
    author: { name: r.authorName, username: r.authorUsername },
  }));
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { slug } = await props.params;
  // Same viewerId as the page body so the cache()d resolver runs once per request.
  const session = await getServerAuthSession();
  const post = await getDiscussionPost(slug, session?.user?.id);

  if (!post) {
    return { title: "Discussion Not Found" };
  }

  const canonical = `/d/${post.slug}`;
  if (canonicalMismatch(`/d/${slug}`, canonical)) {
    permanentRedirect(canonical);
  }

  const authorName = post.user.name || "Unknown";
  const ogImage = ogPostImage({
    kind: "discussion",
    title: post.title,
    authorName,
    authorKey: post.user.username ?? authorName,
    tags: post.tags.map((t) => t.tag.title),
    updatedAt: post.updatedAt,
  });

  return {
    title: `${post.title} — Discussion | Codú`,
    description: post.excerpt ?? undefined,
    alternates: { canonical },
    authors: post.user.username
      ? { name: authorName, url: `${SITE_ORIGIN}/${post.user.username}` }
      : { name: authorName },
    openGraph: {
      title: post.title,
      description: post.excerpt ?? undefined,
      type: "article",
      siteName: "Codú",
      url: canonical,
      publishedTime: post.published ?? undefined,
      modifiedTime: post.updatedAt ?? undefined,
      images: [ogImage],
    },
    twitter: {
      card: "summary_large_image",
      description: post.excerpt ?? undefined,
      images: [ogImage],
    },
  };
}

const DiscussionPage = async (props: Props) => {
  const { slug } = await props.params;
  const session = await getServerAuthSession();

  const post = await getDiscussionPost(slug, session?.user?.id);

  if (!post) return notFound();

  // Canonical = /d/{slug} (the slug already ends with the urlId). 301 stale
  // URLs (title edits) or a bare/wrong-slug urlId segment to canonical.
  const canonical = `/d/${post.slug}`;
  if (canonicalMismatch(`/d/${slug}`, canonical)) {
    permanentRedirect(canonical);
  }

  const host = (await headers()).get("host") || "";

  const forumComments = await getDiscussionComments(post.id);

  const discussionForumSchema = getDiscussionForumPostingSchema({
    title: post.title,
    body: post.body,
    excerpt: post.excerpt,
    slug: post.slug,
    publishedAt: post.published,
    updatedAt: post.updatedAt,
    upvotes: post.upvotes,
    author: {
      name: post.user.name,
      username: post.user.username,
      image: post.user.image,
      bio: post.user.bio,
    },
    comments: forumComments,
  });

  const breadcrumbSchema = getBreadcrumbSchema([
    { name: "Home", url: SITE_ORIGIN },
    { name: "Discussions", url: `${SITE_ORIGIN}/discussions` },
    { name: post.title },
  ]);

  return (
    <>
      <JsonLd data={discussionForumSchema} />
      <JsonLd data={breadcrumbSchema} />
      <PostReader
        post={post}
        session={session}
        host={host}
        canonicalPath={canonical}
        commentsDisabledLabel="discussion"
        emitArticleSchema={false}
      />
    </>
  );
};

export default DiscussionPage;
