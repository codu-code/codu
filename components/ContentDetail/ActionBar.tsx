"use client";

import { Fragment, useState } from "react";
import {
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
import {
  ReportModal,
  useReportModal,
} from "@/components/ReportModal/ReportModal";
import VoteControl from "@/components/Vote/VoteControl";

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
  const [isBookmarked, setIsBookmarked] = useState(initialBookmarked);

  // Post voting mutation (VoteControl owns the optimistic UI).
  const { mutate: votePost } = api.post.vote.useMutation({
    onError: (error) => {
      toast.error("Failed to update vote");
      Sentry.captureException(error);
    },
    onSettled: () => {
      utils.post.sidebarData.invalidate();
    },
  });

  // Article voting mutation (VoteControl owns the optimistic UI).
  const { mutate: voteArticle } = api.content.vote.useMutation({
    onError: (error) => {
      toast.error("Failed to update vote");
      Sentry.captureException(error);
    },
    onSettled: () => {
      utils.content.getFeed.invalidate();
    },
  });

  // Post bookmark mutation
  const { mutate: bookmarkPost, status: bookmarkPostStatus } =
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

  // Article bookmark mutation
  const { mutate: bookmarkArticle, status: bookmarkArticleStatus } =
    api.feed.bookmark.useMutation({
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

  const bookmarkStatus =
    contentType === "post" ? bookmarkPostStatus : bookmarkArticleStatus;

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
      bookmarkPost({
        postId: contentId as string,
        setBookmarked: !isBookmarked,
      });
    } else {
      bookmarkArticle({
        articleId: String(contentId),
        setBookmarked: !isBookmarked,
      });
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

  return (
    <div className="flex flex-wrap items-center gap-2">
      <VoteControl
        base={
          initialUpvotes -
          initialDownvotes -
          (initialUserVote === "up" ? 1 : initialUserVote === "down" ? -1 : 0)
        }
        initial={initialUserVote}
        onGate={!session ? () => signIn() : undefined}
        onVote={(next) => handleVote(next)}
      />

      <a
        href="#discussion"
        className="flex items-center gap-1.5 rounded-full bg-inset px-4 py-2 text-sm font-medium text-muted transition-colors hover:bg-hover"
      >
        <ChatBubbleLeftIcon className="h-4 w-4" />
        <span>{discussionCount} comments</span>
      </a>

      <button
        onClick={handleBookmark}
        disabled={bookmarkStatus === "pending"}
        className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
          isBookmarked
            ? "bg-accent/12 text-accent-soft hover:bg-accent/20"
            : "bg-inset text-muted hover:bg-hover"
        }`}
      >
        {isBookmarked ? (
          <BookmarkIcon className="h-4 w-4" />
        ) : (
          <BookmarkOutlineIcon className="h-4 w-4" />
        )}
        {isBookmarked ? "Saved" : "Save"}
      </button>

      <Menu as="div" className="relative">
        <MenuButton className="flex items-center gap-1.5 rounded-full bg-inset px-4 py-2 text-sm font-medium text-muted transition-colors hover:bg-hover">
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
          <MenuItems className="absolute bottom-12 left-0 z-10 mt-2 w-48 origin-bottom-left rounded-md bg-elevated py-1 shadow-lg ring-1 ring-hairline focus:outline-none">
            <MenuItem>
              <a
                href={`https://twitter.com/intent/tweet?text="${shareTitle}"${shareUsername ? `, by ${shareUsername}` : ""}&hashtags=coducommunity,codu&url=${shareUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block px-4 py-2 text-sm text-fg hover:bg-hover"
              >
                Share to X
              </a>
            </MenuItem>
            <MenuItem>
              <a
                href={`https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block px-4 py-2 text-sm text-fg hover:bg-hover"
              >
                Share to LinkedIn
              </a>
            </MenuItem>
            <MenuItem>
              <button
                onClick={handleCopyLink}
                className="block w-full px-4 py-2 text-left text-sm text-fg hover:bg-hover"
              >
                Copy link
              </button>
            </MenuItem>
          </MenuItems>
        </Transition>
      </Menu>

      <Menu as="div" className="relative ml-auto">
        <MenuButton className="rounded-full p-2 text-faint hover:bg-hover hover:text-fg">
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
          <MenuItems className="absolute bottom-12 right-0 z-10 mt-2 w-40 origin-bottom-right rounded-md bg-elevated py-1 shadow-lg ring-1 ring-hairline focus:outline-none">
            <MenuItem>
              <button
                onClick={handleReport}
                className="block w-full px-4 py-2 text-left text-sm text-fg hover:bg-hover"
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
