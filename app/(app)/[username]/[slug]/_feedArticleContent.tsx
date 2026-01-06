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

  const { mutate: vote, status: voteStatus } = api.feed.vote.useMutation({
    onSuccess: () => {
      utils.feed.getBySourceAndArticleSlug.invalidate({
        sourceSlug,
        articleSlug,
      });
      utils.feed.getFeed.invalidate();
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
      vote({ articleId: article.id, voteType });
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
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="animate-pulse">
          <div className="mb-4 h-6 w-24 rounded bg-neutral-200 dark:bg-neutral-700" />
          <div className="mb-4 h-4 w-48 rounded bg-neutral-200 dark:bg-neutral-700" />
          <div className="mb-2 h-8 w-full rounded bg-neutral-200 dark:bg-neutral-700" />
          <div className="mb-4 h-8 w-3/4 rounded bg-neutral-200 dark:bg-neutral-700" />
          <div className="mb-6 h-20 w-full rounded bg-neutral-200 dark:bg-neutral-700" />
          <div className="h-12 w-full rounded bg-neutral-200 dark:bg-neutral-700" />
        </div>
      </div>
    );
  }

  if (status === "error" || !article) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <Link
          href="/feed"
          className="mb-4 inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
        >
          Back to Feed
        </Link>
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center dark:border-red-800 dark:bg-red-950">
          <h1 className="text-lg font-semibold text-red-700 dark:text-red-300">
            Post Not Found
          </h1>
          <p className="mt-2 text-sm text-red-600 dark:text-red-400">
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

  const faviconUrl = getFaviconUrl(article.source?.websiteUrl || article.externalUrl);
  const hostname = article.externalUrl ? getHostname(article.externalUrl) : null;
  const score = article.upvotes - article.downvotes;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400">
        <Link
          href="/feed"
          className="hover:text-neutral-700 dark:hover:text-neutral-200"
        >
          Feed
        </Link>
        <span aria-hidden="true">/</span>
        <Link
          href={`/${sourceSlug}`}
          className="hover:text-neutral-700 dark:hover:text-neutral-200"
        >
          {article.source?.name || sourceSlug}
        </Link>
      </nav>

      {/* Article card */}
      <article className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-900">
        {/* Source info */}
        <div className="mb-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-neutral-500 dark:text-neutral-400">
          <Link
            href={`/${sourceSlug}`}
            className="flex items-center gap-2 hover:text-neutral-700 dark:hover:text-neutral-200"
          >
            {article.source?.logoUrl ? (
              <img
                src={article.source.logoUrl}
                alt=""
                className="h-5 w-5 rounded object-cover"
              />
            ) : faviconUrl ? (
              <img src={faviconUrl} alt="" className="h-5 w-5 rounded" />
            ) : (
              <div className="flex h-5 w-5 items-center justify-center rounded bg-orange-100 text-xs font-bold text-orange-600 dark:bg-orange-900 dark:text-orange-300">
                {article.source?.name?.charAt(0).toUpperCase() || "?"}
              </div>
            )}
            <span className="font-medium">
              {article.source?.name || "Unknown Source"}
            </span>
          </Link>
          {article.sourceAuthor &&
            article.sourceAuthor.trim() &&
            !["by", "by,", "by ,"].includes(
              article.sourceAuthor.trim().toLowerCase(),
            ) && (
              <>
                <span aria-hidden="true">·</span>
                <span>{article.sourceAuthor.replace(/^by\s+/i, "").trim()}</span>
              </>
            )}
          {readableDate && (
            <>
              <span aria-hidden="true">·</span>
              <time dateTime={dateTime?.toString()}>{readableDate}</time>
            </>
          )}
        </div>

        {/* Title */}
        <h1 className="mb-3 text-2xl font-bold leading-tight text-neutral-900 dark:text-neutral-100 md:text-3xl">
          {article.title}
        </h1>

        {/* Excerpt */}
        {article.excerpt && (
          <p className="mb-4 text-neutral-600 dark:text-neutral-400">
            {article.excerpt}
          </p>
        )}

        {/* Thumbnail image */}
        {ensureHttps(article.imageUrl) && article.externalUrl && (
          <a
            href={article.externalUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleExternalClick}
            className="relative mb-4 block overflow-hidden rounded-lg"
          >
            <img
              src={ensureHttps(article.imageUrl)!}
              alt=""
              className="w-full object-cover transition-opacity hover:opacity-90"
              style={{ maxHeight: "400px" }}
            />
            <div className="absolute bottom-2 right-2 rounded bg-black/60 px-2 py-1 text-xs text-white">
              <ArrowTopRightOnSquareIcon className="mr-1 inline h-3.5 w-3.5" />
              {hostname}
            </div>
          </a>
        )}

        {/* Read article CTA */}
        {article.externalUrl && (
          <a
            href={article.externalUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleExternalClick}
            className="flex items-center justify-center gap-2 rounded-lg bg-orange-500 px-6 py-3 font-medium text-white transition-colors hover:bg-orange-600"
          >
            <ArrowTopRightOnSquareIcon className="h-5 w-5" />
            Read Full Article at {hostname}
          </a>
        )}

        {/* Action bar */}
        <div className="mt-8 flex flex-wrap items-center gap-2">
          {/* Vote buttons */}
          <div className="flex items-center rounded-full bg-neutral-100 dark:bg-neutral-800">
            <button
              onClick={() =>
                handleVote(article.userVote === "up" ? null : "up")
              }
              disabled={voteStatus === "pending"}
              className={`rounded-l-full p-2 transition-colors hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-neutral-700 ${
                article.userVote === "up"
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
              onClick={() =>
                handleVote(article.userVote === "down" ? null : "down")
              }
              disabled={voteStatus === "pending"}
              className={`rounded-r-full p-2 transition-colors hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-neutral-700 ${
                article.userVote === "down"
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
            <span>{discussionCount ?? 0} comments</span>
          </a>

          {/* Save button */}
          <button
            onClick={handleBookmark}
            disabled={bookmarkStatus === "pending"}
            className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
              article.isBookmarked
                ? "bg-blue-100 text-blue-600 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50"
                : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700"
            }`}
          >
            {article.isBookmarked ? (
              <BookmarkIcon className="h-4 w-4" />
            ) : (
              <BookmarkOutlineIcon className="h-4 w-4" />
            )}
            {article.isBookmarked ? "Saved" : "Save"}
          </button>

          {/* Share button */}
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 rounded-full bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700"
          >
            <ShareIcon className="h-4 w-4" />
            Share
          </button>
        </div>

        {/* Inline source info */}
        {article.source && (
          <div className="mt-6 flex items-center gap-3">
            <Link href={`/${sourceSlug}`} className="flex-shrink-0">
              {article.source.logoUrl ? (
                <img
                  src={article.source.logoUrl}
                  alt=""
                  className="h-8 w-8 rounded-lg object-cover"
                />
              ) : faviconUrl ? (
                <img src={faviconUrl} alt="" className="h-8 w-8 rounded-lg" />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-100 text-sm font-bold text-orange-600 dark:bg-orange-900 dark:text-orange-300">
                  {article.source.name?.charAt(0).toUpperCase() || "?"}
                </div>
              )}
            </Link>
            <div className="min-w-0 flex-1">
              <Link
                href={`/${sourceSlug}`}
                className="font-medium text-neutral-900 hover:underline dark:text-neutral-100"
              >
                {article.source.name}
              </Link>
              {article.source.description && (
                <p className="truncate text-sm text-neutral-500 dark:text-neutral-400">
                  {article.source.description}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Discussion section - inside the card */}
        <section id="discussion" className="mt-8">
          <DiscussionArea
            contentId={article.id}
            noWrapper
          />
        </section>
      </article>
    </div>
  );
};

export default FeedArticleContent;
