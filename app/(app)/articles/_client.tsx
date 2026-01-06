"use client";

import { Fragment, useEffect, useState } from "react";
import { TagIcon } from "@heroicons/react/20/solid";
import {
  ChevronUpIcon,
  ChevronDownIcon,
  BookmarkIcon,
  ChatBubbleLeftIcon,
  ShareIcon,
  EllipsisHorizontalIcon,
} from "@heroicons/react/20/solid";
import { BookmarkIcon as BookmarkOutlineIcon } from "@heroicons/react/24/outline";
import {
  Menu,
  MenuButton,
  MenuItem,
  MenuItems,
  Transition,
} from "@headlessui/react";
import { useInView } from "react-intersection-observer";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/server/trpc/react";
import SideBarSavedPosts from "@/components/SideBar/SideBarSavedPosts";
import { useSession, signIn } from "next-auth/react";
import { getCamelCaseFromLower } from "@/utils/utils";
import PopularTagsLoading from "@/components/PopularTags/PopularTagsLoading";
import CoduChallenge from "@/components/CoduChallenge/CoduChallenge";
import { toast } from "sonner";
import * as Sentry from "@sentry/nextjs";
import { FeedFilters } from "@/components/Feed";
import { useReportModal } from "@/components/ReportModal/ReportModal";

// Get relative time string
const getRelativeTime = (dateStr: string): string => {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

// Article card component with voting
type ArticleCardProps = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  name: string;
  username: string;
  image: string;
  date: string;
  readTime: number;
  upvotes: number;
  downvotes: number;
  userVote: "up" | "down" | null;
  isBookmarked: boolean;
  discussionCount?: number;
};

const ArticleCard = ({
  id,
  slug,
  title,
  excerpt,
  name,
  username,
  image,
  date,
  readTime,
  upvotes,
  downvotes,
  userVote: initialUserVote,
  isBookmarked: initialBookmarked,
  discussionCount = 0,
}: ArticleCardProps) => {
  const { data: session } = useSession();
  const utils = api.useUtils();
  const [userVote, setUserVote] = useState(initialUserVote);
  const [votes, setVotes] = useState({ upvotes, downvotes });
  const [isBookmarked, setIsBookmarked] = useState(initialBookmarked);
  const { openReport } = useReportModal();

  const { mutate: vote, status: voteStatus } = api.post.vote.useMutation({
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
    onError: (error) => {
      setUserVote(initialUserVote);
      setVotes({ upvotes, downvotes });
      toast.error("Failed to update vote");
      Sentry.captureException(error);
    },
    onSettled: () => {
      utils.post.published.invalidate();
    },
  });

  const { mutate: bookmark, status: bookmarkStatus } =
    api.post.bookmark.useMutation({
      onMutate: async ({ setBookmarked }) => {
        setIsBookmarked(setBookmarked);
      },
      onError: (error) => {
        setIsBookmarked(initialBookmarked);
        toast.error("Failed to update bookmark");
        Sentry.captureException(error);
      },
      onSettled: () => {
        utils.post.myBookmarks.invalidate();
      },
    });

  const handleVote = (voteType: "up" | "down" | null) => {
    if (!session) {
      signIn();
      return;
    }
    vote({ postId: id, voteType });
  };

  const handleBookmark = () => {
    if (!session) {
      signIn();
      return;
    }
    bookmark({ postId: id, setBookmarked: !isBookmarked });
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/${username}/${slug}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Link copied to clipboard");
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const handleReport = () => {
    if (!session) {
      signIn();
      return;
    }
    openReport("post", id);
  };

  const relativeTime = getRelativeTime(date);
  const score = votes.upvotes - votes.downvotes;

  return (
    <article className="group my-2 rounded-lg border border-neutral-200 bg-white p-3 transition-colors hover:border-neutral-300 dark:border-neutral-700 dark:bg-neutral-900 dark:hover:border-neutral-600">
      {/* Header row - author and metadata */}
      <div className="mb-1.5 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-neutral-500 dark:text-neutral-400">
        <Link
          href={`/${username}`}
          className="flex items-center gap-1.5 hover:text-neutral-700 dark:hover:text-neutral-200"
        >
          <img
            src={image}
            alt=""
            className="h-5 w-5 rounded-full object-cover"
          />
          <span className="font-medium">{name}</span>
        </Link>
        <span aria-hidden="true">·</span>
        <time title={date}>{relativeTime}</time>
        {readTime > 0 && (
          <>
            <span aria-hidden="true">·</span>
            <span>{readTime} min read</span>
          </>
        )}
      </div>

      {/* Title */}
      <h2 className="mb-1">
        <Link
          href={`/${username}/${slug}`}
          className="text-lg font-semibold leading-snug text-neutral-900 hover:underline dark:text-neutral-100 sm:text-xl"
        >
          {title}
        </Link>
      </h2>

      {/* Excerpt */}
      {excerpt && (
        <p className="mb-3 line-clamp-2 text-sm text-neutral-600 dark:text-neutral-400">
          {excerpt}
        </p>
      )}

      {/* Action bar */}
      <div className="flex items-center gap-1.5">
        {/* Vote buttons */}
        <div className="flex items-center rounded-full border border-neutral-200 dark:border-neutral-700">
          <button
            onClick={() => handleVote(userVote === "up" ? null : "up")}
            disabled={voteStatus === "pending"}
            className={`rounded-l-full p-1 transition-colors hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-neutral-800 ${
              userVote === "up"
                ? "text-green-500"
                : "text-neutral-400 dark:text-neutral-500"
            }`}
            aria-label="Upvote"
          >
            <ChevronUpIcon className="h-4 w-4" />
          </button>
          <span
            className={`min-w-[1.5rem] text-center text-xs font-semibold ${
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
            className={`rounded-r-full p-1 transition-colors hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-neutral-800 ${
              userVote === "down"
                ? "text-red-500"
                : "text-neutral-400 dark:text-neutral-500"
            }`}
            aria-label="Downvote"
          >
            <ChevronDownIcon className="h-4 w-4" />
          </button>
        </div>

        {/* Comments button */}
        <Link
          href={`/${username}/${slug}#comments`}
          className="flex items-center gap-1 rounded-full border border-neutral-200 px-2 py-1 text-xs font-medium text-neutral-500 transition-colors hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800"
        >
          <ChatBubbleLeftIcon className="h-3.5 w-3.5" />
          <span>{discussionCount}</span>
        </Link>

        {/* Save button */}
        <button
          onClick={handleBookmark}
          disabled={bookmarkStatus === "pending"}
          className={`flex items-center gap-1 rounded-full border px-2 py-1 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
            isBookmarked
              ? "border-blue-300 text-blue-600 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-400 dark:hover:bg-blue-900/30"
              : "border-neutral-200 text-neutral-500 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800"
          }`}
        >
          {isBookmarked ? (
            <BookmarkIcon className="h-3.5 w-3.5" />
          ) : (
            <BookmarkOutlineIcon className="h-3.5 w-3.5" />
          )}
          <span className="hidden sm:inline">
            {isBookmarked ? "Saved" : "Save"}
          </span>
        </button>

        {/* Share button */}
        <button
          onClick={handleShare}
          className="flex items-center gap-1 rounded-full border border-neutral-200 px-2 py-1 text-xs font-medium text-neutral-500 transition-colors hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800"
        >
          <ShareIcon className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Share</span>
        </button>

        {/* Triple-dot menu */}
        <Menu as="div" className="relative">
          <MenuButton className="rounded-full p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 dark:text-neutral-500 dark:hover:bg-neutral-800 dark:hover:text-neutral-300">
            <span className="sr-only">More options</span>
            <EllipsisHorizontalIcon className="h-4 w-4" />
          </MenuButton>
          <Transition
            as={Fragment}
            enter="transition ease-out duration-100"
            enterFrom="transform opacity-0 scale-95"
            enterTo="transform opacity-100 scale-100"
            leave="transition ease-in duration-75"
            leaveFrom="transform opacity-100 scale-100"
            leaveTo="transform opacity-0 scale-95"
          >
            <MenuItems className="absolute bottom-8 right-0 z-10 mt-2 w-40 origin-bottom-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none dark:bg-neutral-800 dark:ring-neutral-700">
              <MenuItem>
                <button
                  onClick={handleShare}
                  className="block w-full px-4 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-700"
                >
                  Copy link
                </button>
              </MenuItem>
              <MenuItem>
                <button
                  onClick={handleReport}
                  className="block w-full px-4 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-700"
                >
                  Report
                </button>
              </MenuItem>
            </MenuItems>
          </Transition>
        </Menu>
      </div>
    </article>
  );
};

// Loading skeleton
const ArticleCardLoading = () => (
  <article className="my-2 rounded-lg border border-neutral-200 bg-white p-3 dark:border-neutral-700 dark:bg-neutral-900">
    <div className="mb-1.5 flex items-center gap-1.5">
      <div className="h-5 w-5 animate-pulse rounded-full bg-neutral-200 dark:bg-neutral-700" />
      <div className="h-3 w-24 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
      <div className="h-3 w-12 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
    </div>
    <div className="mb-1 h-6 w-3/4 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
    <div className="mb-3 h-4 w-full animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
    <div className="flex items-center gap-1.5">
      <div className="h-6 w-20 animate-pulse rounded-full bg-neutral-200 dark:bg-neutral-700" />
      <div className="h-6 w-14 animate-pulse rounded-full bg-neutral-200 dark:bg-neutral-700" />
      <div className="h-6 w-14 animate-pulse rounded-full bg-neutral-200 dark:bg-neutral-700" />
    </div>
  </article>
);

// Sort option types - unified between feed and articles
type UISortOption = "recent" | "trending" | "popular";
type APISortOption = "newest" | "oldest" | "top" | "trending";

// Map UI sort to API sort
const sortUIToAPI: Record<UISortOption, APISortOption> = {
  recent: "newest",
  trending: "trending",
  popular: "top",
};

// Map API sort to UI sort (for URL params)
const sortAPIToUI: Record<APISortOption, UISortOption> = {
  newest: "recent",
  oldest: "recent", // fallback
  top: "popular",
  trending: "trending",
};

const validUISorts: UISortOption[] = ["recent", "trending", "popular"];

const ArticlesPage = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session } = useSession();
  const sortParam = searchParams?.get("sort");
  const dirtyTag = searchParams?.get("tag");

  const tag = typeof dirtyTag === "string" ? dirtyTag : null;

  // Get UI sort from URL param
  const uiSort: UISortOption = validUISorts.includes(sortParam as UISortOption)
    ? (sortParam as UISortOption)
    : "recent";

  // Convert to API sort for the query
  const apiSort = sortUIToAPI[uiSort];

  const { status, data, isFetchingNextPage, fetchNextPage, hasNextPage } =
    api.post.published.useInfiniteQuery(
      {
        limit: 15,
        sort: apiSort,
        tag,
      },
      {
        getNextPageParam: (lastPage) => lastPage.nextCursor,
      },
    );

  const { status: tagsStatus, data: tagsData } = api.tag.get.useQuery();

  const { ref, inView } = useInView();

  useEffect(() => {
    if (inView && hasNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, fetchNextPage]);

  // Handle filter changes
  const handleSortChange = (newSort: UISortOption) => {
    const params = new URLSearchParams();
    if (newSort !== "recent") params.set("sort", newSort);
    if (tag) params.set("tag", tag);
    const queryString = params.toString();
    router.push(`/articles${queryString ? `?${queryString}` : ""}`);
  };

  const handleTagChange = (newTag: string | null) => {
    const params = new URLSearchParams();
    if (uiSort !== "recent") params.set("sort", uiSort);
    if (newTag) params.set("tag", newTag);
    const queryString = params.toString();
    router.push(`/articles${queryString ? `?${queryString}` : ""}`);
  };

  // Get tags list for the filter dropdown
  const tagsList = tagsData?.data.map((t) => t.title.toLowerCase()) || [];

  return (
    <>
      <div className="mx-2">
        <div className="mt-8 flex max-w-5xl items-center justify-between border-b border-b-neutral-300 pb-2 dark:border-b-neutral-600 sm:mx-auto sm:max-w-2xl lg:max-w-5xl">
          <h1 className="text-3xl font-bold tracking-tight text-neutral-800 dark:text-neutral-50 sm:text-4xl">
            {typeof tag === "string" ? (
              <div className="flex items-center justify-center">
                <TagIcon className="mr-3 h-6 w-6 text-neutral-800 dark:text-neutral-200" />
                {getCamelCaseFromLower(tag)}
              </div>
            ) : (
              "Articles"
            )}
          </h1>
          <FeedFilters
            sort={uiSort}
            category={tag}
            categories={tagsList}
            onSortChange={handleSortChange}
            onCategoryChange={handleTagChange}
            showTypeFilter={false}
          />
        </div>
        <div className="mx-auto grid-cols-12 gap-6 sm:max-w-2xl lg:grid lg:max-w-5xl">
          <div className="relative md:col-span-7">
            <section>
              {status === "error" && (
                <div className="mt-8 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
                  Something went wrong... Please refresh your page.
                </div>
              )}
              {status === "pending" &&
                Array.from({ length: 7 }, (_, i) => (
                  <ArticleCardLoading key={i} />
                ))}
              {status === "success" &&
                data.pages.map((page) => {
                  return (
                    <Fragment key={page.nextCursor?.id ?? "lastPage"}>
                      {page.posts.map(
                        ({
                          slug,
                          title,
                          excerpt,
                          user,
                          published,
                          readTimeMins,
                          id,
                          currentUserBookmarkedPost,
                          upvotes,
                          downvotes,
                          userVote,
                        }) => {
                          if (!published) return null;
                          return (
                            <ArticleCard
                              key={id}
                              id={id}
                              slug={slug}
                              title={title}
                              excerpt={excerpt}
                              name={user?.name || ""}
                              username={user?.username || ""}
                              image={user?.image || ""}
                              date={published}
                              readTime={readTimeMins ?? 0}
                              upvotes={upvotes ?? 0}
                              downvotes={downvotes ?? 0}
                              userVote={userVote ?? null}
                              isBookmarked={currentUserBookmarkedPost}
                            />
                          );
                        },
                      )}
                    </Fragment>
                  );
                })}
              {status === "success" && !data.pages[0].posts.length && (
                <div className="mt-8 rounded-lg border border-neutral-200 bg-neutral-50 p-8 text-center dark:border-neutral-700 dark:bg-neutral-800">
                  <h2 className="text-lg font-medium text-neutral-900 dark:text-neutral-100">
                    No articles found
                  </h2>
                  <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
                    Check back later for new content.
                  </p>
                </div>
              )}
              {isFetchingNextPage && <ArticleCardLoading />}
              <span className="invisible" ref={ref}>
                intersection observer marker
              </span>
            </section>
          </div>
          <section className="col-span-5 hidden lg:block">
            <CoduChallenge />
            <h3 className="mb-4 mt-4 text-2xl font-semibold leading-6 tracking-wide">
              Popular topics
            </h3>
            <div className="flex flex-wrap gap-2">
              {tagsStatus === "pending" && <PopularTagsLoading />}
              {tagsStatus === "success" &&
                tagsData.data.map(({ title }) => (
                  <Link
                    key={title}
                    href={`/articles?tag=${title.toLowerCase()}`}
                    className="rounded border border-neutral-300 bg-white px-6 py-2 text-neutral-900 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-50"
                  >
                    {getCamelCaseFromLower(title)}
                  </Link>
                ))}
            </div>
            {session && (
              <div className="flex flex-wrap gap-2">
                <SideBarSavedPosts />
              </div>
            )}
          </section>
        </div>
      </div>
    </>
  );
};

export default ArticlesPage;
