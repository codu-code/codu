import { db } from "@/server/db/index";

import * as Sentry from "@sentry/nextjs";
import "server-only";
import { z } from "zod";
import { bookmark, post, user } from "../db/schema";
import { eq, and, isNotNull, lte, desc } from "drizzle-orm";

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

    console.log("ALSDJHKASJHD ASKH");

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
      },
      where: (posts, { eq }) => eq(posts.id, id),
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
