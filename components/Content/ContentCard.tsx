"use client";

import { useState, Fragment } from "react";
import Link from "next/link";
import * as Sentry from "@sentry/nextjs";
import {
  BookmarkIcon,
  ArrowTopRightOnSquareIcon,
  ChatBubbleLeftIcon,
  ShareIcon,
  ChevronUpIcon,
  ChevronDownIcon,
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
import { signIn, useSession } from "next-auth/react";
import { toast } from "sonner";

type ContentType = "POST" | "LINK" | "QUESTION" | "VIDEO" | "DISCUSSION";

type Props = {
  id: string;
  type: ContentType;
  title: string;
  body?: string | null;
  excerpt?: string | null;
  externalUrl?: string | null;
  imageUrl?: string | null;
  publishedAt?: string | null;
  upvotes: number;
  downvotes: number;
  discussionCount?: number;
  // Author info (for user-created content)
  userId?: string | null;
  userName?: string | null;
  userImage?: string | null;
  username?: string | null;
  // Source info (for RSS/external content)
  sourceName?: string | null;
  sourceSlug?: string | null;
  sourceLogo?: string | null;
  sourceWebsite?: string | null;
  sourceAuthor?: string | null;
  // User state
  userVote?: "up" | "down" | null;
  isBookmarked?: boolean;
  // Options
  showBookmark?: boolean;
  onReport?: () => void;
};

// Get favicon URL from a website
const getFaviconUrl = (websiteUrl: string | null | undefined): string | null => {
  if (!websiteUrl) return null;
  try {
    const url = new URL(websiteUrl);
    return `https://www.google.com/s2/favicons?domain=${url.hostname}&sz=32`;
  } catch {
    return null;
  }
};

// Get relative time string
const getRelativeTime = (dateStr: string): string => {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

// Get display URL (truncated, without protocol)
const getDisplayUrl = (urlString: string): string => {
  try {
    const url = new URL(urlString);
    const path = url.pathname === "/" ? "" : url.pathname;
    const display = url.hostname + path;
    return display.length > 50 ? display.substring(0, 50) + "..." : display;
  } catch {
    return urlString;
  }
};

// Ensure image URL uses https
const ensureHttps = (url: string | null | undefined): string | null => {
  if (!url) return null;
  if (url.startsWith("http://")) {
    return url.replace("http://", "https://");
  }
  return url;
};

// Content type badge colors
const typeColors: Record<ContentType, { bg: string; text: string }> = {
  POST: { bg: "bg-blue-100 dark:bg-blue-900", text: "text-blue-700 dark:text-blue-300" },
  LINK: { bg: "bg-green-100 dark:bg-green-900", text: "text-green-700 dark:text-green-300" },
  QUESTION: { bg: "bg-purple-100 dark:bg-purple-900", text: "text-purple-700 dark:text-purple-300" },
  VIDEO: { bg: "bg-red-100 dark:bg-red-900", text: "text-red-700 dark:text-red-300" },
  DISCUSSION: { bg: "bg-yellow-100 dark:bg-yellow-900", text: "text-yellow-700 dark:text-yellow-300" },
};

const typeLabels: Record<ContentType, string> = {
  POST: "Article",
  LINK: "Link",
  QUESTION: "Question",
  VIDEO: "Video",
  DISCUSSION: "Discussion",
};

const ContentCard = ({
  id,
  type,
  title,
  body,
  excerpt,
  externalUrl,
  imageUrl: rawImageUrl,
  publishedAt,
  upvotes,
  downvotes,
  discussionCount = 0,
  userId,
  userName,
  userImage,
  username,
  sourceName,
  sourceSlug,
  sourceLogo,
  sourceWebsite,
  sourceAuthor,
  userVote,
  isBookmarked: initialBookmarked = false,
  showBookmark = true,
  onReport,
}: Props) => {
  const [imageError, setImageError] = useState(false);
  const { data: session } = useSession();
  const utils = api.useUtils();

  // Convert http to https for images
  const imageUrl = ensureHttps(rawImageUrl);

  // Build content URL
  const contentUrl = `/content/${id}`;
  const isExternal = type === "LINK" || type === "VIDEO";

  const { mutate: vote, status: voteStatus } = api.content.vote.useMutation({
    onSuccess: () => {
      utils.content.getFeed.invalidate();
    },
    onError: (error) => {
      toast.error("Failed to update vote");
      Sentry.captureException(error);
    },
  });

  const { mutate: bookmark, status: bookmarkStatus } =
    api.content.bookmark.useMutation({
      onSuccess: () => {
        utils.content.getFeed.invalidate();
        utils.content.mySavedContent.invalidate();
      },
      onError: (error) => {
        toast.error("Failed to update bookmark");
        Sentry.captureException(error);
      },
    });

  const { mutate: trackClick } = api.content.trackClick.useMutation();

  const handleClick = () => {
    trackClick({ contentId: id });
  };

  const handleVote = (voteType: "up" | "down" | null) => {
    if (!session) {
      signIn();
      return;
    }
    vote({ contentId: id, voteType });
  };

  const handleBookmark = () => {
    if (!session) {
      signIn();
      return;
    }
    bookmark({ contentId: id, setBookmarked: !initialBookmarked });
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}${contentUrl}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Link copied to clipboard");
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const relativeTime = publishedAt ? getRelativeTime(publishedAt) : null;
  const faviconUrl = getFaviconUrl(sourceWebsite || externalUrl || null);
  const displayUrl = externalUrl ? getDisplayUrl(externalUrl) : null;
  const showThumbnail = imageUrl && !imageError;
  const score = upvotes - downvotes;

  // Determine author info
  const authorName = userName || sourceAuthor;
  const authorImage = userImage || sourceLogo || (faviconUrl ? faviconUrl : null);
  const authorLink = username ? `/${username}` : sourceSlug ? `/feed/${sourceSlug}` : null;
  const displayName = sourceName || authorName || "Unknown";

  return (
    <article className="group my-2 rounded-lg border border-neutral-200 bg-white p-3 transition-colors hover:border-neutral-300 dark:border-neutral-700 dark:bg-neutral-900 dark:hover:border-neutral-600">
      {/* Header row - source/author and metadata */}
      <div className="mb-1.5 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-neutral-500 dark:text-neutral-400">
        {/* Author/Source info */}
        {authorLink ? (
          <Link
            href={authorLink}
            className="flex items-center gap-1.5 hover:text-neutral-700 dark:hover:text-neutral-200"
          >
            {authorImage ? (
              <img
                src={authorImage}
                alt=""
                className="h-4 w-4 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-4 w-4 items-center justify-center rounded-full bg-orange-100 text-[10px] font-bold text-orange-600 dark:bg-orange-900 dark:text-orange-300">
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="font-medium">{displayName}</span>
          </Link>
        ) : (
          <>
            {authorImage ? (
              <img
                src={authorImage}
                alt=""
                className="h-4 w-4 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-4 w-4 items-center justify-center rounded-full bg-orange-100 text-[10px] font-bold text-orange-600 dark:bg-orange-900 dark:text-orange-300">
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="font-medium">{displayName}</span>
          </>
        )}

        {/* Type badge - only show for non-articles */}
        {type !== "POST" && (
          <>
            <span aria-hidden="true">·</span>
            <span
              className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${typeColors[type].bg} ${typeColors[type].text}`}
            >
              {typeLabels[type]}
            </span>
          </>
        )}

        {/* Time */}
        {relativeTime && (
          <>
            <span aria-hidden="true">·</span>
            <time title={publishedAt || undefined}>{relativeTime}</time>
          </>
        )}
      </div>

      {/* Content row */}
      <div className="flex gap-3">
        {/* Main content */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Title */}
          <h2 className="mb-0.5">
            <Link
              href={contentUrl}
              className="line-clamp-2 font-semibold leading-snug text-neutral-900 hover:underline dark:text-neutral-100"
            >
              {title}
            </Link>
          </h2>

          {/* External URL (for LINK and VIDEO types) */}
          {isExternal && externalUrl && (
            <a
              href={externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleClick}
              className="mb-2 inline-flex items-center gap-1 text-xs text-blue-600 hover:underline dark:text-blue-400"
            >
              {displayUrl}
              <ArrowTopRightOnSquareIcon className="h-3 w-3 flex-shrink-0" />
            </a>
          )}

          {/* Excerpt/body preview */}
          {(excerpt || body) && (
            <p className="mb-2 line-clamp-2 text-sm text-neutral-600 dark:text-neutral-400">
              {excerpt || body?.slice(0, 200)}
            </p>
          )}

          {/* Action bar */}
          <div className="mt-auto flex items-center gap-1.5">
            {/* Vote buttons */}
            <div className="flex items-center rounded-full border border-neutral-200 dark:border-neutral-700">
              <button
                onClick={() => handleVote(userVote === "up" ? null : "up")}
                disabled={voteStatus === "pending"}
                className={`rounded-l-full p-1 transition-colors hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-neutral-800 ${
                  userVote === "up"
                    ? "text-green-500"
                    : "text-neutral-400 dark:text-neutral-500"
                }`}
                aria-label="Upvote"
              >
                <ChevronUpIcon className="h-4 w-4" />
              </button>
              <span
                className={`min-w-[1.5rem] text-center text-xs font-semibold ${
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
                onClick={() => handleVote(userVote === "down" ? null : "down")}
                disabled={voteStatus === "pending"}
                className={`rounded-r-full p-1 transition-colors hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-neutral-800 ${
                  userVote === "down"
                    ? "text-red-500"
                    : "text-neutral-400 dark:text-neutral-500"
                }`}
                aria-label="Downvote"
              >
                <ChevronDownIcon className="h-4 w-4" />
              </button>
            </div>

            {/* Comments button */}
            <Link
              href={contentUrl}
              className="flex items-center gap-1 rounded-full border border-neutral-200 px-2 py-1 text-xs font-medium text-neutral-500 transition-colors hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800"
            >
              <ChatBubbleLeftIcon className="h-3.5 w-3.5" />
              <span>{discussionCount}</span>
            </Link>

            {/* Save button */}
            {showBookmark && (
              <button
                onClick={handleBookmark}
                disabled={bookmarkStatus === "pending"}
                aria-label={initialBookmarked ? "Remove from saved" : "Save article"}
                className={`flex items-center gap-1 rounded-full border px-2 py-1 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                  initialBookmarked
                    ? "border-blue-300 text-blue-600 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-400 dark:hover:bg-blue-900/30"
                    : "border-neutral-200 text-neutral-500 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800"
                }`}
              >
                {initialBookmarked ? (
                  <BookmarkIcon className="h-3.5 w-3.5" />
                ) : (
                  <BookmarkOutlineIcon className="h-3.5 w-3.5" />
                )}
                <span className="hidden sm:inline" aria-hidden="true">
                  {initialBookmarked ? "Saved" : "Save"}
                </span>
              </button>
            )}

            {/* Share button */}
            <button
              onClick={handleShare}
              aria-label="Share article"
              className="flex items-center gap-1 rounded-full border border-neutral-200 px-2 py-1 text-xs font-medium text-neutral-500 transition-colors hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800"
            >
              <ShareIcon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline" aria-hidden="true">Share</span>
            </button>

            {/* Triple-dot menu */}
            <Menu as="div" className="relative">
              <MenuButton className="rounded-full p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 dark:text-neutral-500 dark:hover:bg-neutral-800 dark:hover:text-neutral-300">
                <span className="sr-only">More options</span>
                <EllipsisHorizontalIcon className="h-4 w-4" />
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
                <MenuItems className="absolute bottom-8 right-0 z-10 mt-2 w-40 origin-bottom-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none dark:bg-neutral-800 dark:ring-neutral-700">
                  {onReport && (
                    <MenuItem>
                      <button
                        onClick={onReport}
                        className="block w-full px-4 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-700"
                      >
                        Report
                      </button>
                    </MenuItem>
                  )}
                  <MenuItem>
                    <button
                      onClick={handleShare}
                      className="block w-full px-4 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-700"
                    >
                      Copy link
                    </button>
                  </MenuItem>
                  {isExternal && externalUrl && (
                    <MenuItem>
                      <a
                        href={externalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block w-full px-4 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-700"
                      >
                        Open original
                      </a>
                    </MenuItem>
                  )}
                </MenuItems>
              </Transition>
            </Menu>
          </div>
        </div>

        {/* Thumbnail on right side */}
        {showThumbnail && (
          <Link
            href={contentUrl}
            className="relative hidden w-[120px] flex-shrink-0 self-start overflow-hidden rounded-lg sm:block"
          >
            <img
              src={imageUrl}
              alt=""
              className="aspect-video w-full object-cover transition-opacity hover:opacity-90"
              onError={() => setImageError(true)}
              loading="lazy"
            />
            {isExternal && externalUrl && (
              <div className="absolute bottom-1 right-1 rounded bg-black/60 p-0.5">
                <ArrowTopRightOnSquareIcon className="h-3 w-3 text-white" />
              </div>
            )}
          </Link>
        )}
      </div>
    </article>
  );
};

export default ContentCard;
