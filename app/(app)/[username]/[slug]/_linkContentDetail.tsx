"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowTopRightOnSquareIcon,
  ChatBubbleLeftIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  ShareIcon,
} from "@heroicons/react/20/solid";
import { api } from "@/server/trpc/react";
import { toast } from "sonner";
import { Temporal } from "@js-temporal/polyfill";
import DiscussionArea from "@/components/Discussion/DiscussionArea";
import { useSession, signIn } from "next-auth/react";

type Props = {
  sourceSlug: string;
  contentSlug: string;
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

const LinkContentDetail = ({ sourceSlug, contentSlug }: Props) => {
  const { data: session } = useSession();
  const { data: linkContent, status } =
    api.feed.getLinkContentBySourceAndSlug.useQuery({
      sourceSlug,
      contentSlug,
    });

  const { data: discussionCount } =
    api.discussion.getContentDiscussionCount.useQuery(
      { contentId: linkContent?.id ?? "" },
      { enabled: !!linkContent?.id },
    );

  // Vote state management
  const [userVote, setUserVote] = useState<"up" | "down" | null>(null);
  const [votes, setVotes] = useState({ upvotes: 0, downvotes: 0 });

  // Initialize vote state when data loads
  useEffect(() => {
    if (linkContent) {
      setUserVote(linkContent.userVote ?? null);
      setVotes({
        upvotes: linkContent.upvotes,
        downvotes: linkContent.downvotes,
      });
    }
  }, [linkContent]);

  const { mutate: vote, status: voteStatus } = api.content.vote.useMutation({
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
    onError: () => {
      setUserVote(linkContent?.userVote ?? null);
      setVotes({
        upvotes: linkContent?.upvotes ?? 0,
        downvotes: linkContent?.downvotes ?? 0,
      });
      toast.error("Failed to update vote");
    },
  });

  const handleVote = (voteType: "up" | "down" | null) => {
    if (!session) {
      signIn();
      return;
    }
    if (!linkContent) return;
    vote({ contentId: linkContent.id, voteType });
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/${sourceSlug}/${contentSlug}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Link copied to clipboard");
    } catch {
      toast.error("Failed to copy link");
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

  if (status === "error" || !linkContent) {
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
            Content Not Found
          </h1>
          <p className="mt-2 text-sm text-red-600 dark:text-red-400">
            This link may have been removed or the URL is invalid.
          </p>
        </div>
      </div>
    );
  }

  const externalUrl = linkContent.externalUrl || "";
  const dateTime = linkContent.publishedAt
    ? Temporal.Instant.from(new Date(linkContent.publishedAt).toISOString())
    : null;
  const readableDate = dateTime
    ? dateTime.toLocaleString(["en-IE"], {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  const faviconUrl = getFaviconUrl(
    linkContent.source?.websiteUrl || externalUrl,
  );
  const hostname = externalUrl ? getHostname(externalUrl) : null;
  const score = votes.upvotes - votes.downvotes;

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
          {linkContent.source?.name || sourceSlug}
        </Link>
      </nav>

      {/* Content card */}
      <article className="rounded-lg border border-neutral-200 bg-white p-6 dark:border-neutral-700 dark:bg-neutral-900">
        {/* Source info */}
        <div className="mb-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-neutral-500 dark:text-neutral-400">
          <Link
            href={`/${sourceSlug}`}
            className="flex items-center gap-2 hover:text-neutral-700 dark:hover:text-neutral-200"
          >
            {linkContent.source?.logoUrl ? (
              <img
                src={linkContent.source.logoUrl}
                alt=""
                className="h-5 w-5 rounded object-cover"
              />
            ) : faviconUrl ? (
              <img src={faviconUrl} alt="" className="h-5 w-5 rounded" />
            ) : (
              <div className="flex h-5 w-5 items-center justify-center rounded bg-orange-100 text-xs font-bold text-orange-600 dark:bg-orange-900 dark:text-orange-300">
                {linkContent.source?.name?.charAt(0).toUpperCase() || "?"}
              </div>
            )}
            <span className="font-medium">
              {linkContent.source?.name || "Unknown Source"}
            </span>
          </Link>
          {linkContent.sourceAuthor && linkContent.sourceAuthor.trim() && (
            <>
              <span aria-hidden="true">·</span>
              <span>{linkContent.sourceAuthor}</span>
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
          {linkContent.title}
        </h1>

        {/* Excerpt */}
        {linkContent.excerpt && (
          <p className="mb-4 text-neutral-600 dark:text-neutral-400">
            {linkContent.excerpt}
          </p>
        )}

        {/* Thumbnail image */}
        {ensureHttps(linkContent.imageUrl) && externalUrl && (
          <a
            href={externalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="relative mb-4 block overflow-hidden rounded-lg"
          >
            <img
              src={ensureHttps(linkContent.imageUrl)!}
              alt=""
              className="w-full object-cover transition-opacity hover:opacity-90"
              style={{ maxHeight: "400px" }}
            />
            {hostname && (
              <div className="absolute bottom-2 right-2 rounded bg-black/60 px-2 py-1 text-xs text-white">
                <ArrowTopRightOnSquareIcon className="mr-1 inline h-3.5 w-3.5" />
                {hostname}
              </div>
            )}
          </a>
        )}

        {/* Visit link CTA */}
        {externalUrl && hostname && (
          <a
            href={externalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 rounded-lg bg-orange-500 px-6 py-3 font-medium text-white transition-colors hover:bg-orange-600"
          >
            <ArrowTopRightOnSquareIcon className="h-5 w-5" />
            Visit Link at {hostname}
          </a>
        )}

        {/* Inline source info - styled like author bio */}
        {linkContent.source && (
          <div className="mt-8 flex items-center gap-3">
            <Link href={`/${sourceSlug}`} className="flex-shrink-0">
              {linkContent.source.logoUrl ? (
                <img
                  src={linkContent.source.logoUrl}
                  alt=""
                  className="h-8 w-8 rounded-full object-cover"
                />
              ) : faviconUrl ? (
                <img src={faviconUrl} alt="" className="h-8 w-8 rounded-full" />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100 text-sm font-bold text-orange-600 dark:bg-orange-900 dark:text-orange-300">
                  {linkContent.source.name?.charAt(0).toUpperCase() || "?"}
                </div>
              )}
            </Link>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <Link
                  href={`/${sourceSlug}`}
                  className="font-medium text-neutral-900 hover:underline dark:text-neutral-100"
                >
                  {linkContent.source.name}
                </Link>
                <span className="text-sm text-neutral-500 dark:text-neutral-400">
                  @{sourceSlug}
                </span>
              </div>
              {linkContent.source.description && (
                <p className="truncate text-sm text-neutral-500 dark:text-neutral-400">
                  {linkContent.source.description}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Action bar - just above discussion */}
        <div className="mt-8 flex flex-wrap items-center gap-2">
          {/* Vote buttons */}
          <div className="flex items-center rounded-full border border-neutral-200 dark:border-neutral-700">
            <button
              onClick={() => handleVote(userVote === "up" ? null : "up")}
              disabled={voteStatus === "pending"}
              className={`rounded-l-full p-2 transition-colors hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-neutral-800 ${
                userVote === "up"
                  ? "text-green-500"
                  : "text-neutral-400 dark:text-neutral-500"
              }`}
              aria-label="Upvote"
            >
              <ChevronUpIcon className="h-5 w-5" />
            </button>
            <span
              className={`min-w-[2rem] text-center text-sm font-semibold ${
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
              className={`rounded-r-full p-2 transition-colors hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-neutral-800 ${
                userVote === "down"
                  ? "text-red-500"
                  : "text-neutral-400 dark:text-neutral-500"
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

          {/* Share button */}
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 rounded-full bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700"
          >
            <ShareIcon className="h-4 w-4" />
            Share
          </button>
        </div>

        {/* Discussion section */}
        <section id="discussion" className="mt-8">
          <DiscussionArea contentId={linkContent.id} noWrapper />
        </section>
      </article>
    </div>
  );
};

export default LinkContentDetail;
