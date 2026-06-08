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

const SourceProfilePage = ({ sourceSlug }: Props) => {
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
      <div className="mx-auto max-w-2xl px-4 text-fg">
        <div className="pt-6 sm:flex">
          <div className="mr-4 flex-shrink-0 self-center">
            <div className="mb-2 h-20 w-20 animate-pulse rounded-full bg-inset sm:mb-0 sm:h-24 sm:w-24 lg:h-32 lg:w-32" />
          </div>
          <div className="flex flex-col justify-center">
            <div className="mb-2 h-6 w-48 animate-pulse rounded bg-inset" />
            <div className="h-4 w-32 animate-pulse rounded bg-inset" />
          </div>
        </div>
      </div>
    );
  }

  if (sourceStatus === "error" || !source) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8 text-fg">
        <div className="rounded-lg border border-danger/30 bg-danger/12 p-6 text-center">
          <h1 className="text-lg font-semibold text-danger">
            Source Not Found
          </h1>
          <p className="mt-2 text-sm text-danger">
            This source may have been removed or the link is invalid.
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

  const faviconUrl = getFaviconUrl(source.websiteUrl);
  const articles = articlesData?.pages.flatMap((page) => page.articles) ?? [];

  return (
    <>
      <div className="mx-auto max-w-2xl px-4 text-fg">
        {/* Profile header - matching user profile pattern exactly */}
        <div className="pt-6 sm:flex">
          <div className="mr-4 flex-shrink-0 self-center">
            {source.logoUrl ? (
              <img
                className="mb-2 h-20 w-20 rounded-full object-cover sm:mb-0 sm:h-24 sm:w-24 lg:h-32 lg:w-32"
                alt={`Avatar for ${source.name}`}
                src={source.logoUrl}
              />
            ) : faviconUrl ? (
              <img
                className="mb-2 h-20 w-20 rounded-full sm:mb-0 sm:h-24 sm:w-24 lg:h-32 lg:w-32"
                alt={`Avatar for ${source.name}`}
                src={faviconUrl}
              />
            ) : (
              <div className="mb-2 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-accent to-accent text-3xl font-bold text-on-accent sm:mb-0 sm:h-24 sm:w-24 lg:h-32 lg:w-32 lg:text-4xl">
                {source.name?.charAt(0).toUpperCase() || "?"}
              </div>
            )}
          </div>
          <div className="flex flex-col justify-center">
            <h1 className="mb-0 font-display text-lg font-extrabold tracking-tight text-fg md:text-xl">
              {source.name}
            </h1>
            <h2 className="text-sm font-bold text-muted">@{sourceSlug}</h2>
            <p className="mt-1">{source.description || ""}</p>
            {source.websiteUrl && (
              <Link
                href={source.websiteUrl}
                className="flex flex-row items-center"
                target="_blank"
                rel="noopener noreferrer"
              >
                <LinkIcon className="mr-2 h-5 text-muted" />
                <p className="mt-1 text-accent-soft hover:text-accent">
                  {getDomainFromUrl(source.websiteUrl)}
                </p>
              </Link>
            )}
          </div>
        </div>

        {/* Articles header - matching user profile */}
        <div className="mx-auto mt-4 sm:max-w-2xl lg:max-w-5xl">
          <Heading level={1}>{`Articles (${source.articleCount})`}</Heading>
        </div>

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
            <p className="py-4 font-medium">Nothing published yet... 🥲</p>
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

              <div ref={loadMoreRef} className="py-4 text-center">
                {isFetchingNextPage && (
                  <div className="text-sm text-muted">
                    Loading more articles...
                  </div>
                )}
                {!hasNextPage && articles.length > 0 && (
                  <div className="text-sm text-muted">
                    No more articles
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default SourceProfilePage;
