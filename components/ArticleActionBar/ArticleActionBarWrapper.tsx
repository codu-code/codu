"use client";

import { api } from "@/server/trpc/react";
import ArticleActionBar from "./ArticleActionBar";

interface ArticleActionBarWrapperProps {
  postId: string;
  postTitle: string;
  postUrl: string;
  postUsername: string;
  initialUpvotes: number;
  initialDownvotes: number;
}

const ArticleActionBarWrapper = ({
  postId,
  postTitle,
  postUrl,
  postUsername,
  initialUpvotes,
  initialDownvotes,
}: ArticleActionBarWrapperProps) => {
  const { data, isLoading } = api.post.sidebarData.useQuery({
    id: postId,
  });

  if (isLoading) {
    return (
      <div className="flex items-center gap-2">
        <div className="h-10 w-24 animate-pulse rounded-full bg-neutral-200 dark:bg-neutral-700" />
        <div className="h-10 w-20 animate-pulse rounded-full bg-neutral-200 dark:bg-neutral-700" />
        <div className="h-10 w-16 animate-pulse rounded-full bg-neutral-200 dark:bg-neutral-700" />
        <div className="h-10 w-16 animate-pulse rounded-full bg-neutral-200 dark:bg-neutral-700" />
      </div>
    );
  }

  return (
    <ArticleActionBar
      postId={postId}
      postTitle={postTitle}
      postUrl={postUrl}
      postUsername={postUsername}
      initialUpvotes={data?.upvotes ?? initialUpvotes}
      initialDownvotes={data?.downvotes ?? initialDownvotes}
      initialUserVote={data?.userVote ?? null}
      initialBookmarked={data?.currentUserBookmarked ?? false}
    />
  );
};

export default ArticleActionBarWrapper;
