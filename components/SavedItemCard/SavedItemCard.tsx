"use client";

import Link from "next/link";
import { Temporal } from "@js-temporal/polyfill";
import { buildContentHref } from "@/server/lib/content-url";
import { getRelativeTime } from "@/utils/relativeTime";

export interface SavedItemCardProps {
  id: string;
  title: string;
  slug: string;
  /** Immutable canonical resolver; fallback when slug is missing. */
  urlId?: string | null;
  publishedAt: string | null;
  // Source info (for external links)
  sourceName?: string | null;
  sourceLogo?: string | null;
  sourceSlug?: string | null;
  // Author info (for user posts)
  authorName?: string | null;
  authorUsername?: string | null;
  authorImage?: string | null;
  // Display variant: POST shows the author, LINK shows the source
  type: "POST" | "LINK";
  /** Raw posts.type (article/discussion/question/til/link/resource) for URL building. */
  dbType?: string | null;
  // Optional remove callback
  onRemove?: () => void;
}

const SavedItemCard = ({
  title,
  slug,
  urlId,
  publishedAt,
  sourceName,
  sourceLogo,
  sourceSlug,
  authorName,
  authorUsername,
  authorImage,
  type,
  dbType,
  onRemove,
}: SavedItemCardProps) => {
  // Shared URL scheme (/d/ discussions, /s/ sources, member paths); slug ends
  // with the urlId, and a bare urlId resolves too when slug is missing. Falls
  // back to the author profile rather than the legacy /feed/:id.
  const contentSlug = slug || urlId || null;
  const cardUrl =
    (contentSlug &&
      buildContentHref({
        type: dbType ?? (type === "POST" ? "article" : "link"),
        slug: contentSlug,
        sourceSlug,
        authorUsername,
      })) ||
    (authorUsername ? `/${authorUsername}` : "/");

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
    <article className="group relative rounded-lg border border-hairline bg-surface p-3 transition-colors hover:border-accent/50 hover:border-hairline">
      <Link href={cardUrl} className="block">
        <div className="mb-1.5 flex items-center gap-1.5 text-xs text-muted">
          {displayImage ? (
            <img
              src={displayImage}
              alt=""
              className="h-4 w-4 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-4 w-4 items-center justify-center rounded-full bg-accent/10 text-[10px] font-bold text-accent dark:bg-accent/15 dark:text-accent">
              {displayInitial}
            </div>
          )}
          {type === "POST" ? (
            <span>
              <span className="font-medium text-muted">{authorName}</span>
            </span>
          ) : (
            <span>
              <span className="text-faint">In </span>
              <span className="font-medium text-muted">{sourceName}</span>
            </span>
          )}
          {relativeTime && (
            <>
              <span aria-hidden="true">·</span>
              <time
                dateTime={dateTime?.toString()}
                title={readableDate || undefined}
                // Relative times derive from Date.now(); avoid hydration
                // text-mismatch noise when a minute boundary is crossed.
                suppressHydrationWarning
              >
                {relativeTime}
              </time>
            </>
          )}
        </div>

        <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-fg group-hover:text-muted">
          {title}
        </h3>
      </Link>

      {onRemove && (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onRemove();
          }}
          className="absolute right-2 top-2 rounded p-1 text-faint opacity-0 transition-opacity hover:bg-elevated hover:text-muted group-hover:opacity-100"
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
