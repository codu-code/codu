import { headers } from "next/headers";
import { notFound, permanentRedirect } from "next/navigation";
import { type Metadata } from "next";
import { getServerAuthSession } from "@/server/auth";
import { db } from "@/server/db";
import { posts, user, post_tags, tag, comments } from "@/server/db/schema";
import {
  eq,
  and,
  lte,
  inArray,
  or,
  isNull,
  asc,
  type SQL,
} from "drizzle-orm";
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

// Resolve a discussion/question post by its urlId (parsed from the slug). The
// urlId is the immutable canonical resolver; the slug already ends with it, so
// the canonical path is just /d/{slug}. Mirrors getUserPost's query shape
// (author join, tags, owner-bypass visibility) but scoped to discussion kinds.
async function getDiscussionPost(
  slug: string,
  viewerId?: string | null,
): Promise<ReaderPost | null> {
  const urlId = parseUrlId(slug);
  if (!urlId) return null;

  // urlId is the canonical resolver (real posts' slugs end with it). Fall back
  // to a full-slug match so legacy posts whose slug predates the
  // slug-ends-with-urlId convention still resolve; canonical stays /d/{slug}.
  const idMatch: SQL =
    urlId === slug
      ? eq(posts.urlId, urlId)
      : or(eq(posts.urlId, urlId), eq(posts.slug, slug))!;

  const publicFilter = and(
    eq(posts.status, "published"),
    lte(posts.publishedAt, new Date().toISOString()),
  );

  // Owner bypass: the author may view their own discussion while it awaits
  // review or has been hidden. The relaxed branch is only reachable when the
  // viewer's id matches the post author's id (checked after the row loads).
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
    .select({ title: tag.title })
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
    tags: tagsResult.map((t) => ({ tag: { title: t.title } })),
    user: {
      id: row.authorId,
      name: row.authorName,
      image: row.authorImage,
      username: row.authorUsername,
      bio: row.authorBio,
    },
  };
}

// Server-side fetch of the discussion's top-level + nested comments to populate
// the DiscussionForumPosting `comment[]` for crawlers. The visible thread is
// client-rendered (DiscussionArea), so this is the only schema-visible source.
// Excludes soft-deleted ("[deleted]") comments; ordered oldest-first.
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
  const post = await getDiscussionPost(slug);

  if (!post) {
    return { title: "Discussion Not Found" };
  }

  const canonical = `/d/${post.slug}`;
  if (canonicalMismatch(`/d/${slug}`, canonical)) {
    permanentRedirect(canonical);
  }

  const authorName = post.user.name || "Unknown";

  return {
    title: `${post.title} — Discussion | Codú`,
    description: post.excerpt ?? undefined,
    alternates: { canonical },
    openGraph: {
      title: post.title,
      description: post.excerpt ?? undefined,
      type: "article",
      siteName: "Codú",
      images: [
        `/og?title=${encodeURIComponent(
          post.title,
        )}&author=${encodeURIComponent(authorName)}&date=${post.updatedAt}`,
      ],
    },
    twitter: {
      description: post.excerpt ?? undefined,
      images: [`/og?title=${encodeURIComponent(post.title)}`],
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
    { name: "Home", url: "https://www.codu.co" },
    { name: "Discussions", url: "https://www.codu.co/discussions" },
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
