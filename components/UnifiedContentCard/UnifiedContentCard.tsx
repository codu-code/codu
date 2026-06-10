"use client";

import { useState } from "react";
import Link from "next/link";
import * as Sentry from "@sentry/nextjs";
import { api } from "@/server/trpc/react";
import { signIn, useSession } from "next-auth/react";
import { toast } from "sonner";
import VoteControl from "@/components/Vote/VoteControl";
import { ReportButton } from "@/components/ReportModal/ReportModal";
import { ensureHttps } from "@/utils/url";

export type ContentType = "POST" | "LINK";

// Display kind → chip label + tone (`kind` only drives the chip; behavior keys
// off `type`). Chips share one opaque bordered-pill shape, only color varies.
// Mirrored in components/ContentDetail/TypeBadge.tsx.
const KIND: Record<string, { label: string; className: string }> = {
  POST: { label: "Article", className: "border-accent/40 text-accent-soft" },
  ARTICLE: { label: "Article", className: "border-accent/40 text-accent-soft" },
  DISCUSSION: {
    label: "Discussion",
    className: "border-accent-soft/40 text-accent-soft",
  },
  QUESTION: { label: "Question", className: "border-info/40 text-info" },
  TIL: { label: "TIL", className: "border-success/40 text-success" },
  RESOURCE: { label: "Resource", className: "border-warning/40 text-warning" },
  LINK: { label: "Link", className: "border-hairline text-muted" },
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
  /** Immutable canonical resolver. For member content the slug already ends
   * with this, so the slug stays canonical; used only as a fallback when the
   * slug is missing (and by the upcoming /d/ + /s/ routes). */
  urlId?: string | null;
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

const UnifiedContentCard = ({
  type,
  kind,
  id,
  title,
  excerpt,
  slug,
  urlId,
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

  // URL priority: author (POST or user-created LINK) > source (aggregated LINK).
  // Member content canonical is `/{username}/{slug}` — the slug already ends
  // with the urlId, so the slug stays canonical. urlId is the fallback resolver
  // when the slug is missing (the detail page resolves a bare urlId segment).
  // Never emit `/feed/:id` — that route 404s (next.config 301s it to a routeless
  // `/:id`). When there's no resolvable internal page, a LINK opens its source
  // and anything else falls back to the author profile — never a dead route.
  // Discussions and questions live under the /d/ namespace (the slug already
  // ends with the urlId, so /d/{slug} is canonical). Everything else keeps the
  // member/source/external resolution below.
  const editorialKind = (kind || type).toUpperCase();
  const isDiscussion =
    editorialKind === "DISCUSSION" || editorialKind === "QUESTION";

  const cardUrl =
    isDiscussion && (slug || urlId)
      ? `/d/${slug ?? urlId}` // Discussion/question namespace
      : author?.username && slug
        ? `/${author.username}/${slug}` // User-created content (POST or LINK)
        : author?.username && urlId
          ? `/${author.username}/${urlId}` // Member content, slug missing
          : source?.slug && slug
            ? `/s/${source.slug}/${slug}` // Aggregated content lives at /s/{source}/{slug}
            : type === "LINK" && externalUrl
              ? (ensureHttps(externalUrl) ?? "/")
              : author?.username
                ? `/${author.username}`
                : "/";

  const { mutate: voteContent } = api.content.vote.useMutation({
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
  const chip = KIND[editorialKind] ?? KIND.LINK;
  const authorName = author?.name ?? source?.name ?? null;
  const handle = author?.username ?? source?.slug ?? null;
  const avatarImg = author?.image ?? source?.logo ?? null;
  // The byline name links to the profile: users at /{username}, feed sources at
  // /s/{slug}. Members take priority, so an author present means it's a user.
  const handleHref = author?.username
    ? `/${author.username}`
    : source?.slug
      ? `/s/${source.slug}`
      : null;

  return (
    <article
      className="group rounded-lg border border-hairline bg-surface p-5 transition-colors duration-base ease-out hover:border-strong"
      data-testid="content-card"
    >
      <div className="flex gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center whitespace-nowrap rounded-sm border bg-elevated px-2 py-0.5 font-mono text-xs ${chip.className}`}
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
              (handleHref ? (
                <Link
                  href={handleHref}
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
              {type === "LINK" && source?.name ? (
                <>
                  {" · in "}
                  {source.slug ? (
                    <Link
                      href={`/s/${source.slug}`}
                      onClick={(e) => e.stopPropagation()}
                      className="text-accent-soft hover:text-accent"
                    >
                      {source.name}
                    </Link>
                  ) : (
                    <span className="text-accent-soft">{source.name}</span>
                  )}
                </>
              ) : (
                ""
              )}
              {readTimeMins ? ` · ${readTimeMins} min` : ""}
            </span>
          </div>

          <Link
            href={cardUrl}
            onClick={type === "LINK" ? handleExternalClick : undefined}
            className="mt-3 block"
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

        {/* Only render when a real image loads — no grey placeholder box. */}
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

      <div className="mt-3 flex flex-wrap items-center gap-3">
        {tags && tags.length > 0 && (
          <span className="min-w-0 truncate font-mono text-xs text-faint">
            {tags.map((t) => `#${t}`).join("  ")}
          </span>
        )}
        <div className="ml-auto flex items-center gap-3">
          <VoteControl
            base={
              votes.upvotes -
              votes.downvotes -
              (userVote === "up" ? 1 : userVote === "down" ? -1 : 0)
            }
            initial={userVote}
            compact
            onGate={!session ? () => signIn() : undefined}
            onVote={(next) => handleVote(next)}
          />
          <Link
            href={`${cardUrl}#discussion`}
            className="inline-flex items-center gap-1 whitespace-nowrap font-mono text-xs text-faint hover:text-muted"
          >
            {discussionCount} replies
          </Link>
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
          <button
            onClick={handleShare}
            title="Copy link"
            className={`whitespace-nowrap font-mono text-xs transition-colors ${
              shared ? "text-accent-soft" : "text-faint hover:text-muted"
            }`}
          >
            {shared ? "Copied" : "Share"}
          </button>
          <ReportButton
            type="post"
            id={String(id)}
            variant="icon"
            className="text-faint hover:text-muted"
          />
        </div>
      </div>
    </article>
  );
};

export default UnifiedContentCard;
