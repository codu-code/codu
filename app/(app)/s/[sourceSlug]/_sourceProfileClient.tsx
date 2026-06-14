"use client";

import Link from "next/link";
import { useState } from "react";
import { signIn, useSession } from "next-auth/react";
import { toast } from "sonner";
import { api } from "@/server/trpc/react";
import { type RouterOutputs } from "@/server/trpc/shared";
import { UnifiedContentCard } from "@/components/UnifiedContentCard";
import { hueFromString } from "@/utils/hue";

type SourceProfile = RouterOutputs["publication"]["getBySlug"];

type Props = {
  sourceSlug: string;
  /** Server-resolved profile (anonymous view) so the header + first page of
   * articles are in the SSR HTML for crawlers; per-user state (isFollowing,
   * votes, bookmarks) hydrates via the immediate background refetch. */
  initialProfile: SourceProfile;
};

// Two-letter initials for the square logo tile.
const initialsFromName = (name: string): string => {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "??";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
};

const SourceProfileContent = ({ sourceSlug, initialProfile }: Props) => {
  const { data: session } = useSession();
  const utils = api.useUtils();

  // Seeded with the server-resolved profile so SSR emits the full header +
  // article list; the default staleTime of 0 means a refetch fires on mount to
  // pick up per-user state (isFollowing, votes, bookmarks).
  const { data: pub, status } = api.publication.getBySlug.useQuery(
    { slug: sourceSlug },
    { initialData: initialProfile },
  );

  // Optimistic follow state, seeded from the query once it resolves.
  const [optimisticFollowing, setOptimisticFollowing] = useState<
    boolean | null
  >(null);
  const [shared, setShared] = useState(false);

  const onError = () => {
    setOptimisticFollowing(null);
    toast.error("Something went wrong. Please try again.");
    void utils.publication.getBySlug.invalidate({ slug: sourceSlug });
  };
  const onSettled = () => {
    void utils.publication.getBySlug.invalidate({ slug: sourceSlug });
  };

  const followMut = api.publication.follow.useMutation({ onError, onSettled });
  const unfollowMut = api.publication.unfollow.useMutation({
    onError,
    onSettled,
  });
  const pending = followMut.isPending || unfollowMut.isPending;

  // No pending branch: initialData means the query always has data, so the
  // first render (including SSR) is the real profile rather than a skeleton.
  if (status === "error" || !pub) {
    return (
      <div className="mx-auto max-w-2xl px-0 py-4 sm:px-4 sm:py-8 text-fg">
        <div className="bg-danger/12 rounded-lg border border-danger/30 p-6 text-center">
          <h1 className="text-lg font-semibold text-danger">
            Publication Not Found
          </h1>
          <p className="mt-2 text-sm text-danger">
            This publication may have been removed or the link is invalid.
          </p>
          <Link
            href="/feed"
            className="mt-4 inline-block text-sm text-accent-soft hover:text-accent"
          >
            Back to Feed
          </Link>
        </div>
      </div>
    );
  }

  const hue = hueFromString(pub.slug ?? sourceSlug);
  const initials = initialsFromName(pub.name);
  const isFollowing = optimisticFollowing ?? pub.isFollowing;

  const handleFollowToggle = () => {
    if (!session) {
      signIn();
      return;
    }
    if (pending) return;
    if (isFollowing) {
      setOptimisticFollowing(false);
      unfollowMut.mutate({ sourceId: pub.id });
    } else {
      setOptimisticFollowing(true);
      followMut.mutate({ sourceId: pub.id });
    }
  };

  const handleShare = () => {
    const url =
      typeof window !== "undefined"
        ? window.location.href
        : `/${pub.slug ?? sourceSlug}`;
    void navigator.clipboard?.writeText(url).then(() => {
      setShared(true);
      setTimeout(() => setShared(false), 1200);
    });
  };

  return (
    <div className="mx-auto max-w-2xl px-4 pt-6 text-fg">
      <header>
        <div className="flex items-start gap-4">
          {/* Square logo tile — the "publication, not person" signal. */}
          {pub.logoUrl ? (
            <img
              src={pub.logoUrl}
              alt={`${pub.name} logo`}
              className="h-16 w-16 flex-shrink-0 rounded-lg object-cover"
            />
          ) : (
            <div
              className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-lg font-display text-xl font-extrabold text-on-accent"
              style={{ backgroundColor: `oklch(0.5 0.09 ${hue})` }}
              aria-hidden="true"
            >
              {initials}
            </div>
          )}

          <div className="min-w-0 flex-1">
            <p className="eyebrow">
              <span className="slash">{"// "}</span>publication
            </p>
            <h1 className="mb-0 mt-1 font-display text-3xl font-extrabold tracking-tight text-fg">
              {pub.name}
            </h1>
            <p className="mt-0.5 font-mono text-sm text-faint">
              @{pub.handle ?? sourceSlug}
            </p>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleFollowToggle}
            disabled={pending}
            aria-pressed={isFollowing}
            className={isFollowing ? "secondary-button" : "primary-button"}
          >
            {isFollowing ? "✓ Following" : "＋ Follow"}
          </button>
          <button
            type="button"
            onClick={handleShare}
            className="secondary-button"
          >
            {shared ? "Copied" : "Share"}
          </button>
        </div>

        {pub.tagline && (
          <p className="mt-4 max-w-[60ch] leading-relaxed text-muted">
            {pub.tagline}
          </p>
        )}

        {/* Stats — Followers + Articles only (no Following). */}
        <div className="mt-6 flex flex-wrap gap-8">
          <div>
            <div className="whitespace-nowrap font-display text-2xl font-extrabold text-fg">
              {pub.followerCount}
            </div>
            <div className="font-mono text-xs uppercase tracking-[0.15em] text-faint">
              Followers
            </div>
          </div>
          <div>
            <div className="whitespace-nowrap font-display text-2xl font-extrabold text-fg">
              {pub.articleCount}
            </div>
            <div className="font-mono text-xs uppercase tracking-[0.15em] text-faint">
              Articles
            </div>
          </div>
        </div>
      </header>

      <section className="mt-8">
        <p className="eyebrow mb-3">
          <span className="slash">{"// "}</span>latest articles
        </p>

        {pub.articles.length === 0 ? (
          <p className="py-4 font-medium text-muted">Nothing published yet.</p>
        ) : (
          <div className="space-y-4 overflow-hidden rounded-lg border border-hairline">
            {pub.articles.map((article) => (
              <UnifiedContentCard
                key={article.id}
                type="LINK"
                id={article.id}
                title={article.title}
                excerpt={article.excerpt}
                slug={article.slug}
                imageUrl={article.imageUrl}
                externalUrl={article.url}
                publishedAt={article.publishedAt}
                upvotes={article.upvotes}
                downvotes={article.downvotes}
                userVote={article.userVote}
                isBookmarked={article.isBookmarked}
                discussionCount={0}
                source={{
                  name: pub.name,
                  slug: pub.slug,
                  logo: pub.logoUrl,
                  websiteUrl: pub.websiteUrl,
                }}
                linkAuthor={article.author}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default SourceProfileContent;
