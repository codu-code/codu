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
import { ReportModal, useReportModal } from "@/components/ReportModal/ReportModal";

interface UnifiedActionBarProps {
  contentType: "post" | "article";
  contentId: string | number;
  initialUpvotes: number;
  initialDownvotes: number;
  initialUserVote: "up" | "down" | null;
  initialBookmarked: boolean;
  discussionCount: number;
  shareUrl: string;
  shareTitle: string;
  shareUsername?: string;
}

const UnifiedActionBar = ({
  contentType,
  contentId,
  initialUpvotes,
  initialDownvotes,
  initialUserVote,
  initialBookmarked,
  discussionCount,
  shareUrl,
  shareTitle,
  shareUsername,
}: UnifiedActionBarProps) => {
  const { data: session } = useSession();
  const utils = api.useUtils();
  const { openReport } = useReportModal();
  const [userVote, setUserVote] = useState(initialUserVote);
  const [votes, setVotes] = useState({
    upvotes: initialUpvotes,
    downvotes: initialDownvotes,
  });
  const [isBookmarked, setIsBookmarked] = useState(initialBookmarked);

  // Post voting mutation
  const { mutate: votePost, status: votePostStatus } = api.post.vote.useMutation({
    onMutate: async ({ voteType }) => {
      const oldVote = userVote;
      setUserVote(voteType);
      setVotes((prev) => {
        let newUpvotes = prev.upvotes;
        let newDownvotes = prev.downvotes;
        if (oldVote === "up") newUpvotes--;
        if (oldVote === "down") newDownvotes--;
        if (voteType === "up") newUpvotes++;
        if (voteType === "down") newDownvotes++;
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

  // Article voting mutation
  const { mutate: voteArticle, status: voteArticleStatus } = api.content.vote.useMutation({
    onMutate: async ({ voteType }) => {
      const oldVote = userVote;
      setUserVote(voteType);
      setVotes((prev) => {
        let newUpvotes = prev.upvotes;
        let newDownvotes = prev.downvotes;
        if (oldVote === "up") newUpvotes--;
        if (oldVote === "down") newDownvotes--;
        if (voteType === "up") newUpvotes++;
        if (voteType === "down") newDownvotes++;
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
      utils.content.getFeed.invalidate();
    },
  });

  // Post bookmark mutation
  const { mutate: bookmarkPost, status: bookmarkPostStatus } = api.post.bookmark.useMutation({
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

  // Article bookmark mutation
  const { mutate: bookmarkArticle, status: bookmarkArticleStatus } = api.feed.bookmark.useMutation({
    onMutate: async ({ setBookmarked }) => {
      setIsBookmarked(setBookmarked);
    },
    onError: (error) => {
      setIsBookmarked(initialBookmarked);
      toast.error("Failed to update bookmark");
      Sentry.captureException(error);
    },
    onSettled: () => {
      utils.feed.mySavedArticles.invalidate();
    },
  });

  const voteStatus = contentType === "post" ? votePostStatus : voteArticleStatus;
  const bookmarkStatus = contentType === "post" ? bookmarkPostStatus : bookmarkArticleStatus;

  const handleVote = (voteType: "up" | "down" | null) => {
    if (!session) {
      signIn();
      return;
    }
    if (contentType === "post") {
      votePost({ postId: contentId as string, voteType });
    } else {
      voteArticle({ contentId: String(contentId), voteType });
    }
  };

  const handleBookmark = () => {
    if (!session) {
      signIn();
      return;
    }
    if (contentType === "post") {
      bookmarkPost({ postId: contentId as string, setBookmarked: !isBookmarked });
    } else {
      bookmarkArticle({ articleId: String(contentId), setBookmarked: !isBookmarked });
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Link copied to clipboard");
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const handleReport = () => {
    if (!session) {
      signIn();
      return;
    }
    if (contentType === "post") {
      openReport("post", contentId as string);
    } else {
      openReport("article", String(contentId));
    }
  };

  const score = votes.upvotes - votes.downvotes;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Vote buttons */}
      <div className="flex items-center rounded-full bg-neutral-100 dark:bg-neutral-800">
        <button
          onClick={() => handleVote(userVote === "up" ? null : "up")}
          disabled={voteStatus === "pending"}
          className={`rounded-l-full p-2 transition-colors hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-neutral-700 ${
            userVote === "up"
              ? "text-green-500"
              : "text-neutral-500 dark:text-neutral-400"
          }`}
          aria-label="Upvote"
        >
          <ChevronUpIcon className="h-5 w-5" />
        </button>
        <span
          className={`min-w-[2.5rem] text-center font-bold ${
            score > 0
              ? "text-green-500"
              : score < 0
                ? "text-red-500"
                : "text-neutral-500 dark:text-neutral-400"
          }`}
        >
          {score}
        </span>
        <button
          onClick={() => handleVote(userVote === "down" ? null : "down")}
          disabled={voteStatus === "pending"}
          className={`rounded-r-full p-2 transition-colors hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-neutral-700 ${
            userVote === "down"
              ? "text-red-500"
              : "text-neutral-500 dark:text-neutral-400"
          }`}
          aria-label="Downvote"
        >
          <ChevronDownIcon className="h-5 w-5" />
        </button>
      </div>

      {/* Comments count */}
      <a
        href="#discussion"
        className="flex items-center gap-1.5 rounded-full bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700"
      >
        <ChatBubbleLeftIcon className="h-4 w-4" />
        <span>{discussionCount} comments</span>
      </a>

      {/* Bookmark button */}
      <button
        onClick={handleBookmark}
        disabled={bookmarkStatus === "pending"}
        className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
          isBookmarked
            ? "bg-blue-100 text-blue-600 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50"
            : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700"
        }`}
      >
        {isBookmarked ? (
          <BookmarkIcon className="h-4 w-4" />
        ) : (
          <BookmarkOutlineIcon className="h-4 w-4" />
        )}
        {isBookmarked ? "Saved" : "Save"}
      </button>

      {/* Share button */}
      <Menu as="div" className="relative">
        <MenuButton className="flex items-center gap-1.5 rounded-full bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700">
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
                href={`https://twitter.com/intent/tweet?text="${shareTitle}"${shareUsername ? `, by ${shareUsername}` : ""}&hashtags=coducommunity,codu&url=${shareUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-700"
              >
                Share to X
              </a>
            </MenuItem>
            <MenuItem>
              <a
                href={`https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`}
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
              <button
                onClick={handleReport}
                className="block w-full px-4 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-700"
              >
                Report
              </button>
            </MenuItem>
          </MenuItems>
        </Transition>
      </Menu>
    </div>
  );
};

export default UnifiedActionBar;
