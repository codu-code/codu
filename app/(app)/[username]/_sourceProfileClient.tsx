"use client";

import Link from "next/link";
import { LinkIcon } from "@heroicons/react/20/solid";
import { api } from "@/server/trpc/react";
import { Temporal } from "@js-temporal/polyfill";
import { useInView } from "react-intersection-observer";
import { useEffect, useState } from "react";
import { Heading } from "@/components/ui-components/heading";

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
  const [sort, setSort] = useState<"recent" | "trending" | "popular">("recent");
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
    { sourceSlug, sort, limit: 25 },
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
        <main className="pt-6 sm:flex">
          <div className="mr-4 flex-shrink-0 self-center">
            <div className="mb-2 h-20 w-20 animate-pulse rounded-full bg-neutral-200 dark:bg-neutral-700 sm:mb-0 sm:h-24 sm:w-24 lg:h-32 lg:w-32" />
          </div>
          <div className="flex flex-col justify-center">
            <div className="mb-2 h-6 w-48 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
            <div className="h-4 w-32 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
          </div>
        </main>
      </div>
    );
  }

  if (sourceStatus === "error" || !source) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8 text-black dark:text-white">
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center dark:border-red-800 dark:bg-red-950">
          <h1 className="text-lg font-semibold text-red-700 dark:text-red-300">
            Source Not Found
          </h1>
          <p className="mt-2 text-sm text-red-600 dark:text-red-400">
            This source may have been removed or the link is invalid.
          </p>
          <Link
            href="/feed"
            className="mt-4 inline-block text-sm text-blue-500 hover:underline"
          >
            Back to Feed
          </Link>
        </div>
      </div>
    );
  }

  const faviconUrl = getFaviconUrl(source.websiteUrl);
  const articles = articlesData?.pages.flatMap((page) => page.articles) ?? [];
  const totalScore = source.totalUpvotes - source.totalDownvotes;

  return (
    <>
      <div className="mx-auto max-w-2xl px-4 text-black dark:text-white">
        {/* Profile header - matching user profile pattern */}
        <main className="pt-6 sm:flex">
          <div className="mr-4 flex-shrink-0 self-center">
            {source.logoUrl ? (
              <img
                className="mb-2 h-20 w-20 rounded-full object-cover sm:mb-0 sm:h-24 sm:w-24 lg:h-32 lg:w-32"
                alt={`Logo for ${source.name}`}
                src={source.logoUrl}
              />
            ) : faviconUrl ? (
              <img
                className="mb-2 h-20 w-20 rounded-full sm:mb-0 sm:h-24 sm:w-24 lg:h-32 lg:w-32"
                alt={`Favicon for ${source.name}`}
                src={faviconUrl}
              />
            ) : (
              <div className="mb-2 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-orange-600 text-3xl font-bold text-white sm:mb-0 sm:h-24 sm:w-24 lg:h-32 lg:w-32 lg:text-4xl">
                {source.name?.charAt(0).toUpperCase() || "?"}
              </div>
            )}
          </div>
          <div className="flex flex-col justify-center">
            <h1 className="mb-0 text-lg font-bold md:text-xl">{source.name}</h1>
            {source.category && (
              <h2 className="text-sm font-bold text-neutral-500 dark:text-neutral-400">
                {source.category}
              </h2>
            )}
            <p className="mt-1">{source.description || "No description available."}</p>
            {source.websiteUrl && (
              <Link
                href={source.websiteUrl}
                className="flex flex-row items-center"
                target="_blank"
                rel="noopener noreferrer"
              >
                <LinkIcon className="mr-2 h-5 text-neutral-500 dark:text-neutral-400" />
                <p className="mt-1 text-blue-500">
                  {getDomainFromUrl(source.websiteUrl)}
                </p>
              </Link>
            )}
            {/* Stats inline with header */}
            <div className="mt-2 flex gap-4 text-sm text-neutral-500 dark:text-neutral-400">
              <span>
                <strong className="text-neutral-900 dark:text-neutral-100">
                  {source.articleCount}
                </strong>{" "}
                articles
              </span>
              <span>
                <strong
                  className={
                    totalScore > 0
                      ? "text-green-500"
                      : totalScore < 0
                        ? "text-red-500"
                        : "text-neutral-900 dark:text-neutral-100"
                  }
                >
                  {totalScore >= 0 ? "+" : ""}
                  {totalScore}
                </strong>{" "}
                karma
              </span>
            </div>
          </div>
        </main>

        {/* Sort tabs + Articles header */}
        <div className="mx-auto mt-4 sm:max-w-2xl lg:max-w-5xl">
          <div className="flex items-center justify-between">
            <Heading level={1}>{`Articles (${source.articleCount})`}</Heading>
            <div className="flex gap-1">
              {(["recent", "trending", "popular"] as const).map((sortOption) => (
                <button
                  key={sortOption}
                  onClick={() => setSort(sortOption)}
                  className={`rounded-full px-3 py-1 text-xs font-medium capitalize transition-colors ${
                    sort === sortOption
                      ? "bg-orange-500 text-white"
                      : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700"
                  }`}
                >
                  {sortOption}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Articles list */}
        <div className="mt-4">
          {articlesStatus === "pending" ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="animate-pulse border-b border-neutral-100 pb-4 dark:border-neutral-800"
                >
                  <div className="mb-2 h-5 w-3/4 rounded bg-neutral-200 dark:bg-neutral-700" />
                  <div className="h-4 w-1/2 rounded bg-neutral-200 dark:bg-neutral-700" />
                </div>
              ))}
            </div>
          ) : articles.length === 0 ? (
            <p className="py-4 font-medium">Nothing published yet... 🥲</p>
          ) : (
            <>
              {articles.map((article) => {
                const dateTime = article.publishedAt
                  ? Temporal.Instant.from(
                      new Date(article.publishedAt).toISOString(),
                    )
                  : null;
                const readableDate = dateTime
                  ? dateTime.toLocaleString(["en-IE"], {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })
                  : null;

                // Use slug for SEO-friendly URLs, fallback to shortId for legacy articles
                const articlePath = article.slug
                  ? `/${sourceSlug}/${article.slug}`
                  : `/${sourceSlug}/${article.shortId}`;

                return (
                  <article
                    key={article.id}
                    className="border-b border-neutral-100 py-4 dark:border-neutral-800"
                  >
                    <Link
                      href={articlePath}
                      className="group"
                    >
                      <h2 className="font-semibold text-neutral-900 group-hover:underline dark:text-neutral-100">
                        {article.title}
                      </h2>
                    </Link>
                    {article.excerpt && (
                      <p className="mt-1 line-clamp-2 text-sm text-neutral-600 dark:text-neutral-400">
                        {article.excerpt}
                      </p>
                    )}
                    <div className="mt-2 flex items-center gap-3 text-xs text-neutral-500 dark:text-neutral-400">
                      {readableDate && <span>{readableDate}</span>}
                      {article.author && article.author.trim() && !["by", "by,", "by ,"].includes(article.author.trim().toLowerCase()) && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span>{article.author.replace(/^by\s+/i, "").trim()}</span>
                        </>
                      )}
                      <span aria-hidden="true">·</span>
                      <span
                        className={
                          article.score > 0
                            ? "text-green-500"
                            : article.score < 0
                              ? "text-red-500"
                              : ""
                        }
                      >
                        {article.score} points
                      </span>
                    </div>
                  </article>
                );
              })}

              {/* Load more trigger */}
              <div ref={loadMoreRef} className="py-4 text-center">
                {isFetchingNextPage && (
                  <div className="text-sm text-neutral-500 dark:text-neutral-400">
                    Loading more articles...
                  </div>
                )}
                {!hasNextPage && articles.length > 0 && (
                  <div className="text-sm text-neutral-500 dark:text-neutral-400">
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

export default SourceProfileContent;
