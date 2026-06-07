"use client";

import { Fragment, useEffect } from "react";
import { useInView } from "react-intersection-observer";
import { useSearchParams, useRouter } from "next/navigation";
import { api } from "@/server/trpc/react";
import { useSession } from "next-auth/react";
import {
  FeedItemLoading,
  FeedFilters,
  Composer,
  OnboardingBanner,
} from "@/components/Feed";
import { UnifiedContentCard } from "@/components/UnifiedContentCard";

type SortOption = "recent" | "trending" | "popular";
type ContentType =
  | "ARTICLE"
  | "LINK"
  | "TIL"
  | "QUESTION"
  | "VIDEO"
  | "DISCUSSION"
  | null;

const validSorts: SortOption[] = ["recent", "trending", "popular"];
// Lowercase type values for URL params (converted to uppercase for API)
const validTypesLower: string[] = [
  "article",
  "link",
  "til",
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

  // "Following" view (signed-in only)
  const following = !!session?.user && searchParams?.get("view") === "following";

  // Fetch feed data with infinite scroll using the unified content API
  const { status, data, isFetchingNextPage, fetchNextPage, hasNextPage } =
    api.content.getFeed.useInfiniteQuery(
      {
        limit: 25,
        sort,
        type,
        category,
        tag,
        following,
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

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold tracking-tight text-fg">Feed</h1>
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

      {/* Onboarding + low-bar composer (signed-in) */}
      {session?.user && (
        <div className="mt-4 space-y-4">
          <OnboardingBanner />
          <Composer session={session} />
        </div>
      )}

      {/* For you / Following tabs (signed-in) */}
      {session?.user && (
        <div className="mt-4 flex gap-5 border-b border-hairline">
          {[
            { label: "For you", href: "/feed", active: !following },
            {
              label: "Following",
              href: "/feed?view=following",
              active: following,
            },
          ].map((t) => (
            <button
              key={t.label}
              type="button"
              onClick={() => router.push(t.href)}
              className={`-mb-px border-b-2 px-1 pb-2 text-sm font-semibold transition-colors ${
                t.active
                  ? "border-accent text-fg"
                  : "border-transparent text-muted hover:text-fg"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

      {/* Feed list (rails now live in the global app shell) */}
      <div>
        <div className="relative">
          <section className="space-y-3">
            {following &&
              status === "success" &&
              data.pages.every((p) => p.items.length === 0) && (
                <div className="mt-4 rounded-xl border border-dashed border-hairline p-10 text-center">
                  <p className="font-medium text-fg">
                    Your Following feed is empty.
                  </p>
                  <p className="mt-1 text-sm text-muted">
                    Follow builders and sources to see their posts here.
                  </p>
                </div>
              )}

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
                      kind={item.type}
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
      </div>
    </div>
  );
};

export default FeedPage;
