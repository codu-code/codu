"use client";
import { Children } from "react";
import { api } from "@/server/trpc/react";
import Link from "next/link";
import ArticleLoading from "../ArticlePreview/ArticleLoading";
import ArticlePreview from "../ArticlePreview/ArticlePreview";

export default function TrendingPostsHome() {
  const { status, data } = api.post.randomTrending.useQuery();

  return (
    <div className="relative md:col-span-7">
      <section>
        {status === "error" && (
          <div className="mt-8">
            Something went wrong... Please refresh your post.
          </div>
        )}
        {status === "loading" &&
          Children.toArray(
            Array.from({ length: 7 }, () => {
              return <ArticleLoading />;
            }),
          )}
        {status === "success" &&
          data.map(
            ({
              slug,
              title,
              excerpt,
              user: { name, image, username },
              updatedAt,
              readTimeMins,
              id,
              currentUserLikesPost,
            }) => (
              <ArticlePreview
                key={title}
                id={id}
                slug={slug}
                title={title}
                excerpt={excerpt}
                name={name}
                username={username || ""}
                image={image}
                date={updatedAt.toISOString()}
                readTime={readTimeMins}
                bookmarkedInitialState={currentUserLikesPost}
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
