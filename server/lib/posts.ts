import db from "@/server/db/client";
import * as Sentry from "@sentry/nextjs";
import "server-only";
import { z } from "zod";

export const GetPostSchema = z.object({
  slug: z.string(),
});

export const GetTrendingSchema = z.object({
  currentUserId: z.string(),
});

type GetPost = z.infer<typeof GetPostSchema>;
type GetTrending = z.infer<typeof GetTrendingSchema>;

export async function getPost({ slug }: GetPost) {
  try {
    GetPostSchema.parse({ slug });

    const response = await db.post.findUnique({
      where: { slug },
      select: {
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
        user: {
          select: {
            name: true,
            image: true,
            username: true,
            bio: true,
            id: true,
          },
        },
        bookmarks: {
          select: { userId: true },
        },
        tags: {
          select: {
            id: true,
            tag: {
              select: {
                title: true,
              },
            },
          },
        },
      },
    });

    if (!response || response.published === null) {
      return null;
    }
    const currentUserLikesPost = !!response.bookmarks.length;
    response.bookmarks = [];
    return { ...response, currentUserLikesPost };
  } catch (error) {
    Sentry.captureException(error);
    throw new Error("Error fetching post");
  }
}

export async function getTrending({ currentUserId }: GetTrending) {
  try {
    GetTrendingSchema.parse({ currentUserId });
    const TRENDING_COUNT = 5;

    const response = await db.post.findMany({
      where: {
        NOT: {
          published: null,
        },
      },
      select: {
        id: true,
        title: true,
        updatedAt: true,
        readTimeMins: true,
        slug: true,
        excerpt: true,
        user: {
          select: { name: true, image: true, username: true },
        },
        bookmarks: {
          select: { userId: true },
          where: { userId: currentUserId },
        },
      },
      take: 20,
      orderBy: {
        likes: {
          _count: "desc",
        },
      },
    });

    const cleaned = response.map((post) => {
      let currentUserLikesPost = !!post.bookmarks.length;
      if (currentUserId === undefined) currentUserLikesPost = false;
      post.bookmarks = [];
      return { ...post, currentUserLikesPost };
    });

    const shuffled = cleaned.sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, TRENDING_COUNT);

    return selected;
  } catch (error) {
    Sentry.captureException(error);
    return null;
  }
}
