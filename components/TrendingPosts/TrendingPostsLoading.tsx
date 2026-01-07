import { FeedItemLoading } from "@/components/Feed";

function LoadingTrendingPosts() {
  return (
    <div className="relative md:col-span-7">
      <section>
        {Array.from({ length: 5 }, (_, i) => (
          <FeedItemLoading key={i} />
        ))}
      </section>
    </div>
  );
}

export default LoadingTrendingPosts;
