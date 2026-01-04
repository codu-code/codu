"use client";

import { Fragment, useEffect } from "react";
import { useInView } from "react-intersection-observer";
import { useSearchParams, useRouter } from "next/navigation";
import { api } from "@/server/trpc/react";
import { useSession } from "next-auth/react";
import {
  FeedItemAggregated,
  FeedItemLoading,
  FeedFilters,
} from "@/components/Feed";

type SortOption = "recent" | "trending" | "popular";
const validSorts: SortOption[] = ["recent", "trending", "popular"];

const FeedPage = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session } = useSession();

  // Get filter params from URL
  const sortParam = searchParams?.get("sort");
  const categoryParam = searchParams?.get("category");

  // Validate sort param
  const sort: SortOption = validSorts.includes(sortParam as SortOption)
    ? (sortParam as SortOption)
    : "recent";

  const category = typeof categoryParam === "string" ? categoryParam : null;

  // Fetch feed data with infinite scroll
  const { status, data, isFetchingNextPage, fetchNextPage, hasNextPage } =
    api.feed.getFeed.useInfiniteQuery(
      {
        limit: 20,
        sort,
        category,
        includeCommunity: false,
      },
      {
        getNextPageParam: (lastPage) => lastPage.nextCursor,
      },
    );

  // Fetch categories for filter dropdown
  const { data: categoriesData } = api.feed.getCategories.useQuery();

  // Intersection observer for infinite scroll
  const { ref, inView } = useInView();

  useEffect(() => {
    if (inView && hasNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, fetchNextPage]);

  // Handle filter changes
  const handleSortChange = (newSort: SortOption) => {
    const params = new URLSearchParams();
    if (newSort !== "recent") params.set("sort", newSort);
    if (category) params.set("category", category);
    const queryString = params.toString();
    router.push(`/feed${queryString ? `?${queryString}` : ""}`);
  };

  const handleCategoryChange = (newCategory: string | null) => {
    const params = new URLSearchParams();
    if (sort !== "recent") params.set("sort", sort);
    if (newCategory) params.set("category", newCategory);
    const queryString = params.toString();
    router.push(`/feed${queryString ? `?${queryString}` : ""}`);
  };

  return (
    <div className="mx-2">
      {/* Header */}
      <div className="mt-8 flex max-w-5xl items-center justify-between border-b border-b-neutral-300 pb-2 dark:border-b-neutral-600 sm:mx-auto sm:max-w-2xl lg:max-w-5xl">
        <h1 className="text-3xl font-bold tracking-tight text-neutral-800 dark:text-neutral-50 sm:text-4xl">
          Feed
        </h1>
        <FeedFilters
          sort={sort}
          category={category}
          categories={categoriesData || []}
          onSortChange={handleSortChange}
          onCategoryChange={handleCategoryChange}
        />
      </div>

      {/* Main content grid */}
      <div className="mx-auto grid-cols-12 gap-6 sm:max-w-2xl lg:grid lg:max-w-5xl">
        {/* Feed items */}
        <div className="relative md:col-span-7">
          <section>
            {status === "error" && (
              <div className="mt-8 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
                Something went wrong loading the feed. Please refresh the page.
              </div>
            )}

            {status === "pending" &&
              Array.from({ length: 7 }, (_, i) => <FeedItemLoading key={i} />)}

            {status === "success" &&
              data.pages.map((page, pageIndex) => (
                <Fragment key={pageIndex}>
                  {page.articles.map((article) => (
                    <FeedItemAggregated
                      key={article.id}
                      id={article.id}
                      shortId={article.shortId}
                      title={article.title}
                      excerpt={article.excerpt}
                      url={article.url}
                      imageUrl={article.imageUrl}
                      publishedAt={article.publishedAt}
                      upvotes={article.upvotes}
                      downvotes={article.downvotes}
                      sourceName={article.sourceName}
                      sourceSlug={article.sourceSlug}
                      sourceLogo={article.sourceLogo}
                      sourceWebsite={article.sourceWebsite}
                      author={article.author}
                      userVote={article.userVote}
                      isBookmarked={article.isBookmarked}
                    />
                  ))}
                </Fragment>
              ))}

            {status === "success" && !data.pages[0].articles.length && (
              <div className="mt-8 rounded-lg border border-neutral-200 bg-neutral-50 p-8 text-center dark:border-neutral-700 dark:bg-neutral-800">
                <h2 className="text-lg font-medium text-neutral-900 dark:text-neutral-100">
                  No articles yet
                </h2>
                <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
                  Check back soon for curated developer content.
                </p>
              </div>
            )}

            {isFetchingNextPage && <FeedItemLoading />}

            <span className="invisible" ref={ref}>
              intersection observer marker
            </span>
          </section>
        </div>

        {/* Sidebar */}
        <section className="col-span-5 hidden lg:block">
          {/* About section - moved above topics */}
          <div className="mt-4 rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-800">
            <h3 className="mb-2 font-semibold text-neutral-900 dark:text-neutral-100">
              About the Feed
            </h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Curated developer content from across the web. Upvote articles you
              find helpful, save them for later, and discover trending topics in
              the developer community.
            </p>
          </div>

          {/* Categories section */}
          <div className="mt-6">
            <h3 className="mb-4 text-2xl font-semibold leading-6 tracking-wide">
              Topics
            </h3>
            <div className="flex flex-wrap gap-2">
              {categoriesData?.map((cat) => (
                <button
                  key={cat}
                  onClick={() =>
                    handleCategoryChange(category === cat ? null : cat)
                  }
                  className={`rounded border px-4 py-2 text-sm capitalize transition-colors ${
                    category === cat
                      ? "border-orange-500 bg-orange-50 text-orange-700 dark:border-orange-400 dark:bg-orange-950 dark:text-orange-300"
                      : "border-neutral-300 bg-white text-neutral-700 hover:border-neutral-400 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:border-neutral-500"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Saved articles for logged in users */}
          {session && (
            <div className="mt-6">
              <h3 className="mb-4 text-lg font-semibold leading-6 tracking-wide">
                Your Saved Articles
              </h3>
              <SavedArticlesPreview />
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

// Component to show saved articles preview in sidebar
const SavedArticlesPreview = () => {
  const { data, status } = api.feed.mySavedArticles.useQuery();

  if (status === "pending") {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-16 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700"
          />
        ))}
      </div>
    );
  }

  if (status === "error" || !data?.length) {
    return (
      <p className="text-sm text-neutral-500 dark:text-neutral-400">
        No saved articles yet. Save articles to read them later!
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {data.slice(0, 3).map((article) => (
        <a
          key={article.id}
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block rounded-lg border border-neutral-200 bg-white p-3 transition-colors hover:border-neutral-300 dark:border-neutral-700 dark:bg-neutral-800 dark:hover:border-neutral-600"
        >
          <h4 className="line-clamp-2 text-sm font-medium text-neutral-900 dark:text-neutral-100">
            {article.title}
          </h4>
          <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
            {article.sourceName}
          </p>
        </a>
      ))}
      {data.length > 3 && (
        <a
          href="/saved"
          className="block text-center text-sm text-orange-600 hover:text-orange-500 dark:text-orange-400"
        >
          View all saved ({data.length})
        </a>
      )}
    </div>
  );
};

export default FeedPage;
