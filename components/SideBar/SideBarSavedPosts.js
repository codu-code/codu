import { trpc } from "@/utils/trpc";
import { Children } from "react";

import SideBarSavedArticlePreview from "./SideBarSavedArticlePreview";
import Link from "next/link";

export default function SideBarSavedPosts() {
  let { data: bookmarks, status: bookmarkStatus } = trpc.post.myBookmarks.useQuery();

  const howManySavedToShow = 3;
  const totalNumberSaved = bookmarks?.length;

  if (bookmarks) bookmarks = bookmarks.sort(() => Math.random() - 0.5).slice(0, howManySavedToShow);

  return (
    <div className="overflow-hidden w-full">
      <h3 className="text-2xl leading-6 font-semibold tracking-wide mb-4 mt-8">Saved posts</h3>
      <div className="w-full">
        {bookmarkStatus === "loading" &&
          Children.toArray(
            Array.from({ length: howManySavedToShow }, () => {
              return <LoadingSkeleton />;
            })
          )}
        {bookmarkStatus === "error" && <p className="font-medium py-4">Something went wrong fetching your saved posts... Refresh the page.</p>}

        {bookmarks &&
          bookmarkStatus === "success" &&
          bookmarks.map(({ id, slug, title, user: { name, image, username }, updatedAt, readTimeMins }) => {
            return (
              <SideBarSavedArticlePreview
                key={id}
                username={username || ""}
                slug={slug}
                title={title}
                name={name}
                image={image}
                date={updatedAt.toISOString()}
                readTime={readTimeMins}
              />
            );
          })}
        {bookmarkStatus === "success" && bookmarks?.length === 0 && (
          <p className="font-medium py-4">Saved posts will be displayed in this section for easy access.</p>
        )}
      </div>
      {totalNumberSaved && totalNumberSaved > howManySavedToShow && (
        <Link href="/saved" className="fancy-link semibold text-2xl">
          All saved{" "}
        </Link>
      )}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="shadow p-4 w-full my-4 h-32 bg-white dark:bg-neutral-900 animate-pulse flex flex-col ">
      <div className="grow flex items-center">
        <div className="h-5 w-full bg-neutral-300 dark:bg-neutral-800 rounded"></div>
      </div>
      <div className="flex items-center grow">
        <div className="mx-2 rounded-full bg-neutral-300 dark:bg-neutral-800 h-8 w-8"></div>
        <div className="ml-2">
          <div className="h-2.5 w-36 bg-neutral-300 dark:bg-neutral-800 rounded mb-2"></div>
          <div className="h-2.5 w-36 bg-neutral-300 dark:bg-neutral-800 rounded"></div>
        </div>
      </div>
    </div>
  );
}
