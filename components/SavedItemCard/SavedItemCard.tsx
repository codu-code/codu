"use client";

import Link from "next/link";
import { Temporal } from "@js-temporal/polyfill";

export interface SavedItemCardProps {
  id: string;
  title: string;
  slug: string;
  publishedAt: string | null;
  // Source info (for external links)
  sourceName?: string | null;
  sourceLogo?: string | null;
  sourceSlug?: string | null;
  // Author info (for user posts)
  authorName?: string | null;
  authorUsername?: string | null;
  authorImage?: string | null;
  // For building the URL
  type: "POST" | "LINK";
  // Optional remove callback
  onRemove?: () => void;
}

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

// Get favicon URL from a website
const getFaviconUrl = (
  sourceLogo: string | null | undefined,
): string | null => {
  if (!sourceLogo) return null;
  return sourceLogo;
};

const SavedItemCard = ({
  id,
  title,
  slug,
  publishedAt,
  sourceName,
  sourceLogo,
  sourceSlug,
  authorName,
  authorUsername,
  authorImage,
  type,
  onRemove,
}: SavedItemCardProps) => {
  // Determine the URL for the card
  const cardUrl =
    type === "POST"
      ? `/${authorUsername || ""}/${slug}`
      : sourceSlug && slug
        ? `/${sourceSlug}/${slug}`
        : `/feed/${id}`;

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

  // Determine display info
  const displayName = type === "POST" ? authorName : sourceName;
  const displayImage = type === "POST" ? authorImage : sourceLogo;
  const displayInitial = displayName?.charAt(0).toUpperCase() || "?";

  return (
    <article className="group relative rounded-lg border border-neutral-200 bg-white p-3 transition-colors hover:border-neutral-300 dark:border-neutral-700 dark:bg-neutral-900 dark:hover:border-neutral-600">
      <Link href={cardUrl} className="block">
        {/* Attribution row */}
        <div className="mb-1.5 flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400">
          {displayImage ? (
            <img
              src={displayImage}
              alt=""
              className="h-4 w-4 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-4 w-4 items-center justify-center rounded-full bg-orange-100 text-[10px] font-bold text-orange-600 dark:bg-orange-900 dark:text-orange-300">
              {displayInitial}
            </div>
          )}
          {type === "POST" ? (
            <span>
              <span className="font-medium text-neutral-700 dark:text-neutral-300">
                {authorName}
              </span>
            </span>
          ) : (
            <span>
              <span className="text-neutral-400 dark:text-neutral-500">
                In{" "}
              </span>
              <span className="font-medium text-neutral-700 dark:text-neutral-300">
                {sourceName}
              </span>
            </span>
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

        {/* Title */}
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-neutral-900 group-hover:text-neutral-700 dark:text-neutral-100 dark:group-hover:text-neutral-200">
          {title}
        </h3>
      </Link>

      {/* Remove button (optional) */}
      {onRemove && (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onRemove();
          }}
          className="absolute right-2 top-2 rounded p-1 text-neutral-400 opacity-0 transition-opacity hover:bg-neutral-100 hover:text-neutral-600 group-hover:opacity-100 dark:text-neutral-500 dark:hover:bg-neutral-800 dark:hover:text-neutral-300"
          aria-label="Remove saved item"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="h-4 w-4"
          >
            <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
          </svg>
        </button>
      )}
    </article>
  );
};

export default SavedItemCard;
