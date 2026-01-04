"use client";

import { Fragment, useState } from "react";
import {
  ChevronUpIcon,
  ChevronDownIcon,
  BookmarkIcon,
  ChatBubbleLeftIcon,
  ShareIcon,
  EllipsisHorizontalIcon,
} from "@heroicons/react/20/solid";
import { BookmarkIcon as BookmarkOutlineIcon } from "@heroicons/react/24/outline";
import {
  Menu,
  MenuButton,
  MenuItem,
  MenuItems,
  Transition,
} from "@headlessui/react";
import { api } from "@/server/trpc/react";
import { useSession, signIn } from "next-auth/react";
import { toast } from "sonner";
import * as Sentry from "@sentry/nextjs";
import { ReportModal } from "../ReportModal/ReportModal";

interface ArticleActionBarProps {
  postId: string;
  postTitle: string;
  postUrl: string;
  postUsername: string;
  initialUpvotes: number;
  initialDownvotes: number;
  initialUserVote: "UP" | "DOWN" | null;
  initialBookmarked: boolean;
  discussionCount?: number;
}

const ArticleActionBar = ({
  postId,
  postTitle,
  postUrl,
  postUsername,
  initialUpvotes,
  initialDownvotes,
  initialUserVote,
  initialBookmarked,
  discussionCount = 0,
}: ArticleActionBarProps) => {
  const { data: session } = useSession();
  const utils = api.useUtils();
  const [userVote, setUserVote] = useState(initialUserVote);
  const [votes, setVotes] = useState({
    upvotes: initialUpvotes,
    downvotes: initialDownvotes,
  });
  const [isBookmarked, setIsBookmarked] = useState(initialBookmarked);

  const { mutate: vote, status: voteStatus } = api.post.vote.useMutation({
    onMutate: async ({ voteType }) => {
      const oldVote = userVote;
      setUserVote(voteType);

      setVotes((prev) => {
        let newUpvotes = prev.upvotes;
        let newDownvotes = prev.downvotes;

        if (oldVote === "UP") newUpvotes--;
        if (oldVote === "DOWN") newDownvotes--;

        if (voteType === "UP") newUpvotes++;
        if (voteType === "DOWN") newDownvotes++;

        return { upvotes: newUpvotes, downvotes: newDownvotes };
      });
    },
    onError: (error) => {
      setUserVote(initialUserVote);
      setVotes({ upvotes: initialUpvotes, downvotes: initialDownvotes });
      toast.error("Failed to update vote");
      Sentry.captureException(error);
    },
    onSettled: () => {
      utils.post.sidebarData.invalidate();
    },
  });

  const { mutate: bookmark, status: bookmarkStatus } =
    api.post.bookmark.useMutation({
      onMutate: async ({ setBookmarked }) => {
        setIsBookmarked(setBookmarked);
      },
      onError: (error) => {
        setIsBookmarked(initialBookmarked);
        toast.error("Failed to update bookmark");
        Sentry.captureException(error);
      },
      onSettled: () => {
        utils.post.myBookmarks.invalidate();
      },
    });

  const handleVote = (voteType: "UP" | "DOWN" | null) => {
    if (!session) {
      signIn();
      return;
    }
    vote({ postId, voteType });
  };

  const handleBookmark = () => {
    if (!session) {
      signIn();
      return;
    }
    bookmark({ postId, setBookmarked: !isBookmarked });
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(postUrl);
      toast.success("Link copied to clipboard");
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const score = votes.upvotes - votes.downvotes;

  return (
    <div className="my-6 flex flex-wrap items-center gap-2 border-t border-b border-neutral-200 py-4 dark:border-neutral-700">
      {/* Vote buttons */}
      <div className="flex items-center rounded-full border border-neutral-200 dark:border-neutral-700">
        <button
          onClick={() => handleVote(userVote === "UP" ? null : "UP")}
          disabled={voteStatus === "pending"}
          className={`rounded-l-full p-2 transition-colors hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-neutral-800 ${
            userVote === "UP"
              ? "text-green-500"
              : "text-neutral-400 dark:text-neutral-500"
          }`}
          aria-label="Upvote"
        >
          <ChevronUpIcon className="h-5 w-5" />
        </button>
        <span
          className={`min-w-[2rem] text-center text-sm font-semibold ${
            score > 0
              ? "text-green-500"
              : score < 0
                ? "text-red-500"
                : "text-neutral-400 dark:text-neutral-500"
          }`}
        >
          {score}
        </span>
        <button
          onClick={() => handleVote(userVote === "DOWN" ? null : "DOWN")}
          disabled={voteStatus === "pending"}
          className={`rounded-r-full p-2 transition-colors hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-neutral-800 ${
            userVote === "DOWN"
              ? "text-red-500"
              : "text-neutral-400 dark:text-neutral-500"
          }`}
          aria-label="Downvote"
        >
          <ChevronDownIcon className="h-5 w-5" />
        </button>
      </div>

      {/* Comments button */}
      <a
        href="#comments"
        className="flex items-center gap-1.5 rounded-full border border-neutral-200 px-3 py-1.5 text-sm font-medium text-neutral-500 transition-colors hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800"
      >
        <ChatBubbleLeftIcon className="h-4 w-4" />
        <span>{discussionCount} Comments</span>
      </a>

      {/* Bookmark button */}
      <button
        onClick={handleBookmark}
        disabled={bookmarkStatus === "pending"}
        className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
          isBookmarked
            ? "border-blue-300 text-blue-600 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-400 dark:hover:bg-blue-900/30"
            : "border-neutral-200 text-neutral-500 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800"
        }`}
      >
        {isBookmarked ? (
          <BookmarkIcon className="h-4 w-4" />
        ) : (
          <BookmarkOutlineIcon className="h-4 w-4" />
        )}
        <span>{isBookmarked ? "Saved" : "Save"}</span>
      </button>

      {/* Share button */}
      <Menu as="div" className="relative">
        <MenuButton className="flex items-center gap-1.5 rounded-full border border-neutral-200 px-3 py-1.5 text-sm font-medium text-neutral-500 transition-colors hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800">
          <ShareIcon className="h-4 w-4" />
          <span>Share</span>
        </MenuButton>
        <Transition
          as={Fragment}
          enter="transition ease-out duration-100"
          enterFrom="transform opacity-0 scale-95"
          enterTo="transform opacity-100 scale-100"
          leave="transition ease-in duration-75"
          leaveFrom="transform opacity-100 scale-100"
          leaveTo="transform opacity-0 scale-95"
        >
          <MenuItems className="absolute bottom-12 left-0 z-10 mt-2 w-48 origin-bottom-left rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none dark:bg-neutral-800 dark:ring-neutral-700">
            <MenuItem>
              <a
                href={`https://twitter.com/intent/tweet?text="${postTitle}", by ${postUsername}&hashtags=coducommunity,codu&url=${postUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-700"
              >
                Share to X
              </a>
            </MenuItem>
            <MenuItem>
              <a
                href={`https://www.linkedin.com/sharing/share-offsite/?url=${postUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-700"
              >
                Share to LinkedIn
              </a>
            </MenuItem>
            <MenuItem>
              <button
                onClick={handleCopyLink}
                className="block w-full px-4 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-700"
              >
                Copy link
              </button>
            </MenuItem>
          </MenuItems>
        </Transition>
      </Menu>

      {/* More options menu */}
      <Menu as="div" className="relative ml-auto">
        <MenuButton className="rounded-full p-2 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 dark:text-neutral-500 dark:hover:bg-neutral-800 dark:hover:text-neutral-300">
          <span className="sr-only">More options</span>
          <EllipsisHorizontalIcon className="h-5 w-5" />
        </MenuButton>
        <Transition
          as={Fragment}
          enter="transition ease-out duration-100"
          enterFrom="transform opacity-0 scale-95"
          enterTo="transform opacity-100 scale-100"
          leave="transition ease-in duration-75"
          leaveFrom="transform opacity-100 scale-100"
          leaveTo="transform opacity-0 scale-95"
        >
          <MenuItems className="absolute bottom-12 right-0 z-10 mt-2 w-40 origin-bottom-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none dark:bg-neutral-800 dark:ring-neutral-700">
            <MenuItem>
              <div className="block w-full px-4 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-700">
                <ReportModal type="post" title={postTitle} id={postId} />
              </div>
            </MenuItem>
          </MenuItems>
        </Transition>
      </Menu>
    </div>
  );
};

export default ArticleActionBar;
