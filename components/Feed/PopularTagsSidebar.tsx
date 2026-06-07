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
            className="h-8 animate-pulse rounded bg-elevated"
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
                : "border-hairline bg-surface text-muted hover:border-accent/50"
            }`}
          >
            <span>{tag.title}</span>
            {tag.postCount > 0 && (
              <span
                className={`text-xs ${
                  selectedTag === tag.slug
                    ? "text-accent dark:text-accent"
                    : "text-faint"
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
