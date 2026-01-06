"use client";

import { useState } from "react";
import Link from "next/link";
import * as Sentry from "@sentry/nextjs";
import {
  BookmarkIcon,
  ArrowTopRightOnSquareIcon,
  ChatBubbleLeftIcon,
  ShareIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  FlagIcon,
} from "@heroicons/react/20/solid";
import { BookmarkIcon as BookmarkOutlineIcon } from "@heroicons/react/24/outline";
import { api } from "@/server/trpc/react";
import { signIn, useSession } from "next-auth/react";
import { toast } from "sonner";
import { Temporal } from "@js-temporal/polyfill";
import { useReportModal } from "@/components/ReportModal/ReportModal";

type Props = {
  id: string;
  shortId: string | null;
  title: string;
  excerpt: string | null;
  url: string;
  imageUrl?: string | null;
  publishedAt: string | null;
  upvotes: number;
  downvotes: number;
  sourceName: string | null;
  sourceSlug: string | null;
  sourceLogo: string | null;
  sourceWebsite?: string | null;
  author: string | null;
  userVote: "up" | "down" | null;
  isBookmarked: boolean;
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

// Ensure image URL uses https (many RSS feeds provide http which won't load due to mixed content)
const ensureHttps = (url: string | null | undefined): string | null => {
  if (!url) return null;
  if (url.startsWith("http://")) {
    return url.replace("http://", "https://");
  }
  return url;
};

const FeedItemAggregated = ({
  id,
  shortId,
  title,
  excerpt,
  url,
  imageUrl: rawImageUrl,
  publishedAt,
  upvotes,
  downvotes,
  sourceName,
  sourceSlug,
  sourceLogo,
  sourceWebsite,
  author,
  userVote,
  isBookmarked: initialBookmarked,
}: Props) => {
  // Build the article URL - use new format if available, fallback to old
  const articleUrl = sourceSlug && shortId ? `/feed/${sourceSlug}/${shortId}` : `/feed/${id}`;
  const sourceProfileUrl = sourceSlug ? `/feed/${sourceSlug}` : null;
  const [imageError, setImageError] = useState(false);
  const { data: session } = useSession();
  const utils = api.useUtils();
  const { openReport } = useReportModal();

  // Convert http to https for images
  const imageUrl = ensureHttps(rawImageUrl);

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
    api.feed.bookmark.useMutation({
      onSuccess: () => {
        utils.feed.getFeed.invalidate();
        utils.feed.mySavedArticles.invalidate();
      },
      onError: (error) => {
        toast.error("Failed to update bookmark");
        Sentry.captureException(error);
      },
    });

  const { mutate: trackClick } = api.feed.trackClick.useMutation();

  const handleClick = () => {
    trackClick({ articleId: id });
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
    bookmark({ articleId: id, setBookmarked: !initialBookmarked });
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}${articleUrl}`;
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
    openReport("article", id);
  };

  const dateTime = publishedAt
    ? Temporal.Instant.from(new Date(publishedAt).toISOString())
    : null;
  const readableDate = dateTime
    ? dateTime.toLocaleString(["en-IE"], {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : null;

  const faviconUrl = getFaviconUrl(sourceWebsite || url);
  const relativeTime = publishedAt ? getRelativeTime(publishedAt) : null;
  const displayUrl = getDisplayUrl(url);
  const showThumbnail = imageUrl && !imageError;
  const score = upvotes - downvotes;

  return (
    <article className="group my-2 rounded-lg border border-neutral-200 bg-white p-3 transition-colors hover:border-neutral-300 dark:border-neutral-700 dark:bg-neutral-900 dark:hover:border-neutral-600">
      {/* Source info row - full width above content */}
      <div className="mb-1.5 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-neutral-500 dark:text-neutral-400">
        {sourceProfileUrl ? (
          <Link href={sourceProfileUrl} className="flex items-center gap-1.5 hover:text-neutral-700 dark:hover:text-neutral-200">
            {sourceLogo ? (
              <img
                src={sourceLogo}
                alt=""
                className="h-4 w-4 rounded object-cover"
              />
            ) : faviconUrl ? (
              <img src={faviconUrl} alt="" className="h-4 w-4 rounded" />
            ) : (
              <div className="flex h-4 w-4 items-center justify-center rounded bg-orange-100 text-[10px] font-bold text-orange-600 dark:bg-orange-900 dark:text-orange-300">
                {sourceName?.charAt(0).toUpperCase() || "?"}
              </div>
            )}
            <span className="font-medium">{sourceName || "Unknown"}</span>
          </Link>
        ) : (
          <>
            {sourceLogo ? (
              <img
                src={sourceLogo}
                alt=""
                className="h-4 w-4 rounded object-cover"
              />
            ) : faviconUrl ? (
              <img src={faviconUrl} alt="" className="h-4 w-4 rounded" />
            ) : (
              <div className="flex h-4 w-4 items-center justify-center rounded bg-orange-100 text-[10px] font-bold text-orange-600 dark:bg-orange-900 dark:text-orange-300">
                {sourceName?.charAt(0).toUpperCase() || "?"}
              </div>
            )}
            <span className="font-medium">{sourceName || "Unknown"}</span>
          </>
        )}
        {author && author.trim() && !["by", "by,", "by ,"].includes(author.trim().toLowerCase()) && (
          <>
            <span aria-hidden="true">·</span>
            <span className="max-w-[120px] truncate">{author.replace(/^by\s+/i, "").trim()}</span>
          </>
        )}
        {relativeTime && (
          <>
            <span aria-hidden="true">·</span>
            <time
              dateTime={dateTime?.toString()}
              title={readableDate || undefined}
            >
              {relativeTime}
            </time>
          </>
        )}
      </div>

      {/* Content row with title aligned with image */}
      <div className="flex gap-3">
        {/* Main content */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Title - links to discussion page */}
          <h2 className="mb-0.5">
            <Link
              href={articleUrl}
              className="line-clamp-2 font-semibold leading-snug text-neutral-900 hover:underline dark:text-neutral-100"
            >
              {title}
            </Link>
          </h2>

          {/* External URL */}
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleClick}
            className="mb-2 inline-flex items-center gap-1 text-xs text-blue-600 hover:underline dark:text-blue-400"
          >
            {displayUrl}
            <ArrowTopRightOnSquareIcon className="h-3 w-3 flex-shrink-0" />
          </a>

          {/* Excerpt */}
          {excerpt && (
            <p className="mb-2 line-clamp-2 text-sm text-neutral-600 dark:text-neutral-400">
              {excerpt}
            </p>
          )}

          {/* Action bar - smaller buttons with outlines */}
          <div className="mt-auto flex items-center gap-1.5">
            {/* Vote buttons */}
            <div className="flex items-center rounded-full border border-neutral-200 dark:border-neutral-700">
              <button
                onClick={() =>
                  handleVote(userVote === "up" ? null : "up")
                }
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
                onClick={() =>
                  handleVote(userVote === "down" ? null : "down")
                }
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
              href={articleUrl}
              className="flex items-center gap-1 rounded-full border border-neutral-200 px-2 py-1 text-xs font-medium text-neutral-500 transition-colors hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800"
            >
              <ChatBubbleLeftIcon className="h-3.5 w-3.5" />
              <span>0</span>
            </Link>

            {/* Save button */}
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

            {/* Share button */}
            <button
              onClick={handleShare}
              aria-label="Share article"
              className="flex items-center gap-1 rounded-full border border-neutral-200 px-2 py-1 text-xs font-medium text-neutral-500 transition-colors hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800"
            >
              <ShareIcon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline" aria-hidden="true">Share</span>
            </button>

            {/* Report button */}
            <button
              onClick={handleReport}
              className="flex items-center rounded-full border border-neutral-200 p-1 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600 dark:border-neutral-700 dark:text-neutral-500 dark:hover:bg-neutral-800 dark:hover:text-neutral-300"
              aria-label="Report article"
            >
              <FlagIcon className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Thumbnail on right side - aligned with title, 16:9 aspect ratio with rounded corners */}
        {showThumbnail && (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleClick}
            aria-label={`View article: ${title}`}
            className="relative hidden w-[120px] flex-shrink-0 self-start overflow-hidden rounded-lg sm:block"
          >
            <img
              src={imageUrl}
              alt=""
              aria-hidden="true"
              className="aspect-video w-full object-cover transition-opacity hover:opacity-90"
              onError={() => setImageError(true)}
              loading="lazy"
            />
            {/* External link icon overlay */}
            <div className="absolute bottom-1 right-1 rounded bg-black/60 p-0.5" aria-hidden="true">
              <ArrowTopRightOnSquareIcon className="h-3 w-3 text-white" />
            </div>
          </a>
        )}
      </div>
    </article>
  );
};

export default FeedItemAggregated;
