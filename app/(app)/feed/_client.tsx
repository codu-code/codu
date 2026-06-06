"use client";

import { Fragment, useEffect } from "react";
import { useInView } from "react-intersection-observer";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/server/trpc/react";
import { useSession } from "next-auth/react";
import {
  FeedItemLoading,
  FeedFilters,
  PopularTagsSidebar,
} from "@/components/Feed";
import { UnifiedContentCard } from "@/components/UnifiedContentCard";
import { SavedItemCard } from "@/components/SavedItemCard";
import { NewsletterCapture } from "@/components/ds";

type SortOption = "recent" | "trending" | "popular";
type ContentType =
  | "ARTICLE"
  | "LINK"
  | "QUESTION"
  | "VIDEO"
  | "DISCUSSION"
  | null;

const validSorts: SortOption[] = ["recent", "trending", "popular"];
// Lowercase type values for URL params (converted to uppercase for API)
const validTypesLower: string[] = [
  "article",
  "link",
  "question",
  "video",
  "discussion",
];

const FeedPage = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session } = useSession();

  // Get filter params from URL
  const sortParam = searchParams?.get("sort");
  const categoryParam = searchParams?.get("category");
  const tagParam = searchParams?.get("tag");
  const typeParam = searchParams?.get("type")?.toLowerCase();

  // Validate sort param
  const sort: SortOption = validSorts.includes(sortParam as SortOption)
    ? (sortParam as SortOption)
    : "recent";

  const category = typeof categoryParam === "string" ? categoryParam : null;
  const tag = typeof tagParam === "string" ? tagParam : null;

  // Validate type param (URL uses lowercase, API uses uppercase)
  const type: ContentType = validTypesLower.includes(typeParam || "")
    ? (typeParam?.toUpperCase() as ContentType)
    : null;

  // Fetch feed data with infinite scroll using the unified content API
  const { status, data, isFetchingNextPage, fetchNextPage, hasNextPage } =
    api.content.getFeed.useInfiniteQuery(
      {
        limit: 25,
        sort,
        type,
        category,
      },
      {
        getNextPageParam: (lastPage) => lastPage.nextCursor,
      },
    );

  // Fetch categories for filter dropdown
  const { data: categoriesData } = api.content.getCategories.useQuery();

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
    if (type) params.set("type", type);
    const queryString = params.toString();
    router.push(`/feed${queryString ? `?${queryString}` : ""}`);
  };

  const handleTypeChange = (newType: ContentType) => {
    const params = new URLSearchParams();
    if (sort !== "recent") params.set("sort", sort);
    if (category) params.set("category", category);
    if (tag) params.set("tag", tag);
    // Use lowercase in URL params for cleaner URLs
    if (newType) params.set("type", newType.toLowerCase());
    const queryString = params.toString();
    router.push(`/feed${queryString ? `?${queryString}` : ""}`);
  };

  const handleTagChange = (newTag: string | null) => {
    const params = new URLSearchParams();
    if (sort !== "recent") params.set("sort", sort);
    if (category) params.set("category", category);
    if (newTag) params.set("tag", newTag);
    if (type) params.set("type", type.toLowerCase());
    const queryString = params.toString();
    router.push(`/feed${queryString ? `?${queryString}` : ""}`);
  };

  return (
    <div className="mx-2">
      {/* Header */}
      <div className="mt-2 flex max-w-5xl items-center justify-between sm:mx-auto sm:mt-6 sm:max-w-2xl lg:max-w-5xl">
        <h1 className="hidden text-2xl font-bold tracking-tight text-neutral-800 dark:text-neutral-50 sm:block">
          Feed
        </h1>
        <span />
        <FeedFilters
          sort={sort}
          type={type}
          category={category}
          categories={categoriesData || []}
          onSortChange={handleSortChange}
          onTypeChange={handleTypeChange}
          onCategoryChange={handleCategoryChange}
          showTypeFilter={true}
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
                  {page.items.map((item) => (
                    <UnifiedContentCard
                      key={item.id}
                      type={item.type as "POST" | "LINK"}
                      id={item.id}
                      title={item.title}
                      excerpt={item.excerpt}
                      slug={item.slug}
                      imageUrl={item.imageUrl || item.ogImageUrl}
                      externalUrl={item.externalUrl}
                      publishedAt={item.publishedAt}
                      readTimeMins={item.readTimeMins}
                      upvotes={item.upvotes}
                      downvotes={item.downvotes}
                      userVote={item.userVote}
                      isBookmarked={item.isBookmarked}
                      author={
                        item.userId && item.authorName && !item.sourceId
                          ? {
                              name: item.authorName,
                              username: item.authorUsername || "",
                              image: item.authorImage,
                            }
                          : null
                      }
                      source={
                        item.sourceId && item.sourceName
                          ? {
                              name: item.sourceName,
                              slug: item.sourceSlug,
                              logo: item.sourceLogo,
                              websiteUrl: item.sourceWebsite,
                            }
                          : null
                      }
                      linkAuthor={item.sourceAuthor}
                    />
                  ))}
                </Fragment>
              ))}

            {status === "success" && !data.pages[0].items.length && (
              <div className="mt-8 rounded-lg border border-neutral-200 bg-neutral-50 p-8 text-center dark:border-neutral-700 dark:bg-neutral-800">
                <h2 className="text-lg font-medium text-neutral-900 dark:text-neutral-100">
                  No content yet
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
          <div className="sticky top-20">
            {/* About section - aligned with first feed item */}
            <div className="mt-2 rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-800">
              <h3 className="mb-2 font-semibold text-neutral-900 dark:text-neutral-100">
                About the Feed
              </h3>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                Curated developer content from across the web. Upvote articles
                you find helpful, save them for later, and discover trending
                topics in the developer community.
              </p>
            </div>

            {/* Newsletter CTA */}
            <div className="mt-6">
              <NewsletterCapture variant="compact" />
            </div>

            {/* Popular Tags section */}
            <div className="mt-6">
              <PopularTagsSidebar
                selectedTag={tag}
                onTagClick={handleTagChange}
              />
            </div>

            {/* Categories section (RSS source categories) */}
            {categoriesData && categoriesData.length > 0 && (
              <div className="mt-6">
                <h3 className="mb-4 text-lg font-semibold leading-6 tracking-wide">
                  Sources
                </h3>
                <div className="flex flex-wrap gap-2">
                  {categoriesData.map((cat) => (
                    <button
                      key={cat}
                      onClick={() =>
                        handleCategoryChange(category === cat ? null : cat)
                      }
                      className={`rounded border px-3 py-1.5 text-sm capitalize transition-colors ${
                        category === cat
                          ? "border-accent bg-accent/10 text-accent dark:border-accent dark:bg-accent/15 dark:text-accent"
                          : "border-neutral-300 bg-white text-neutral-700 hover:border-neutral-400 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:border-neutral-500"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Saved articles for logged in users */}
            {session && (
              <div className="mt-6">
                <h3 className="mb-4 text-lg font-semibold leading-6 tracking-wide">
                  Your Saved Articles
                </h3>
                <SavedArticlesPreview />
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

// Component to show saved articles preview in sidebar
const SavedArticlesPreview = () => {
  const { data, status } = api.post.myBookmarks.useQuery({ limit: 5 });

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

  if (status === "error" || !data?.items?.length) {
    return (
      <p className="text-sm text-neutral-500 dark:text-neutral-400">
        No saved articles yet. Save articles to read them later!
      </p>
    );
  }

  // Map DB type to frontend type
  const toFrontendType = (dbType: string | null): "POST" | "LINK" => {
    if (dbType === "article") return "POST";
    return "LINK";
  };

  return (
    <div className="space-y-2">
      {data.items.slice(0, 3).map((item) => (
        <SavedItemCard
          key={item.id}
          id={item.id}
          title={item.title}
          slug={item.slug}
          publishedAt={item.publishedAt}
          sourceName={item.sourceName}
          sourceSlug={item.sourceSlug}
          authorName={item.authorName}
          authorUsername={item.authorUsername}
          authorImage={item.authorImage}
          type={toFrontendType(item.type)}
        />
      ))}
      {data.items.length > 3 && (
        <Link
          href="/saved"
          className="block text-center text-sm text-accent hover:text-accent dark:text-accent"
        >
          View all saved
        </Link>
      )}
    </div>
  );
};

export default FeedPage;
