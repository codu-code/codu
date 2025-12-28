import ArticleLoading from "@/components/ArticlePreview/ArticleLoading";

function LoadingTrendingPosts() {
  return (
    <div>
      {Array.from({ length: 5 }, (_, i) => (
        <ArticleLoading key={i} />
      ))}
    </div>
  );
}

export default LoadingTrendingPosts;
