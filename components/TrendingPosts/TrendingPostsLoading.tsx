"use server";

import { Children } from "react";
import ArticleLoading from "@/components/ArticlePreview/ArticleLoading";

function LoadingTrendingPosts() {
  return (
    <div>
      {Children.toArray(
        Array.from({ length: 5 }, () => {
          return <ArticleLoading />;
        }),
      )}
    </div>
  );
}

export default LoadingTrendingPosts;
