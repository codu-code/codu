"use client";

import { api } from "@/server/trpc/react";

interface PopularTagsSidebarProps {
  selectedTag?: string | null;
  onTagClick: (tag: string | null) => void;
}

export function PopularTagsSidebar({
  selectedTag,
  onTagClick,
}: PopularTagsSidebarProps) {
  const { data, status } = api.tag.getPopular.useQuery({ limit: 15 });

  if (status === "pending") {
    return (
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="h-8 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700"
          />
        ))}
      </div>
    );
  }

  if (status === "error" || !data?.data?.length) {
    return null;
  }

  // Format post count for display
  const formatCount = (count: number): string => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    }
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  return (
    <div>
      <h3 className="mb-4 text-2xl font-semibold leading-6 tracking-wide">
        Popular Tags
      </h3>
      <div className="flex flex-wrap gap-2">
        {data.data.map((tag) => (
          <button
            key={tag.id}
            onClick={() =>
              onTagClick(selectedTag === tag.slug ? null : tag.slug)
            }
            className={`group flex items-center gap-1.5 rounded border px-3 py-1.5 text-sm transition-colors ${
              selectedTag === tag.slug
                ? "border-accent bg-accent/10 text-accent dark:border-accent dark:bg-accent/15 dark:text-accent"
                : "border-neutral-300 bg-white text-neutral-700 hover:border-neutral-400 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:border-neutral-500"
            }`}
          >
            <span>{tag.title}</span>
            {tag.postCount > 0 && (
              <span
                className={`text-xs ${
                  selectedTag === tag.slug
                    ? "text-accent dark:text-accent"
                    : "text-neutral-400 dark:text-neutral-500"
                }`}
              >
                {formatCount(tag.postCount)}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
