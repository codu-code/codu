"use client";

import * as Sentry from "@sentry/nextjs";
import type { NextPage } from "next";
import { useState } from "react";
import { BookmarkIcon } from "@heroicons/react/outline";
import { api } from "@/server/trpc/react";
import { signIn, useSession } from "next-auth/react";
import clsx from "clsx";

type Props = {
  id: string;
  showBookmark?: boolean;
  initialState?: boolean;
};

const ArticleBookmark: NextPage<Props> = ({
  id,
  showBookmark = true,
  initialState = false,
}) => {
  const [bookmarked, setIsBookmarked] = useState(initialState);
  const { data: session } = useSession();

  const { mutate: bookmark, status: bookmarkStatus } =
    api.post.bookmark.useMutation({
      onSettled() {
        setIsBookmarked((isBookmarked) => !isBookmarked);
      },
    });

  const bookmarkPost = async (postId: string, setBookmarked = true) => {
    if (bookmarkStatus === "loading") return;
    try {
      if (!session) {
        signIn();
      }
      return await bookmark({ postId, setBookmarked });
    } catch (err) {
      Sentry.captureException(err);
    }
  };

  const onBookmarkClick = () => {
    return bookmarkPost(id, bookmarked);
  };

  return (
    <>
      {showBookmark && (
        <button
          aria-pressed={bookmarked}
          onClick={onBookmarkClick}
          className="focus-style-rounded rounded-full p-2 hover:bg-neutral-300 dark:hover:bg-neutral-800 lg:mx-auto"
        >
          <span className="sr-only">Add to Bookmarks</span>
          <BookmarkIcon
            className={clsx("w-6", "h-6", bookmarked && "fill-blue-400")}
          />
        </button>
      )}
    </>
  );
};

export default ArticleBookmark;
