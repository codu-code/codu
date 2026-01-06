"use client";

import { api } from "@/server/trpc/react";
import PageHeading from "@/components/PageHeading/PageHeading";
import { SavedItemCard } from "@/components/SavedItemCard";

// Map DB type to frontend type
const toFrontendType = (dbType: string | null): "POST" | "LINK" => {
  if (dbType === "article") return "POST";
  return "LINK";
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
      <PageHeading>Saved items</PageHeading>
      <div className="space-y-2">
        {bookmarkStatus === "pending" &&
          Array.from({ length: 7 }, (_, i) => (
            <div
              key={i}
              className="h-16 animate-pulse rounded-lg bg-neutral-200 dark:bg-neutral-700"
            />
          ))}
        {bookmarkStatus === "error" && (
          <p className="py-4 font-medium">
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
              publishedAt={item.publishedAt}
              sourceName={item.sourceName}
              sourceSlug={item.sourceSlug}
              authorName={item.authorName}
              authorUsername={item.authorUsername}
              authorImage={item.authorImage}
              type={toFrontendType(item.type)}
              onRemove={() => removeSavedItem(item.id)}
            />
          ))}

        {bookmarkStatus === "success" && bookmarks?.length === 0 && (
          <p className="py-4 font-medium">
            Your saved posts will show up here.
          </p>
        )}
      </div>
    </div>
  );
};

export default SavedPosts;
