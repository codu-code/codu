"use client";

import { useState, useMemo } from "react";
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
import { InlineAuthorBio } from "@/components/ContentDetail";
import { FollowButton } from "@/components/ds";

type Props = {
  username: string;
  contentSlug: string;
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

const UserLinkDetail = ({ username, contentSlug }: Props) => {
  const { data: session } = useSession();
  const { data: linkContent, status } = api.content.getUserLinkBySlug.useQuery({
    username,
    slug: contentSlug,
  });

  const { data: discussionCount } =
    api.discussion.getContentDiscussionCount.useQuery(
      { contentId: linkContent?.id ?? "" },
      { enabled: !!linkContent?.id },
    );

  // Vote state management - derive initial values from query data
  const initialVoteState = useMemo(
    () => ({
      userVote: linkContent?.userVote ?? null,
      upvotes: linkContent?.upvotes ?? 0,
      downvotes: linkContent?.downvotes ?? 0,
    }),
    [linkContent?.userVote, linkContent?.upvotes, linkContent?.downvotes],
  );

  const [userVote, setUserVote] = useState<"up" | "down" | null>(
    initialVoteState.userVote,
  );
  const [votes, setVotes] = useState({
    upvotes: initialVoteState.upvotes,
    downvotes: initialVoteState.downvotes,
  });

  // Sync state when server data changes
  const currentUserVote = linkContent?.userVote ?? null;
  const currentUpvotes = linkContent?.upvotes ?? 0;
  const currentDownvotes = linkContent?.downvotes ?? 0;

  const serverVoteKey = `${currentUserVote}-${currentUpvotes}-${currentDownvotes}`;
  const [lastSyncedKey, setLastSyncedKey] = useState(serverVoteKey);

  if (serverVoteKey !== lastSyncedKey && linkContent) {
    setUserVote(currentUserVote);
    setVotes({ upvotes: currentUpvotes, downvotes: currentDownvotes });
    setLastSyncedKey(serverVoteKey);
  }

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
    const shareUrl = `${window.location.origin}/${username}/${contentSlug}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Link copied to clipboard");
    } catch {
      toast.error("Failed to copy link");
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

  if (status === "error" || !linkContent) {
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
            Content Not Found
          </h1>
          <p className="mt-2 text-sm text-muted">
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

  const hostname = externalUrl ? getHostname(externalUrl) : null;
  const score = votes.upvotes - votes.downvotes;

  const isOwner = session?.user?.id === linkContent.author?.id;

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
        Link
        {readableDate ? ` · ${readableDate}` : ""}
      </p>

      <h1 className="mt-4 font-display text-3xl font-extrabold tracking-tight text-fg md:text-4xl">
        {linkContent.title}
      </h1>

      {linkContent.excerpt && (
        <p className="mt-4 text-lg leading-relaxed text-muted">
          {linkContent.excerpt}
        </p>
      )}

      <div className="mt-6 flex items-center gap-3">
        <Link href={`/${username}`} className="flex-shrink-0">
          {linkContent.author?.image ? (
            <img
              src={linkContent.author.image}
              alt=""
              className="h-11 w-11 rounded-full border border-hairline object-cover"
            />
          ) : (
            <div className="bg-accent/12 flex h-11 w-11 items-center justify-center rounded-full text-sm font-bold text-accent">
              {linkContent.author?.name?.charAt(0).toUpperCase() || "?"}
            </div>
          )}
        </Link>
        <div className="min-w-0 flex-1">
          <Link
            href={`/${username}`}
            className="block text-sm font-semibold text-fg hover:text-accent"
          >
            {linkContent.author?.name || "Unknown"}
          </Link>
          <div className="font-mono text-xs text-faint">
            @{linkContent.author?.username || username}
            {hostname ? ` · ${hostname}` : ""}
          </div>
        </div>
        {session && !isOwner && linkContent.author?.id && (
          <FollowButton userId={linkContent.author.id} />
        )}
      </div>

      {ensureHttps(linkContent.coverImage) && externalUrl ? (
        <a
          href={externalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="relative mt-8 block overflow-hidden rounded-lg border border-hairline"
        >
          <img
            src={ensureHttps(linkContent.coverImage)!}
            alt=""
            className="w-full object-cover transition-opacity hover:opacity-90"
            style={{ maxHeight: "400px" }}
          />
          {hostname && (
            <div className="absolute bottom-2 right-2 rounded-md bg-canvas/70 px-2 py-1 font-mono text-xs text-fg backdrop-blur">
              <ArrowTopRightOnSquareIcon className="mr-1 inline h-3.5 w-3.5" />
              {hostname}
            </div>
          )}
        </a>
      ) : (
        <div className="mt-8 h-48 rounded-lg border border-hairline bg-elevated bg-grid-dots bg-[length:22px_22px]" />
      )}

      {externalUrl && hostname && (
        <a
          href={externalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="primary-button mt-8 w-full"
        >
          <ArrowTopRightOnSquareIcon className="h-5 w-5" />
          Visit Link at {hostname}
        </a>
      )}

      {linkContent.author && (
        <div className="mt-8">
          <InlineAuthorBio
            name={linkContent.author.name || "Unknown"}
            username={linkContent.author.username || ""}
            image={linkContent.author.image}
            bio={linkContent.author.bio}
          />
        </div>
      )}

      <footer className="mt-6 flex flex-wrap items-center gap-4 border-t border-hairline pt-5">
        <div className="flex items-center gap-1 rounded-md border border-hairline bg-surface">
          <button
            onClick={() => handleVote(userVote === "up" ? null : "up")}
            disabled={voteStatus === "pending"}
            className={`rounded-l-md p-2 transition-colors hover:bg-elevated disabled:cursor-not-allowed disabled:opacity-50 ${
              userVote === "up" ? "text-success" : "text-faint"
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
            onClick={() => handleVote(userVote === "down" ? null : "down")}
            disabled={voteStatus === "pending"}
            className={`rounded-r-md p-2 transition-colors hover:bg-elevated disabled:cursor-not-allowed disabled:opacity-50 ${
              userVote === "down" ? "text-danger" : "text-faint"
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
          onClick={handleShare}
          className="ml-auto flex items-center gap-1.5 font-mono text-sm text-muted transition-colors hover:text-fg"
        >
          <ShareIcon className="h-4 w-4" />
          Share
        </button>
      </footer>

      <section id="discussion" className="mt-10 border-t border-hairline pt-8">
        {linkContent.showComments ? (
          <>
            <h2 className="mb-4 font-display text-2xl font-extrabold tracking-tight text-fg">
              Discussion{" "}
              <span className="font-sans font-medium text-faint">
                {discussionCount ?? 0}
              </span>
            </h2>
            <DiscussionArea contentId={linkContent.id} noWrapper />
          </>
        ) : (
          <p className="italic text-muted">
            Comments are disabled for this link
          </p>
        )}
      </section>
    </article>
  );
};

export default UserLinkDetail;
