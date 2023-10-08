"use client";

import { Children } from "react";
import ArticlePreview from "@/components/ArticlePreview/ArticlePreview";
import { api } from "@/server/trpc/react";
import PageHeading from "@/components/PageHeading/PageHeading";
import ArticleLoading from "@/components/ArticlePreview/ArticleLoading";
import { redirect } from "next/navigation";
import { useSession } from "next-auth/react";

const MyPosts = () => {
  const session = useSession();

  if (!session) {
    redirect("/get-started");
  }

  const {
    data: bookmarks,
    refetch,
    status: bookmarkStatus,
  } = api.post.myBookmarks.useQuery();

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
    <div className="relative sm:mx-auto max-w-2xl mx-4">
      <PageHeading>Saved items</PageHeading>
      <div>
        {bookmarkStatus === "loading" &&
          Children.toArray(
            Array.from({ length: 7 }, () => {
              return <ArticleLoading />;
            }),
          )}
        {bookmarkStatus === "error" && (
          <p className="font-medium py-4">
            Something went wrong fetching your saved posts... Refresh the page.
          </p>
        )}

        {bookmarkStatus === "success" &&
          bookmarks.map(
            ({
              id,
              slug,
              title,
              excerpt,
              user: { name, image, username },
              updatedAt,
              readTimeMins,
            }) => {
              return (
                <ArticlePreview
                  key={id}
                  id={id}
                  username={username || ""}
                  slug={slug}
                  title={title}
                  excerpt={excerpt}
                  name={name}
                  image={image}
                  date={updatedAt.toISOString()}
                  readTime={readTimeMins}
                  showBookmark={false}
                  menuOptions={[
                    {
                      label: "Remove item",
                      postId: id,
                      onClick: () => removeSavedItem(id),
                    },
                  ]}
                />
              );
            },
          )}

        {bookmarkStatus === "success" && bookmarks?.length === 0 && (
          <p className="font-medium py-4">
            Your saved posts will show up here.
          </p>
        )}
      </div>
    </div>
  );
};

export default MyPosts;
