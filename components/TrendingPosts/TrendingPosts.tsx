"use server";

import Link from "next/link";
import ArticlePreview from "@/components/ArticlePreview/ArticlePreview";
import { getTrending } from "@/server/lib/posts";
import { type Session } from "next-auth";

type TrendingPostsProps = {
  session: Session | null;
};

export default async function TrendingPosts({ session }: TrendingPostsProps) {
  const userId = session?.user?.id ?? undefined;

  const trendingPosts = await getTrending({
    currentUserId: userId,
  });

  // Refactor with option to refresh
  if (!trendingPosts)
    return (
      <div className="relative mt-4 text-lg font-semibold md:col-span-7">
        Something went wrong... Please refresh the page.
      </div>
    );

  return (
    <div className="relative md:col-span-7">
      <section>
        {trendingPosts.map(
          ({
            slug,
            title,
            excerpt,
            user,
            updatedAt,
            readTimeMins,
            id,
            currentUserBookmarkedPost,
          }) => (
            <ArticlePreview
              key={title}
              id={id}
              slug={slug}
              title={title}
              excerpt={excerpt}
              name={user?.name || ""}
              username={user?.username || ""}
              image={user?.image || ""}
              date={updatedAt}
              readTime={readTimeMins}
              bookmarkedInitialState={currentUserBookmarkedPost}
            />
          ),
        )}
      </section>
      <div className="flex justify-center">
        <Link className="secondary-button w-full" href="/articles">
          View more articles →
        </Link>
      </div>
    </div>
  );
}
