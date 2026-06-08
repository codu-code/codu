"use client";

import Link from "next/link";
import { LinkIcon } from "@heroicons/react/20/solid";
import { api } from "@/server/trpc/react";
import { useInView } from "react-intersection-observer";
import { useEffect } from "react";
import { Heading } from "@/components/ui-components/heading";
import { UnifiedContentCard } from "@/components/UnifiedContentCard";

type Props = {
  sourceSlug: string;
};

// Get favicon URL from a website
const getFaviconUrl = (
  websiteUrl: string | null | undefined,
): string | null => {
  if (!websiteUrl) return null;
  try {
    const url = new URL(websiteUrl);
    return `https://www.google.com/s2/favicons?domain=${url.hostname}&sz=128`;
  } catch {
    return null;
  }
};

function getDomainFromUrl(url: string) {
  const domain = url.replace(/(https?:\/\/)?(www.)?/i, "");
  if (domain[domain.length - 1] === "/") {
    return domain.slice(0, domain.length - 1);
  }
  return domain;
}

const SourceProfileContent = ({ sourceSlug }: Props) => {
  const { ref: loadMoreRef, inView } = useInView({ threshold: 0 });

  const { data: source, status: sourceStatus } =
    api.feed.getSourceBySlug.useQuery({ slug: sourceSlug });

  const {
    data: articlesData,
    status: articlesStatus,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = api.feed.getArticlesBySource.useInfiniteQuery(
    { sourceSlug, sort: "recent", limit: 25 },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    },
  );

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (sourceStatus === "pending") {
    return (
      <div className="mx-auto max-w-2xl px-4 text-black dark:text-white">
        <div
          aria-hidden
          className="mt-2 h-32 animate-pulse rounded-2xl bg-elevated sm:h-40"
        />
        <div className="flex flex-col gap-4 px-1 sm:flex-row sm:items-end">
          <div className="-mt-[52px] h-24 w-24 flex-shrink-0 animate-pulse rounded-full bg-inset ring-4 ring-canvas" />
          <div className="flex flex-col justify-center gap-2 sm:pb-1.5">
            <div className="h-6 w-48 animate-pulse rounded bg-inset" />
            <div className="h-4 w-32 animate-pulse rounded bg-inset" />
          </div>
        </div>
      </div>
    );
  }

  if (sourceStatus === "error" || !source) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8 text-black dark:text-white">
        <div className="rounded-lg border border-danger/30 bg-danger/12 p-6 text-center">
          <h1 className="text-lg font-semibold text-danger">
            Source Not Found
          </h1>
          <p className="mt-2 text-sm text-muted">
            This source may have been removed or the link is invalid.
          </p>
          <Link
            href="/"
            className="mt-4 inline-block text-sm text-accent-soft hover:text-accent"
          >
            Back to Feed
          </Link>
        </div>
      </div>
    );
  }

  const faviconUrl = getFaviconUrl(source.websiteUrl);
  const articles = articlesData?.pages.flatMap((page) => page.articles) ?? [];

  return (
    <>
      <div className="text-900 mx-auto max-w-2xl px-4 text-black dark:text-white">
        {/* Gradient banner - matching user profile */}
        <div
          aria-hidden
          className="relative mt-2 h-32 overflow-hidden rounded-2xl bg-gradient-to-r from-elevated via-accent/20 to-elevated sm:h-40"
        >
          <div className="absolute inset-0 bg-grid-dots bg-[length:22px_22px] opacity-40" />
        </div>

        {/* Profile header - matching user profile pattern */}
        <div className="flex flex-col gap-4 px-1 sm:flex-row sm:items-end">
          <div className="-mt-[52px] flex-shrink-0">
            {source.logoUrl ? (
              <img
                className="h-24 w-24 rounded-full object-cover ring-4 ring-canvas"
                alt={`Avatar for ${source.name}`}
                src={source.logoUrl}
              />
            ) : faviconUrl ? (
              <img
                className="h-24 w-24 rounded-full ring-4 ring-canvas"
                alt={`Avatar for ${source.name}`}
                src={faviconUrl}
              />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-accent text-3xl font-bold text-on-accent ring-4 ring-canvas">
                {source.name?.charAt(0).toUpperCase() || "?"}
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1 sm:pb-1.5">
            <h1 className="mb-0 font-display text-2xl font-extrabold tracking-tight text-fg">
              {source.name}
            </h1>
            <p className="mt-0.5 font-mono text-sm text-faint">@{sourceSlug}</p>
            {source.description && (
              <p className="mt-2 text-muted">{source.description}</p>
            )}
            {source.websiteUrl && (
              <Link
                href={source.websiteUrl}
                className="mt-2 flex flex-row items-center text-accent-soft transition-colors hover:text-accent"
                target="_blank"
                rel="noopener noreferrer"
              >
                <LinkIcon className="mr-2 h-5 text-faint" />
                <span>{getDomainFromUrl(source.websiteUrl)}</span>
              </Link>
            )}
          </div>
        </div>

        {/* Articles header - matching user profile */}
        <div className="mx-auto mt-8 sm:max-w-2xl lg:max-w-5xl">
          <Heading level={1}>{`Articles (${source.articleCount})`}</Heading>
        </div>

        {/* Articles list using UnifiedContentCard */}
        <div>
          {articlesStatus === "pending" ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="animate-pulse rounded-lg border border-hairline p-3"
                >
                  <div className="mb-2 h-4 w-1/4 rounded bg-inset" />
                  <div className="mb-2 h-5 w-3/4 rounded bg-inset" />
                  <div className="h-4 w-1/2 rounded bg-inset" />
                </div>
              ))}
            </div>
          ) : articles.length === 0 ? (
            <p className="py-4 font-medium text-muted">
              Nothing published yet... 🥲
            </p>
          ) : (
            <>
              {articles.map((article) => {
                // Use slug for SEO-friendly URLs, fallback to shortId for legacy articles
                const articleSlug = article.slug || article.shortId;

                return (
                  <UnifiedContentCard
                    key={article.id}
                    type="LINK"
                    id={article.id}
                    title={article.title}
                    excerpt={article.excerpt}
                    slug={articleSlug}
                    imageUrl={article.imageUrl}
                    externalUrl={article.url}
                    publishedAt={article.publishedAt}
                    upvotes={article.upvotes}
                    downvotes={article.downvotes}
                    userVote={article.userVote}
                    isBookmarked={article.isBookmarked}
                    discussionCount={0}
                    source={{
                      name: source.name,
                      slug: sourceSlug,
                      logo: source.logoUrl,
                      websiteUrl: source.websiteUrl,
                    }}
                    linkAuthor={article.author}
                  />
                );
              })}

              {/* Load more trigger */}
              <div ref={loadMoreRef} className="py-4 text-center">
                {isFetchingNextPage && (
                  <div className="text-sm text-muted">
                    Loading more articles...
                  </div>
                )}
                {!hasNextPage && articles.length > 0 && (
                  <div className="text-sm text-muted">No more articles</div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default SourceProfileContent;
