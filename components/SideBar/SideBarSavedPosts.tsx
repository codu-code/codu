"use client";
import { api } from "@/server/trpc/react";
import React from "react";
import Link from "next/link";
import { SavedItemCard } from "@/components/SavedItemCard";

// Map DB type to frontend type
const toFrontendType = (dbType: string | null): "POST" | "LINK" => {
  if (dbType === "article") return "POST";
  return "LINK";
};

export default React.memo(function SideBarSavedPosts() {
  const howManySavedToShow = 3;
  const { data: bookmarksData, status: bookmarkStatus } =
    api.post.myBookmarks.useQuery({
      limit: howManySavedToShow,
    });

  const totalNumberSaved = bookmarksData?.items?.length || 0;
  const bookmarks = bookmarksData?.items || [];

  return (
    <div className="w-full">
      <h3 className="mb-4 mt-8 text-2xl font-semibold leading-6 tracking-wide">
        Recent bookmarks
      </h3>
      <div className="w-full space-y-2">
        {bookmarkStatus === "pending" &&
          Array.from({ length: howManySavedToShow }, (_, i) => (
            <LoadingSkeleton key={i} />
          ))}
        {bookmarkStatus === "error" && (
          <p className="py-4 font-medium">
            Something went wrong fetching your saved posts... Refresh the page.
          </p>
        )}

        {bookmarks &&
          bookmarkStatus === "success" &&
          bookmarks.map((item) => (
            <SavedItemCard
              key={item.id}
              id={item.id}
              title={item.title}
              slug={item.slug}
              publishedAt={item.publishedAt}
              sourceName={item.sourceName}
              sourceSlug={item.sourceSlug}
              authorName={item.authorName}
              authorUsername={item.authorUsername}
              authorImage={item.authorImage}
              type={toFrontendType(item.type)}
            />
          ))}
        {bookmarkStatus === "success" && bookmarks?.length === 0 && (
          <p className="py-4 font-medium">
            Recently Saved posts will be displayed in this section for easy
            access.
          </p>
        )}
      </div>
      {(totalNumberSaved && totalNumberSaved > howManySavedToShow && (
        <Link
          href="/saved"
          className="secondary-button mt-4 block w-full text-center"
        >
          View all saved posts
        </Link>
      )) ||
        ""}
    </div>
  );
});

function LoadingSkeleton() {
  return (
    <div className="h-16 animate-pulse rounded-lg bg-neutral-200 dark:bg-neutral-700" />
  );
}
