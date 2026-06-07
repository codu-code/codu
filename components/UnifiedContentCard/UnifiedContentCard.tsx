"use client";

import { useState } from "react";
import Link from "next/link";
import * as Sentry from "@sentry/nextjs";
import {
  BookmarkIcon,
  ArrowTopRightOnSquareIcon,
  ChatBubbleLeftIcon,
  ChevronUpIcon,
  ChevronDownIcon,
} from "@heroicons/react/20/solid";
import { BookmarkIcon as BookmarkOutlineIcon } from "@heroicons/react/24/outline";
import { api } from "@/server/trpc/react";
import { signIn, useSession } from "next-auth/react";
import { toast } from "sonner";
import { Temporal } from "@js-temporal/polyfill";

export type ContentType = "POST" | "LINK";

type AuthorInfo = {
  name: string;
  username: string;
  image?: string | null;
};

type SourceInfo = {
  name: string;
  slug: string | null;
  logo?: string | null;
  websiteUrl?: string | null;
};

export interface UnifiedContentCardProps {
  type: ContentType;
  id: string | number;
  title: string;
  excerpt?: string | null;
  slug?: string | null;
  imageUrl?: string | null;
  externalUrl?: string | null;
  publishedAt?: string | null;
  readTimeMins?: number | null;
  upvotes: number;
  downvotes: number;
  userVote?: "up" | "down" | null;
  isBookmarked?: boolean;
  discussionCount?: number;
  author?: AuthorInfo | null;
  source?: SourceInfo | null;
  linkAuthor?: string | null;
  tags?: string[];
}

// Get favicon URL from a website
const getFaviconUrl = (
  websiteUrl: string | null | undefined,
): string | null => {
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

// Ensure image URL uses https
const ensureHttps = (url: string | null | undefined): string | null => {
  if (!url) return null;
  if (url.startsWith("http://")) {
    return url.replace("http://", "https://");
  }
  return url;
};

// Get display hostname
const getHostname = (urlString: string): string => {
  try {
    const url = new URL(urlString);
    return url.hostname;
  } catch {
    return urlString;
  }
};

// Get display URL (hostname + truncated path)
const getDisplayUrl = (urlString: string): string => {
  try {
    const url = new URL(urlString);
    const path =
      url.pathname.length > 20
        ? url.pathname.slice(0, 20) + "..."
        : url.pathname;
    return url.hostname + (path !== "/" ? path : "");
  } catch {
    return urlString.slice(0, 40) + "...";
  }
};

const UnifiedContentCard = ({
  type,
  id,
  title,
  excerpt,
  slug,
  imageUrl: rawImageUrl,
  externalUrl,
  publishedAt,
  readTimeMins,
  upvotes,
  downvotes,
  userVote: initialUserVote,
  isBookmarked: initialBookmarked = false,
  discussionCount = 0,
  author,
  source,
  linkAuthor,
}: UnifiedContentCardProps) => {
  const [imageError, setImageError] = useState(false);
  const [userVote, setUserVote] = useState(initialUserVote);
  const [votes, setVotes] = useState({ upvotes, downvotes });
  const [isBookmarked, setIsBookmarked] = useState(initialBookmarked);

  const { data: session } = useSession();
  const utils = api.useUtils();

  const imageUrl = ensureHttps(rawImageUrl);

  // Determine the URL for the card
  // Priority: author (POST or user-created LINK) > source (aggregated LINK) > fallback
  const cardUrl =
    author?.username && slug
      ? `/${author.username}/${slug}` // User-created content (POST or LINK)
      : source?.slug && slug
        ? `/${source.slug}/${slug}` // Aggregated content with source
        : `/feed/${id}`; // Fallback

  // Unified content voting mutation
  const { mutate: voteContent, status: voteStatus } =
    api.content.vote.useMutation({
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
        setVotes({ upvotes, downvotes });
        toast.error("Failed to update vote");
        Sentry.captureException(error);
      },
      onSettled: () => {
        utils.content.getFeed.invalidate();
      },
    });

  // Unified content bookmark mutation
  const { mutate: bookmarkContent, status: bookmarkStatus } =
    api.content.bookmark.useMutation({
      onMutate: async ({ setBookmarked }) => {
        setIsBookmarked(setBookmarked);
      },
      onError: (error) => {
        setIsBookmarked(initialBookmarked);
        toast.error("Failed to update bookmark");
        Sentry.captureException(error);
      },
      onSettled: () => {
        utils.content.mySavedContent.invalidate();
      },
    });

  // Click tracking for external links
  const { mutate: trackClick } = api.content.trackClick.useMutation();

  const handleVote = (voteType: "up" | "down" | null) => {
    if (!session) {
      signIn();
      return;
    }
    voteContent({ contentId: String(id), voteType });
  };

  const handleBookmark = () => {
    if (!session) {
      signIn();
      return;
    }
    bookmarkContent({ contentId: String(id), setBookmarked: !isBookmarked });
  };

  const handleExternalClick = () => {
    if (type === "LINK") {
      trackClick({ contentId: String(id) });
    }
  };

  const dateTime = publishedAt
    ? Temporal.Instant.from(new Date(publishedAt).toISOString())
    : null;
  const relativeTime = publishedAt ? getRelativeTime(publishedAt) : null;
  const readableDate = dateTime
    ? dateTime.toLocaleString(["en-IE"], {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : null;

  const faviconUrl = getFaviconUrl(source?.websiteUrl || externalUrl);
  const showThumbnail = imageUrl && !imageError;
  const score = votes.upvotes - votes.downvotes;
  const hostname = externalUrl ? getHostname(externalUrl) : null;

  return (
    <article
      className="group my-2 rounded-lg border border-hairline bg-surface p-3 transition-colors hover:border-hairline border-hairline bg-surface hover:border-accent/50"
      data-testid="content-card"
    >
      {/* Meta info row */}
      <div className="mb-1.5 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-muted">
        {/* Author/Source info - show author for content with valid author username */}
        {author?.username ? (
          <Link
            href={`/${author.username}`}
            className="flex items-center gap-1.5 hover:text-fg"
          >
            {author.image ? (
              <img
                src={author.image}
                alt=""
                className="h-4 w-4 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-4 w-4 items-center justify-center rounded-full bg-accent/10 text-[10px] font-bold text-accent dark:bg-accent/15 dark:text-accent">
                {author.name?.charAt(0).toUpperCase() || "?"}
              </div>
            )}
            <span className="font-medium">{author.name}</span>
          </Link>
        ) : source ? (
          source.slug ? (
            <Link
              href={`/${source.slug}`}
              className="flex items-center gap-1.5 hover:text-fg"
            >
              {source.logo ? (
                <img
                  src={source.logo}
                  alt=""
                  className="h-4 w-4 rounded object-cover"
                />
              ) : faviconUrl ? (
                <img src={faviconUrl} alt="" className="h-4 w-4 rounded" />
              ) : (
                <div className="flex h-4 w-4 items-center justify-center rounded bg-accent/10 text-[10px] font-bold text-accent dark:bg-accent/15 dark:text-accent">
                  {source.name?.charAt(0).toUpperCase() || "?"}
                </div>
              )}
              <span className="font-medium">{source.name}</span>
            </Link>
          ) : (
            <span className="flex items-center gap-1.5">
              {source.logo ? (
                <img
                  src={source.logo}
                  alt=""
                  className="h-4 w-4 rounded object-cover"
                />
              ) : faviconUrl ? (
                <img src={faviconUrl} alt="" className="h-4 w-4 rounded" />
              ) : (
                <div className="flex h-4 w-4 items-center justify-center rounded bg-accent/10 text-[10px] font-bold text-accent dark:bg-accent/15 dark:text-accent">
                  {source.name?.charAt(0).toUpperCase() || "?"}
                </div>
              )}
              <span className="font-medium">{source.name}</span>
            </span>
          )
        ) : null}

        {/* Link author (if different from source) */}
        {type === "LINK" &&
          linkAuthor &&
          linkAuthor.trim() &&
          !["by", "by,", "by ,"].includes(linkAuthor.trim().toLowerCase()) && (
            <>
              <span aria-hidden="true">·</span>
              <span className="max-w-[120px] truncate">
                {linkAuthor.replace(/^by\s+/i, "").trim()}
              </span>
            </>
          )}

        {/* Time */}
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

        {/* Read time for all content types */}
        {readTimeMins && (
          <>
            <span aria-hidden="true">·</span>
            <span>{readTimeMins} min</span>
          </>
        )}

        {/* External link indicator */}
        {type === "LINK" && hostname && (
          <>
            <span aria-hidden="true">·</span>
            <span className="text-faint">{hostname}</span>
          </>
        )}
      </div>

      {/* Main content area */}
      <div className="flex gap-3">
        {/* Text content */}
        <div className="min-w-0 flex-1">
          <Link
            href={cardUrl}
            onClick={type === "LINK" ? handleExternalClick : undefined}
            className="block"
          >
            <h2 className="mb-1 line-clamp-2 text-base font-semibold leading-tight text-fg hover:underline">
              {title}
            </h2>
          </Link>
          {/* External URL display for LINK types */}
          {type === "LINK" && externalUrl && (
            <a
              href={externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleExternalClick}
              className="mb-1 inline-flex items-center gap-1 text-xs text-blue-600 hover:underline dark:text-blue-400"
            >
              {getDisplayUrl(externalUrl)}
              <ArrowTopRightOnSquareIcon className="h-3 w-3" />
            </a>
          )}
          {excerpt && (
            <p className="line-clamp-2 text-sm text-muted">
              {excerpt}
            </p>
          )}
        </div>

        {/* Thumbnail */}
        {showThumbnail && (
          <Link
            href={cardUrl}
            onClick={type === "LINK" ? handleExternalClick : undefined}
            className="relative w-[80px] flex-shrink-0 self-start overflow-hidden rounded-lg sm:w-[120px]"
          >
            <img
              src={imageUrl}
              alt=""
              className="aspect-video w-full object-cover hover:opacity-90"
              onError={() => setImageError(true)}
            />
            {type === "LINK" && (
              <div className="absolute bottom-1 right-1 rounded bg-black/60 p-0.5">
                <ArrowTopRightOnSquareIcon className="h-3 w-3 text-white" />
              </div>
            )}
          </Link>
        )}
      </div>

      {/* Action bar */}
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        {/* Vote buttons */}
        <div className="flex items-center rounded-full border border-hairline">
          <button
            onClick={() => handleVote(userVote === "up" ? null : "up")}
            disabled={voteStatus === "pending"}
            className={`rounded-l-full p-1 transition-colors hover:bg-elevated disabled:cursor-not-allowed disabled:opacity-50 ${
              userVote === "up"
                ? "text-green-500"
                : "text-faint"
            }`}
            aria-label="Upvote"
          >
            <ChevronUpIcon className="h-4 w-4" />
          </button>
          <span
            className={`min-w-[1.5rem] text-center text-xs font-bold ${
              score > 0
                ? "text-green-500"
                : score < 0
                  ? "text-red-500"
                  : "text-faint"
            }`}
          >
            {score}
          </span>
          <button
            onClick={() => handleVote(userVote === "down" ? null : "down")}
            disabled={voteStatus === "pending"}
            className={`rounded-r-full p-1 transition-colors hover:bg-elevated disabled:cursor-not-allowed disabled:opacity-50 ${
              userVote === "down"
                ? "text-red-500"
                : "text-faint"
            }`}
            aria-label="Downvote"
          >
            <ChevronDownIcon className="h-4 w-4" />
          </button>
        </div>

        {/* Comments */}
        <Link
          href={`${cardUrl}#discussion`}
          className="flex items-center gap-1 rounded-full px-2 py-1 text-xs text-muted transition-colors hover:bg-elevated dark:text-faint"
        >
          <ChatBubbleLeftIcon className="h-3.5 w-3.5" />
          <span>{discussionCount}</span>
        </Link>

        {/* Bookmark */}
        <button
          onClick={handleBookmark}
          disabled={bookmarkStatus === "pending"}
          className={`flex items-center gap-1 rounded-full p-1 transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
            isBookmarked
              ? "text-blue-500"
              : "text-faint hover:bg-elevated dark:text-muted"
          }`}
          aria-label={isBookmarked ? "Remove bookmark" : "Bookmark"}
          data-testid="bookmark-button"
        >
          {isBookmarked ? (
            <BookmarkIcon className="h-4 w-4" />
          ) : (
            <BookmarkOutlineIcon className="h-4 w-4" />
          )}
        </button>

        {/* External link button for LINKs */}
        {type === "LINK" && externalUrl && (
          <a
            href={externalUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleExternalClick}
            className="ml-auto flex items-center gap-1 rounded-full px-2 py-1 text-xs text-muted transition-colors hover:bg-elevated dark:text-faint"
          >
            <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Open</span>
          </a>
        )}
      </div>
    </article>
  );
};

export default UnifiedContentCard;
