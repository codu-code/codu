"use client";

import Link from "next/link";
import * as Sentry from "@sentry/nextjs";
import {
  ArrowTopRightOnSquareIcon,
  BookmarkIcon,
  ChatBubbleLeftIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  ShareIcon,
} from "@heroicons/react/20/solid";
import { BookmarkIcon as BookmarkOutlineIcon } from "@heroicons/react/24/outline";
import { api } from "@/server/trpc/react";
import { signIn, useSession } from "next-auth/react";
import { toast } from "sonner";
import { Temporal } from "@js-temporal/polyfill";
import DiscussionArea from "@/components/Discussion/DiscussionArea";

type Props = {
  sourceSlug: string;
  articleSlug: string;
};

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

// Get hostname from URL
const getHostname = (urlString: string): string => {
  try {
    const url = new URL(urlString);
    return url.hostname;
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

const FeedArticleContent = ({ sourceSlug, articleSlug }: Props) => {
  const { data: session } = useSession();
  const utils = api.useUtils();

  const { data: article, status } = api.feed.getBySourceAndArticleSlug.useQuery(
    {
      sourceSlug,
      articleSlug,
    },
  );

  const { data: discussionCount } =
    api.discussion.getContentDiscussionCount.useQuery(
      { contentId: article?.id ?? "" },
      { enabled: !!article?.id },
    );

  const { mutate: vote, status: voteStatus } = api.content.vote.useMutation({
    onSuccess: () => {
      utils.feed.getBySourceAndArticleSlug.invalidate({
        sourceSlug,
        articleSlug,
      });
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
        utils.feed.getBySourceAndArticleSlug.invalidate({
          sourceSlug,
          articleSlug,
        });
        utils.feed.getFeed.invalidate();
        utils.feed.mySavedArticles.invalidate();
      },
      onError: (error) => {
        toast.error("Failed to update bookmark");
        Sentry.captureException(error);
      },
    });

  const { mutate: trackClick } = api.feed.trackClick.useMutation();

  const handleVote = (voteType: "up" | "down" | null) => {
    if (!session) {
      signIn();
      return;
    }
    if (article) {
      vote({ contentId: article.id, voteType });
    }
  };

  const handleBookmark = () => {
    if (!session) {
      signIn();
      return;
    }
    if (article) {
      bookmark({ articleId: article.id, setBookmarked: !article.isBookmarked });
    }
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/${sourceSlug}/${articleSlug}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Link copied to clipboard");
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const handleExternalClick = () => {
    if (article) {
      trackClick({ articleId: article.id });
    }
  };

  if (status === "pending") {
    return (
      <div className="mx-auto max-w-prose px-4 py-8">
        <div className="animate-pulse">
          <div className="mb-4 h-6 w-24 rounded bg-elevated" />
          <div className="mb-4 h-4 w-48 rounded bg-elevated" />
          <div className="mb-2 h-8 w-full rounded bg-elevated" />
          <div className="mb-4 h-8 w-3/4 rounded bg-elevated" />
          <div className="mb-6 h-20 w-full rounded bg-elevated" />
          <div className="h-12 w-full rounded bg-elevated" />
        </div>
      </div>
    );
  }

  if (status === "error" || !article) {
    return (
      <div className="mx-auto max-w-prose px-4 py-8">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-1.5 font-mono text-sm text-muted transition-colors hover:text-fg"
        >
          ‹ Back to feed
        </Link>
        <div className="card text-center">
          <h1 className="font-display text-lg font-extrabold text-danger">
            Post Not Found
          </h1>
          <p className="mt-2 text-sm text-muted">
            This post may have been removed or the link is invalid.
          </p>
        </div>
      </div>
    );
  }

  const dateTime = article.publishedAt
    ? Temporal.Instant.from(new Date(article.publishedAt).toISOString())
    : null;
  const readableDate = dateTime
    ? dateTime.toLocaleString(["en-IE"], {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  const faviconUrl = getFaviconUrl(
    article.source?.websiteUrl || article.externalUrl,
  );
  const hostname = article.externalUrl
    ? getHostname(article.externalUrl)
    : null;
  const score = article.upvotes - article.downvotes;

  return (
    <article className="mx-auto max-w-prose px-4 py-8">
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-1.5 font-mono text-sm text-muted transition-colors hover:text-fg"
      >
        ‹ Back to feed
      </Link>

      <p className="eyebrow">
        <span className="slash">{"// "}</span>
        {article.source?.name || "Article"}
        {readableDate ? ` · ${readableDate}` : ""}
      </p>

      <h1 className="mt-4 font-display text-3xl font-extrabold tracking-tight text-fg md:text-4xl">
        {article.title}
      </h1>

      {article.excerpt && (
        <p className="mt-4 text-lg leading-relaxed text-muted">
          {article.excerpt}
        </p>
      )}

      <div className="mt-6 flex items-center gap-3">
        <Link href={`/${sourceSlug}`} className="flex-shrink-0">
          {article.source?.logoUrl ? (
            <img
              src={article.source.logoUrl}
              alt=""
              className="h-11 w-11 rounded-full border border-hairline object-cover"
            />
          ) : faviconUrl ? (
            <img
              src={faviconUrl}
              alt=""
              className="h-11 w-11 rounded-full border border-hairline"
            />
          ) : (
            <div className="bg-accent/12 flex h-11 w-11 items-center justify-center rounded-full text-sm font-bold text-accent">
              {article.source?.name?.charAt(0).toUpperCase() || "?"}
            </div>
          )}
        </Link>
        <div className="min-w-0 flex-1">
          <Link
            href={`/${sourceSlug}`}
            className="block text-sm font-semibold text-fg hover:text-accent"
          >
            {article.source?.name || "Unknown Source"}
          </Link>
          <div className="font-mono text-xs text-faint">
            @{sourceSlug}
            {article.sourceAuthor &&
            article.sourceAuthor.trim() &&
            !["by", "by,", "by ,"].includes(
              article.sourceAuthor.trim().toLowerCase(),
            )
              ? ` · ${article.sourceAuthor.replace(/^by\s+/i, "").trim()}`
              : ""}
          </div>
        </div>
      </div>

      {ensureHttps(article.imageUrl) && article.externalUrl ? (
        <a
          href={article.externalUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleExternalClick}
          className="relative mt-8 block overflow-hidden rounded-lg border border-hairline"
        >
          <img
            src={ensureHttps(article.imageUrl)!}
            alt=""
            className="w-full object-cover transition-opacity hover:opacity-90"
            style={{ maxHeight: "400px" }}
          />
          <div className="absolute bottom-2 right-2 rounded-md bg-canvas/70 px-2 py-1 font-mono text-xs text-fg backdrop-blur">
            <ArrowTopRightOnSquareIcon className="mr-1 inline h-3.5 w-3.5" />
            {hostname}
          </div>
        </a>
      ) : (
        <div className="mt-8 h-48 rounded-lg border border-hairline bg-elevated bg-grid-dots bg-[length:22px_22px]" />
      )}

      {article.externalUrl && (
        <a
          href={article.externalUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleExternalClick}
          className="primary-button mt-8 w-full"
        >
          <ArrowTopRightOnSquareIcon className="h-5 w-5" />
          Read Full Article at {hostname}
        </a>
      )}

      {/* Inline source info - styled like author bio */}
      {article.source && (
        <div className="mt-8 flex items-center gap-3 rounded-lg border border-hairline bg-surface p-4">
          <Link href={`/${sourceSlug}`} className="flex-shrink-0">
            {article.source.logoUrl ? (
              <img
                src={article.source.logoUrl}
                alt=""
                className="h-8 w-8 rounded-full object-cover"
              />
            ) : faviconUrl ? (
              <img src={faviconUrl} alt="" className="h-8 w-8 rounded-full" />
            ) : (
              <div className="bg-accent/12 flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold text-accent">
                {article.source.name?.charAt(0).toUpperCase() || "?"}
              </div>
            )}
          </Link>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <Link
                href={`/${sourceSlug}`}
                className="font-medium text-fg hover:text-accent"
              >
                {article.source.name}
              </Link>
              <span className="font-mono text-xs text-faint">
                @{sourceSlug}
              </span>
            </div>
            {article.source.description && (
              <p className="truncate text-sm text-muted">
                {article.source.description}
              </p>
            )}
          </div>
        </div>
      )}

      <footer className="mt-6 flex flex-wrap items-center gap-4 border-t border-hairline pt-5">
        <div className="flex items-center gap-1 rounded-md border border-hairline bg-surface">
          <button
            onClick={() => handleVote(article.userVote === "up" ? null : "up")}
            disabled={voteStatus === "pending"}
            className={`rounded-l-md p-2 transition-colors hover:bg-elevated disabled:cursor-not-allowed disabled:opacity-50 ${
              article.userVote === "up" ? "text-success" : "text-faint"
            }`}
            aria-label="Upvote"
          >
            <ChevronUpIcon className="h-5 w-5" />
          </button>
          <span
            className={`min-w-[2.5rem] text-center font-mono text-sm font-bold ${
              score > 0
                ? "text-success"
                : score < 0
                  ? "text-danger"
                  : "text-faint"
            }`}
          >
            {score}
          </span>
          <button
            onClick={() =>
              handleVote(article.userVote === "down" ? null : "down")
            }
            disabled={voteStatus === "pending"}
            className={`rounded-r-md p-2 transition-colors hover:bg-elevated disabled:cursor-not-allowed disabled:opacity-50 ${
              article.userVote === "down" ? "text-danger" : "text-faint"
            }`}
            aria-label="Downvote"
          >
            <ChevronDownIcon className="h-5 w-5" />
          </button>
        </div>

        <a
          href="#discussion"
          className="flex items-center gap-1.5 font-mono text-sm text-muted transition-colors hover:text-fg"
        >
          <ChatBubbleLeftIcon className="h-4 w-4" />
          <span>{discussionCount ?? 0} comments</span>
        </a>

        <button
          onClick={handleBookmark}
          disabled={bookmarkStatus === "pending"}
          className={`flex items-center gap-1.5 font-mono text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
            article.isBookmarked
              ? "text-accent-soft"
              : "text-muted hover:text-fg"
          }`}
        >
          {article.isBookmarked ? (
            <BookmarkIcon className="h-4 w-4" />
          ) : (
            <BookmarkOutlineIcon className="h-4 w-4" />
          )}
          {article.isBookmarked ? "Saved" : "Save"}
        </button>

        <button
          onClick={handleShare}
          className="ml-auto flex items-center gap-1.5 font-mono text-sm text-muted transition-colors hover:text-fg"
        >
          <ShareIcon className="h-4 w-4" />
          Share
        </button>
      </footer>

      <section id="discussion" className="mt-10 border-t border-hairline pt-8">
        <h2 className="mb-4 font-display text-2xl font-extrabold tracking-tight text-fg">
          Discussion{" "}
          <span className="font-sans font-medium text-faint">
            {discussionCount ?? 0}
          </span>
        </h2>
        <DiscussionArea contentId={article.id} noWrapper />
      </section>
    </article>
  );
};

export default FeedArticleContent;
