"use client";

import { api } from "@/server/trpc/react";
import { SavedItemCard } from "@/components/SavedItemCard";

// POST = member-authored content (shows the author); LINK = aggregated source
// content (shows the source). Member discussions/TILs/links are all POSTs.
const toFrontendType = (sourceSlug: string | null): "POST" | "LINK" => {
  return sourceSlug ? "LINK" : "POST";
};

const SavedPosts = () => {
  const {
    data: bookmarksData,
    refetch,
    status: bookmarkStatus,
  } = api.post.myBookmarks.useQuery({ limit: 100 });
  const bookmarks = bookmarksData?.items || [];

  const { mutate: bookmark } = api.post.bookmark.useMutation({
    onSettled() {
      refetch();
    },
  });

  const removeSavedItem = async (postId: string) => {
    try {
      await bookmark({ postId, setBookmarked: false });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="relative mx-4 max-w-2xl sm:mx-auto">
      <div className="mb-6">
        <p className="eyebrow">
          <span className="slash">{"// "}</span>
          {bookmarks.length} saved
        </p>
        <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-fg">
          Saved
        </h1>
      </div>
      <div className="space-y-2">
        {bookmarkStatus === "pending" &&
          Array.from({ length: 7 }, (_, i) => (
            <div
              key={i}
              className="h-16 animate-pulse rounded-lg bg-elevated"
            />
          ))}
        {bookmarkStatus === "error" && (
          <p className="py-4 font-medium text-danger">
            Something went wrong fetching your saved posts... Refresh the page.
          </p>
        )}

        {bookmarkStatus === "success" &&
          bookmarks.map((item) => (
            <SavedItemCard
              key={item.id}
              id={item.id}
              title={item.title}
              slug={item.slug}
              urlId={item.urlId}
              publishedAt={item.publishedAt}
              sourceName={item.sourceName}
              sourceSlug={item.sourceSlug}
              authorName={item.authorName}
              authorUsername={item.authorUsername}
              authorImage={item.authorImage}
              type={toFrontendType(item.sourceSlug)}
              dbType={item.type}
              onRemove={() => removeSavedItem(item.id)}
            />
          ))}

        {bookmarkStatus === "success" && bookmarks?.length === 0 && (
          <div className="rounded-lg border border-dashed border-hairline p-12 text-center font-mono text-sm text-faint">
            {"// "}nothing saved yet — your saved posts will show up here
          </div>
        )}
      </div>
    </div>
  );
};

export default SavedPosts;
