import { db } from "@/server/db/index";

import * as Sentry from "@sentry/nextjs";
import "server-only";
import { z } from "zod";
import { bookmark, post, user } from "../db/schema";
import { eq, and, isNotNull, lte, desc } from "drizzle-orm";

export const GetPostSchema = z.object({
  slug: z.string(),
});

export const GetTrendingSchema = z.object({
  currentUserId: z.string().optional(),
});

type GetPost = z.infer<typeof GetPostSchema>;
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
        bookmarks: { columns: { userId: true } },
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

    if (!response || response.published === null) {
      return null;
    }
    const currentUserBookmarkedPost = !!response.bookmarks.length;
    response.bookmarks = [];
    return { ...response, currentUserBookmarkedPost };
  } catch (error) {
    Sentry.captureException(error);
    throw new Error("Error fetching post");
  }
}

export async function getTrending({ currentUserId }: GetTrending) {
  try {
    GetTrendingSchema.parse({ currentUserId });
    const TRENDING_COUNT = 5;

    const bookmarked = db
      .select()
      .from(bookmark)
      // if user not logged in just default to searching for "" as user which will always result in post not being bookmarked
      // TODO figure out a way to skip this entire block if user is not logged in
      .where(eq(bookmark.userId, currentUserId || ""))
      .as("bookmarked");

    const response = await db
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
        bookmarked: { id: bookmarked.id },
        user: { name: user.name, username: user.username, image: user.image },
      })
      .from(post)
      .leftJoin(user, eq(post.userId, user.id))
      .leftJoin(bookmarked, eq(bookmarked.postId, post.id))
      .where(
        and(
          isNotNull(post.published),
          lte(post.published, new Date().toISOString()),
        ),
      )
      .limit(20)
      .orderBy(desc(post.likes));

    const cleaned = response.map((elem) => {
      let currentUserBookmarkedPost = !!elem.bookmarked;
      if (currentUserId === undefined) currentUserBookmarkedPost = false;
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
