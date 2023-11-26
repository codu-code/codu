import db from "@/server/db/client";
import * as Sentry from "@sentry/nextjs";
import "server-only";

type GetTrending = {
  currentUserId?: string;
};

export async function getTrending({ currentUserId }: GetTrending) {
  try {
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
