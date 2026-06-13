"use client";

import { Fragment, useEffect } from "react";
import { useInView } from "react-intersection-observer";
import { useSearchParams, useRouter } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import { api } from "@/server/trpc/react";
import { FeedItemLoading } from "@/components/Feed";
import { FilterPill, type Option } from "@/components/Feed/Filters";
import { UnifiedContentCard } from "@/components/UnifiedContentCard";
import { useShellActions } from "@/components/Create/ShellActionsProvider";
import { type RouterOutputs } from "@/server/trpc/shared";

type View = "all" | "following";
type Sort = "recent" | "active" | "top";
type DiscussionFirstPage = RouterOutputs["discussion"]["list"];

const sortOptions: Option[] = [
  { value: "recent", label: "Recent" },
  { value: "active", label: "Active" },
  { value: "top", label: "Top" },
];

/**
 * Discussions — community threads (questions + discussions), same row style as
 * the feed. All / Following tabs (deep-linkable via ?view=) + a sort filter,
 * mirroring the feed's tab + FilterPill pattern.
 */
const DiscussionsPage = ({
  initialList,
}: {
  initialList?: DiscussionFirstPage | null;
}) => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session } = useSession();
  const { openCompose } = useShellActions();

  const view: View =
    searchParams?.get("view") === "following" ? "following" : "all";
  const sortParam = searchParams?.get("sort");
  const sort: Sort =
    sortParam === "active" || sortParam === "top" ? sortParam : "recent";

  // Build a ?view=&sort= query string, omitting defaults to keep URLs clean.
  const setParams = (next: { view?: View; sort?: Sort }) => {
    const params = new URLSearchParams();
    const nextView = next.view ?? view;
    const nextSort = next.sort ?? sort;
    if (nextView === "following") params.set("view", "following");
    if (nextSort !== "recent") params.set("sort", nextSort);
    const qs = params.toString();
    router.replace(qs ? `/discussions?${qs}` : "/discussions", {
      scroll: false,
    });
  };

  const { status, data, isFetchingNextPage, fetchNextPage, hasNextPage } =
    api.discussion.list.useInfiniteQuery(
      { limit: 25, view, sort },
      {
        getNextPageParam: (lastPage) => lastPage.nextCursor,
        // Following tab is meaningless signed-out — skip the query.
        enabled: view === "all" || !!session,
        // Server-fetched first page (same input) renders in crawlable HTML.
        ...(initialList
          ? { initialData: { pages: [initialList], pageParams: [null] } }
          : {}),
      },
    );

  const { ref, inView } = useInView();
  useEffect(() => {
    if (inView && hasNextPage) fetchNextPage();
  }, [inView, hasNextPage, fetchNextPage]);

  const empty =
    status === "success" && data.pages.every((p) => p.items.length === 0);

  const tabClass = (active: boolean) =>
    `whitespace-nowrap border-b-2 px-1 pb-2 text-sm font-semibold transition-colors ${
      active
        ? "border-accent text-fg"
        : "border-transparent text-muted hover:text-fg"
    }`;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">
            <span className="slash">{"// "}</span>community
          </p>
          <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-fg">
            Discussions
          </h1>
        </div>
        <button
          onClick={() => (session ? openCompose("discussion") : signIn())}
          className="primary-button"
        >
          Start a discussion
        </button>
      </div>
      <p className="mt-3 max-w-[60ch] leading-snug text-muted">
        Ask questions, swap patterns, and get unstuck. The place to learn out
        loud with other builders working with AI.
      </p>

      <div className="mt-6 flex items-center justify-between border-b border-hairline">
        <div className="flex items-center gap-5" role="tablist">
          <button
            role="tab"
            aria-selected={view === "all"}
            data-testid="discussions-tab-all"
            onClick={() => setParams({ view: "all" })}
            className={tabClass(view === "all")}
          >
            All
          </button>
          <button
            role="tab"
            aria-selected={view === "following"}
            data-testid="discussions-tab-following"
            onClick={() => {
              if (!session) return signIn();
              setParams({ view: "following" });
            }}
            className={tabClass(view === "following")}
          >
            Following
          </button>
        </div>
        <div className="pb-1">
          <FilterPill
            testId="discussions-sort"
            label="Sort discussions"
            value={sort}
            options={sortOptions}
            isDefault={sort === "recent"}
            align="right"
            onChange={(next) => setParams({ sort: next as Sort })}
          />
        </div>
      </div>

      <section className="mt-6 space-y-3">
        {status === "pending" &&
          Array.from({ length: 6 }, (_, i) => <FeedItemLoading key={i} />)}

        {status === "error" && (
          <div className="rounded-lg border border-hairline bg-surface p-4 text-danger">
            Something went wrong loading discussions. Please refresh.
          </div>
        )}

        {status === "success" &&
          data.pages.map((page, i) => (
            <Fragment key={i}>
              {page.items.map((item) => (
                <UnifiedContentCard
                  key={item.id}
                  type={item.type as "POST" | "LINK"}
                  kind={item.type}
                  id={item.id}
                  title={item.title}
                  excerpt={item.excerpt}
                  slug={item.slug}
                  urlId={item.urlId}
                  imageUrl={item.imageUrl || item.ogImageUrl}
                  publishedAt={item.publishedAt}
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
                />
              ))}
            </Fragment>
          ))}

        {empty && view === "following" && (
          <div className="rounded-lg border border-dashed border-hairline p-12 text-center font-mono text-sm text-faint">
            {"// "}you&apos;re not following any discussions yet — open a thread
            and hit Follow
          </div>
        )}

        {empty && view === "all" && (
          <div className="rounded-lg border border-dashed border-hairline p-12 text-center font-mono text-sm text-faint">
            {"// "}nothing here yet —{" "}
            {session?.user ? "start one" : "sign in to start one"}
          </div>
        )}

        {isFetchingNextPage && <FeedItemLoading />}
        <span className="invisible" ref={ref}>
          marker
        </span>
      </section>
    </div>
  );
};

export default DiscussionsPage;
