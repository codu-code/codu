"use client";

import * as Sentry from "@sentry/nextjs";
import {
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
import DiscussionArea from "@/components/Discussion/DiscussionArea";

// Outbound anchor that records a click before handing off to the source site.
// "use client" components still server-render, so the crawlable href is in the
// initial HTML — only the onClick handler needs the client runtime.
export const TrackedExternalLink = ({
  articleId,
  href,
  className,
  children,
}: {
  articleId: string;
  href: string;
  className?: string;
  children: React.ReactNode;
}) => {
  const { mutate: trackClick } = api.feed.trackClick.useMutation();

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => trackClick({ articleId })}
      className={className}
    >
      {children}
    </a>
  );
};

type FooterProps = {
  contentId: string;
  sourceSlug: string;
  articleSlug: string;
  initialUpvotes: number;
  initialDownvotes: number;
};

// Per-user interactivity island: votes, bookmark, share, comment count and the
// discussion thread. Static article content is server-rendered by the parent;
// this re-fetches only to hydrate user state (vote/bookmark) and live counts.
const FeedArticleInteractions = ({
  contentId,
  sourceSlug,
  articleSlug,
  initialUpvotes,
  initialDownvotes,
}: FooterProps) => {
  const { data: session } = useSession();
  const utils = api.useUtils();

  const { data: article } = api.feed.getBySourceAndArticleSlug.useQuery({
    sourceSlug,
    articleSlug,
  });

  const { data: discussionCount } =
    api.discussion.getContentDiscussionCount.useQuery({ contentId });

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

  const userVote = article?.userVote ?? null;
  const isBookmarked = article?.isBookmarked ?? false;
  const upvotes = article?.upvotes ?? initialUpvotes;
  const downvotes = article?.downvotes ?? initialDownvotes;
  const score = upvotes - downvotes;

  const handleVote = (voteType: "up" | "down" | null) => {
    if (!session) {
      signIn();
      return;
    }
    vote({ contentId, voteType });
  };

  const handleBookmark = () => {
    if (!session) {
      signIn();
      return;
    }
    bookmark({ articleId: contentId, setBookmarked: !isBookmarked });
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/s/${sourceSlug}/${articleSlug}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Link copied to clipboard");
    } catch {
      toast.error("Failed to copy link");
    }
  };

  return (
    <>
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
          onClick={handleBookmark}
          disabled={bookmarkStatus === "pending"}
          className={`flex items-center gap-1.5 font-mono text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
            isBookmarked ? "text-accent-soft" : "text-muted hover:text-fg"
          }`}
        >
          {isBookmarked ? (
            <BookmarkIcon className="h-4 w-4" />
          ) : (
            <BookmarkOutlineIcon className="h-4 w-4" />
          )}
          {isBookmarked ? "Saved" : "Save"}
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
        <DiscussionArea contentId={contentId} noWrapper />
      </section>
    </>
  );
};

export default FeedArticleInteractions;
