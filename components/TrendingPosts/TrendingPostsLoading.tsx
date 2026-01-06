import { FeedItemLoading } from "@/components/Feed";

function LoadingTrendingPosts() {
  return (
    <div>
      {Array.from({ length: 5 }, (_, i) => (
        <FeedItemLoading key={i} />
      ))}
    </div>
  );
}

export default LoadingTrendingPosts;
