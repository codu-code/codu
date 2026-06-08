import Link from "next/link";
import { getUnifiedTrending } from "@/server/lib/posts";
import { type Session } from "next-auth";
import { UnifiedContentCard } from "@/components/UnifiedContentCard";

type TrendingPostsProps = {
  session: Session | null;
};

export default async function TrendingPosts({ session }: TrendingPostsProps) {
  const userId = session?.user?.id ?? undefined;

  const trendingItems = await getUnifiedTrending({
    currentUserId: userId,
    limit: 20,
  });

  if (!trendingItems) {
    return (
      <div className="relative mt-4 text-lg font-semibold md:col-span-7">
        Something went wrong... Please refresh the page.
      </div>
    );
  }

  return (
    <div className="relative md:col-span-7">
      <section>
        {trendingItems.map((item) => {
          const isPost = item.type === "post";
          return (
            <UnifiedContentCard
              key={`${item.type}-${item.id}`}
              type={isPost ? "POST" : "LINK"}
              id={item.id}
              title={item.title}
              excerpt={item.excerpt}
              slug={item.slug}
              imageUrl={item.imageUrl}
              externalUrl={item.externalUrl}
              publishedAt={item.publishedAt}
              readTimeMins={item.readTimeMins}
              upvotes={item.upvotes}
              downvotes={item.downvotes}
              author={
                isPost
                  ? {
                      name: item.authorName || "",
                      username: item.username || "",
                      image: item.authorImage,
                    }
                  : null
              }
              source={
                !isPost
                  ? {
                      name: item.sourceName || "",
                      slug: item.sourceSlug || null,
                      logo: item.sourceImage,
                    }
                  : null
              }
            />
          );
        })}
      </section>
      <div className="mt-6">
        <Link
          className="secondary-button block w-full text-center"
          href="/"
        >
          View Feed →
        </Link>
      </div>
    </div>
  );
}
