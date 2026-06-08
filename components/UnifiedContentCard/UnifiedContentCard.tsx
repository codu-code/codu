"use client";

import { useState } from "react";
import Link from "next/link";
import * as Sentry from "@sentry/nextjs";
import { api } from "@/server/trpc/react";
import { signIn, useSession } from "next-auth/react";
import { toast } from "sonner";

export type ContentType = "POST" | "LINK";

// Display kind → chip label + tone. The card's behavior still keys off `type`
// (POST vs LINK); `kind` only drives the editorial chip.
const KIND: Record<string, { label: string; className: string }> = {
  POST: { label: "Article", className: "bg-accent/10 text-accent-soft" },
  ARTICLE: { label: "Article", className: "bg-accent/10 text-accent-soft" },
  TIL: { label: "TIL", className: "bg-success/12 text-success" },
  QUESTION: { label: "Question", className: "bg-info/12 text-info" },
  DISCUSSION: { label: "Discussion", className: "bg-info/12 text-info" },
  LINK: { label: "Link", className: "border border-hairline text-muted" },
};

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
  /** Editorial kind for the chip (POST/ARTICLE/TIL/QUESTION/DISCUSSION/LINK). Defaults to `type`. */
  kind?: string;
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

const UnifiedContentCard = ({
  type,
  kind,
  id,
  title,
  excerpt,
  slug,
  imageUrl: rawImageUrl,
  publishedAt,
  readTimeMins,
  upvotes,
  downvotes,
  userVote: initialUserVote,
  isBookmarked: initialBookmarked = false,
  discussionCount = 0,
  author,
  source,
  tags,
}: UnifiedContentCardProps) => {
  const [imageError, setImageError] = useState(false);
  const [userVote, setUserVote] = useState(initialUserVote);
  const [votes, setVotes] = useState({ upvotes, downvotes });
  const [isBookmarked, setIsBookmarked] = useState(initialBookmarked);
  const [shared, setShared] = useState(false);

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

  const handleShare = () => {
    const url =
      typeof window !== "undefined"
        ? new URL(cardUrl, window.location.origin).toString()
        : cardUrl;
    void navigator.clipboard?.writeText(url).then(() => {
      setShared(true);
      setTimeout(() => setShared(false), 1200);
    });
  };

  const relativeTime = publishedAt ? getRelativeTime(publishedAt) : null;

  const showThumbnail = imageUrl && !imageError;
  const chip = KIND[(kind || type).toUpperCase()] ?? KIND.LINK;
  const authorName = author?.name ?? source?.name ?? null;
  const handle = author?.username ?? source?.slug ?? null;
  const avatarImg = author?.image ?? source?.logo ?? null;

  return (
    <article
      className="group rounded-lg border border-hairline bg-surface p-5 transition-colors duration-base ease-out hover:border-strong"
      data-testid="content-card"
    >
      {/* Header: kind chip + author + @handle · time (· via source for links) */}
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 font-mono text-xs ${chip.className}`}
        >
          {chip.label}
        </span>
        {avatarImg ? (
          <img
            src={avatarImg}
            alt=""
            className="h-5 w-5 rounded-full object-cover"
          />
        ) : authorName ? (
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent/15 text-[10px] font-bold text-accent">
            {authorName.charAt(0).toUpperCase()}
          </span>
        ) : null}
        {authorName &&
          (handle ? (
            <Link
              href={`/${handle}`}
              className="whitespace-nowrap text-sm font-semibold text-fg hover:underline"
            >
              {authorName}
            </Link>
          ) : (
            <span className="whitespace-nowrap text-sm font-semibold text-fg">
              {authorName}
            </span>
          ))}
        <span className="whitespace-nowrap font-mono text-xs text-faint">
          {handle ? `@${handle}` : ""}
          {relativeTime ? `${handle ? " · " : ""}${relativeTime}` : ""}
          {type === "LINK" && source?.name ? ` · via ${source.name}` : ""}
          {readTimeMins ? ` · ${readTimeMins} min` : ""}
        </span>
      </div>

      {/* Title + excerpt + optional thumbnail */}
      <div className="mt-3 flex gap-4">
        <div className="min-w-0 flex-1">
          <Link
            href={cardUrl}
            onClick={type === "LINK" ? handleExternalClick : undefined}
            className="block"
          >
            <h3 className="font-display text-lg font-bold leading-tight tracking-tight text-fg group-hover:text-accent">
              {title}
              {type === "LINK" && (
                <span className="font-normal text-faint"> ↗</span>
              )}
            </h3>
          </Link>
          {excerpt && (
            <p className="mt-1.5 line-clamp-2 text-sm leading-snug text-muted">
              {excerpt}
            </p>
          )}
        </div>
        {/* Only render a thumbnail when there's a real image that loaded — no
            grey placeholder box when an image is missing or fails. */}
        {showThumbnail && (
          <Link
            href={cardUrl}
            onClick={type === "LINK" ? handleExternalClick : undefined}
            className="relative h-[68px] w-[104px] flex-shrink-0 self-start overflow-hidden rounded-sm border border-hairline"
          >
            <img
              src={imageUrl}
              alt=""
              className="h-full w-full object-cover"
              onError={() => setImageError(true)}
            />
          </Link>
        )}
      </div>

      {/* Footer: mono #tags + reaction bar */}
      <div className="mt-3 flex flex-wrap items-center gap-3">
        {tags && tags.length > 0 && (
          <span className="min-w-0 truncate font-mono text-xs text-faint">
            {tags.map((t) => `#${t}`).join("  ")}
          </span>
        )}
        <div className="ml-auto flex items-center gap-3">
          {/* ▲ helpful (upvote) */}
          <button
            onClick={() => handleVote(userVote === "up" ? null : "up")}
            disabled={voteStatus === "pending"}
            title="Helpful"
            aria-label="Helpful"
            className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 font-mono text-xs transition-colors disabled:opacity-50 ${
              userVote === "up"
                ? "bg-accent/10 text-accent-soft"
                : "border border-hairline text-muted hover:text-fg"
            }`}
            aria-pressed={userVote === "up"}
          >
            <span className="text-[11px]">▲</span>
            {votes.upvotes} helpful
          </button>
          {/* replies */}
          <Link
            href={`${cardUrl}#discussion`}
            className="inline-flex items-center gap-1 whitespace-nowrap font-mono text-xs text-faint hover:text-muted"
          >
            {discussionCount} replies
          </Link>
          {/* Save (bookmark) */}
          <button
            onClick={handleBookmark}
            disabled={bookmarkStatus === "pending"}
            title="Save"
            data-testid="bookmark-button"
            className={`whitespace-nowrap font-mono text-xs transition-colors disabled:opacity-50 ${
              isBookmarked ? "text-accent-soft" : "text-faint hover:text-muted"
            }`}
          >
            {isBookmarked ? "Saved" : "Save"}
          </button>
          {/* Share (copy link) */}
          <button
            onClick={handleShare}
            title="Copy link"
            className={`whitespace-nowrap font-mono text-xs transition-colors ${
              shared ? "text-accent-soft" : "text-faint hover:text-muted"
            }`}
          >
            {shared ? "Copied" : "Share"}
          </button>
        </div>
      </div>
    </article>
  );
};

export default UnifiedContentCard;
