import { db } from "@/server/db/index";

import * as Sentry from "@sentry/nextjs";
import "server-only";
import { z } from "zod";
import {
  bookmark,
  post,
  posts,
  user,
  feed_sources,
  post_tags,
  tag,
} from "../db/schema";
import { eq, and, isNotNull, lte, desc, sql } from "drizzle-orm";

export const GetPostSchema = z.object({
  slug: z.string(),
});

export const GetPreviewSchema = z.object({
  id: z.string(),
});

export const GetTrendingSchema = z.object({
  currentUserId: z.string().optional(),
});

type GetPost = z.infer<typeof GetPostSchema>;
type GetPreview = z.infer<typeof GetPreviewSchema>;
type GetTrending = z.infer<typeof GetTrendingSchema>;

export async function getPost({ slug }: GetPost) {
  try {
    GetPostSchema.parse({ slug });

    const response = await db.query.post.findFirst({
      columns: {
        id: true,
        title: true,
        body: true,
        published: true,
        updatedAt: true,
        readTimeMins: true,
        slug: true,
        excerpt: true,
        canonicalUrl: true,
        showComments: true,
        upvotes: true,
        downvotes: true,
      },
      where: (posts, { eq }) => eq(posts.slug, slug),
      with: {
        tags: {
          columns: { id: true },
          with: { tag: { columns: { title: true } } },
        },
        user: {
          columns: {
            name: true,
            image: true,
            username: true,
            bio: true,
            id: true,
          },
        },
      },
    });

    if (!response) {
      return null;
    }
    return response;
  } catch (error) {
    Sentry.captureException(error);
    throw new Error("Error fetching post");
  }
}

export async function getPostPreview({ id }: GetPreview) {
  try {
    GetPreviewSchema.parse({ id });

    // Use direct query with join instead of ORM relations
    const result = await db
      .select({
        id: posts.id,
        title: posts.title,
        body: posts.body,
        publishedAt: posts.publishedAt,
        updatedAt: posts.updatedAt,
        readingTime: posts.readingTime,
        slug: posts.slug,
        excerpt: posts.excerpt,
        canonicalUrl: posts.canonicalUrl,
        showComments: posts.showComments,
        userName: user.name,
        userImage: user.image,
        userUsername: user.username,
        userBio: user.bio,
        userId: user.id,
      })
      .from(posts)
      .leftJoin(user, eq(posts.authorId, user.id))
      .where(eq(posts.id, id))
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    const postData = result[0];

    // Get tags separately
    const postTags = await db
      .select({
        id: post_tags.id,
        tagTitle: tag.title,
      })
      .from(post_tags)
      .innerJoin(tag, eq(post_tags.tagId, tag.id))
      .where(eq(post_tags.postId, id));

    // Map to expected format for backward compatibility
    return {
      id: postData.id,
      title: postData.title,
      body: postData.body,
      published: postData.publishedAt,
      updatedAt: postData.updatedAt,
      readTimeMins: postData.readingTime,
      slug: postData.slug,
      excerpt: postData.excerpt,
      canonicalUrl: postData.canonicalUrl,
      showComments: postData.showComments,
      user: {
        id: postData.userId,
        name: postData.userName,
        image: postData.userImage,
        username: postData.userUsername,
        bio: postData.userBio,
      },
      tags: postTags.map((pt) => ({ id: pt.id, tag: { title: pt.tagTitle } })),
    };
  } catch (error) {
    console.error("getPostPreview error:", error);
    Sentry.captureException(error);
    throw new Error("Error fetching post");
  }
}

export async function getTrending({ currentUserId }: GetTrending) {
  try {
    GetTrendingSchema.parse({ currentUserId });
    const TRENDING_COUNT = 5;

    let bookmarked;
    if (currentUserId)
      bookmarked = db
        .select()
        .from(bookmark)
        .where(eq(bookmark.userId, currentUserId))
        .as("bookmarked");

    const baseQuery = db
      .select({
        post: {
          id: post.id,
          slug: post.slug,
          title: post.title,
          excerpt: post.excerpt,
          published: post.published,
          readTimeMins: post.readTimeMins,
          likes: post.likes,
          updatedAt: post.updatedAt,
        },
        user: { name: user.name, username: user.username, image: user.image },
        ...(bookmarked ? { bookmarked: { id: bookmarked.id } } : {}),
      })
      .from(post)
      .leftJoin(user, eq(post.userId, user.id))
      .where(
        and(
          isNotNull(post.published),
          lte(post.published, new Date().toISOString()),
        ),
      )
      .limit(20)
      .orderBy(desc(post.likes));

    if (bookmarked) {
      baseQuery.leftJoin(bookmarked, eq(bookmarked.postId, post.id));
    }

    const response = await baseQuery.execute();

    const cleaned = response.map((elem) => {
      const currentUserBookmarkedPost = elem.bookmarked
        ? !!elem.bookmarked
        : false;
      return { ...elem.post, user: elem.user, currentUserBookmarkedPost };
    });

    const shuffled = cleaned.sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, TRENDING_COUNT);

    return selected;
  } catch (error) {
    Sentry.captureException(error);
    return null;
  }
}

export type TrendingItem = {
  type: "post" | "feed";
  id: string | number;
  slug: string;
  title: string;
  excerpt: string | null;
  publishedAt: string | null;
  readTimeMins: number;
  upvotes: number;
  downvotes: number;
  score: number;
  // For posts (user articles)
  username?: string;
  authorName?: string | null;
  authorImage?: string | null;
  // For feed articles
  sourceSlug?: string;
  sourceName?: string | null;
  sourceImage?: string | null;
  externalUrl?: string | null;
  imageUrl?: string | null;
  isBookmarked?: boolean;
};

export const GetUnifiedTrendingSchema = z.object({
  currentUserId: z.string().optional(),
  limit: z.number().min(1).max(30).default(8),
});

type GetUnifiedTrending = z.infer<typeof GetUnifiedTrendingSchema>;

export async function getUnifiedTrending({
  currentUserId,
  limit = 8,
}: GetUnifiedTrending): Promise<TrendingItem[] | null> {
  try {
    GetUnifiedTrendingSchema.parse({ currentUserId, limit });

    // Get trending user posts (using new posts table with type: "article")
    const userPostsQuery = db
      .select({
        id: posts.id,
        slug: posts.slug,
        title: posts.title,
        excerpt: posts.excerpt,
        publishedAt: posts.publishedAt,
        readTimeMins: posts.readingTime,
        upvotes: posts.upvotesCount,
        downvotes: posts.downvotesCount,
        username: user.username,
        authorName: user.name,
        authorImage: user.image,
      })
      .from(posts)
      .leftJoin(user, eq(posts.authorId, user.id))
      .where(
        and(
          eq(posts.type, "article"),
          eq(posts.status, "published"),
          isNotNull(posts.publishedAt),
          lte(posts.publishedAt, new Date().toISOString()),
        ),
      )
      .orderBy(desc(sql`(${posts.upvotesCount} - ${posts.downvotesCount})`))
      .limit(limit);

    // Get trending feed articles (using new posts table with type: "link")
    const feedQuery = db
      .select({
        id: posts.id,
        slug: posts.slug,
        title: posts.title,
        excerpt: posts.excerpt,
        publishedAt: posts.publishedAt,
        upvotes: posts.upvotesCount,
        downvotes: posts.downvotesCount,
        externalUrl: posts.externalUrl,
        imageUrl: posts.coverImage,
        sourceSlug: feed_sources.slug,
        sourceName: feed_sources.name,
        sourceImage: feed_sources.logoUrl,
      })
      .from(posts)
      .leftJoin(feed_sources, eq(posts.sourceId, feed_sources.id))
      .where(
        and(
          eq(posts.type, "link"),
          eq(posts.status, "published"),
          eq(feed_sources.status, "active"),
        ),
      )
      .orderBy(desc(sql`(${posts.upvotesCount} - ${posts.downvotesCount})`))
      .limit(limit);

    const [userPosts, feedArticles] = await Promise.all([
      userPostsQuery,
      feedQuery,
    ]);

    // Transform posts to unified format
    const transformedPosts: TrendingItem[] = userPosts.map((p) => ({
      type: "post" as const,
      id: p.id,
      slug: p.slug,
      title: p.title,
      excerpt: p.excerpt,
      publishedAt: p.publishedAt,
      readTimeMins: p.readTimeMins ?? 5,
      upvotes: p.upvotes ?? 0,
      downvotes: p.downvotes ?? 0,
      score: (p.upvotes ?? 0) - (p.downvotes ?? 0),
      username: p.username ?? undefined,
      authorName: p.authorName,
      authorImage: p.authorImage,
    }));

    // Transform feed articles to unified format
    const transformedFeed: TrendingItem[] = feedArticles
      .filter((f) => f.slug) // Filter out articles without valid slugs
      .map((f) => ({
        type: "feed" as const,
        id: f.id,
        slug: f.slug as string,
        title: f.title,
        excerpt: f.excerpt,
        publishedAt: f.publishedAt,
        readTimeMins: 5, // Default read time for external articles
        upvotes: f.upvotes ?? 0,
        downvotes: f.downvotes ?? 0,
        score: (f.upvotes ?? 0) - (f.downvotes ?? 0),
        sourceSlug: f.sourceSlug ?? undefined,
        sourceName: f.sourceName,
        sourceImage: f.sourceImage,
        externalUrl: f.externalUrl,
        imageUrl: f.imageUrl,
      }));

    // Combine and sort by score, then shuffle for variety
    const combined = [...transformedPosts, ...transformedFeed];
    combined.sort((a, b) => b.score - a.score);

    // Take top items, then shuffle to add variety
    const topItems = combined.slice(0, limit * 2);
    const shuffled = topItems.sort(() => 0.5 - Math.random());

    return shuffled.slice(0, limit);
  } catch (error) {
    Sentry.captureException(error);
    return null;
  }
}
