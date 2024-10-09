"use client";
import { api } from "@/server/trpc/react";
import React, { Children } from "react";

import SideBarSavedArticlePreview from "./SideBarSavedArticlePreview";
import Link from "next/link";

export default React.memo(function SideBarSavedPosts() {
  const { data: bookmarks, status } = api.post.myBookmarks.useQuery();

  const howManySavedToShow = 3;
  const totalNumberSaved = bookmarks?.length;

  // @TODO query the backend to get the last 3 instead of slice
  const limitedBookmarks = bookmarks?.slice(0, howManySavedToShow) ?? [];

  return (
    <div className="w-full">
      <h3 className="mb-4 mt-8 text-2xl font-semibold leading-6 tracking-wide">
        Recent bookmarks
      </h3>
      <div className="w-full">
        {status === "loading" &&
          Children.toArray(
            Array.from({ length: howManySavedToShow }, () => {
              return <LoadingSkeleton />;
            }),
          )}
        {status === "error" && (
          <p className="py-4 font-medium">
            Something went wrong fetching your saved posts... Refresh the page.
          </p>
        )}

        {status === "success" &&
          (limitedBookmarks.length ? (
            limitedBookmarks.map(
              ({
                id,
                slug,
                title,
                user: { name, username },
                published,
                readTimeMins,
              }) => (
                <SideBarSavedArticlePreview
                  key={id}
                  username={username || ""}
                  slug={slug}
                  title={title}
                  name={name}
                  date={published}
                  readTime={readTimeMins}
                />
              ),
            )
          ) : (
            <p className="py-4 font-medium">
              Recently Saved posts will be displayed in this section for easy
              access.
            </p>
          ))}
      </div>
      {(totalNumberSaved && totalNumberSaved > howManySavedToShow && (
        <Link href="/saved" className="secondary-button w-full">
          View all saved posts →
        </Link>
      )) ||
        ""}
    </div>
  );
});

function LoadingSkeleton() {
  return (
    <div className="my-4 flex h-32 w-full animate-pulse flex-col bg-white p-4 shadow dark:bg-neutral-900">
      <div className="flex grow items-center">
        <div className="h-5 w-full rounded bg-neutral-300 dark:bg-neutral-800"></div>
      </div>
      <div className="flex grow items-center">
        <div className="mx-2 h-8 w-8 rounded-full bg-neutral-300 dark:bg-neutral-800"></div>
        <div className="ml-2">
          <div className="mb-2 h-2.5 w-36 rounded bg-neutral-300 dark:bg-neutral-800"></div>
          <div className="h-2.5 w-36 rounded bg-neutral-300 dark:bg-neutral-800"></div>
        </div>
      </div>
    </div>
  );
}
