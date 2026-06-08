"use client";

import { Fragment, useEffect } from "react";
import { useInView } from "react-intersection-observer";
import { useSearchParams, useRouter } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import { api } from "@/server/trpc/react";
import { FeedItemLoading } from "@/components/Feed";
import { UnifiedContentCard } from "@/components/UnifiedContentCard";
import { useShellActions } from "@/components/Create/ShellActionsProvider";

/**
 * Discussions — community threads (questions + discussions), same row style as
 * the feed. Mirrors ui_kits/app/AppShell.jsx → Discussions.
 */
const DiscussionsPage = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session } = useSession();
  const { openCompose } = useShellActions();

  const tag = searchParams?.get("tag") || null;

  const { status, data, isFetchingNextPage, fetchNextPage, hasNextPage } =
    api.content.getFeed.useInfiniteQuery(
      { limit: 25, sort: "recent", kinds: ["DISCUSSION", "QUESTION"], tag },
      { getNextPageParam: (lastPage) => lastPage.nextCursor },
    );

  const { data: popularData } = api.tag.getPopular.useQuery({ limit: 6 });
  const topics = popularData?.data ?? [];

  const { ref, inView } = useInView();
  useEffect(() => {
    if (inView && hasNextPage) fetchNextPage();
  }, [inView, hasNextPage, fetchNextPage]);

  const empty =
    status === "success" && data.pages.every((p) => p.items.length === 0);

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

      {topics.length > 0 && (
        <div className="mt-5 flex flex-wrap gap-2">
          <button
            onClick={() => router.push("/discussions")}
            className={`whitespace-nowrap rounded-full px-3 py-1 font-mono text-xs transition-colors ${
              !tag
                ? "bg-accent text-on-accent"
                : "border border-hairline text-muted hover:text-fg"
            }`}
          >
            All
          </button>
          {topics.map((t) => {
            const on = tag === t.slug;
            return (
              <button
                key={t.slug}
                onClick={() => router.push(`/discussions?tag=${t.slug}`)}
                className={`whitespace-nowrap rounded-full px-3 py-1 font-mono text-xs transition-colors ${
                  on
                    ? "bg-accent text-on-accent"
                    : "border border-hairline text-muted hover:text-fg"
                }`}
              >
                {t.title}
              </button>
            );
          })}
        </div>
      )}

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

        {empty && (
          <div className="rounded-lg border border-dashed border-hairline p-12 text-center font-mono text-sm text-faint">
            {"// "}nothing here yet — {session?.user ? "start one" : "sign in to start one"}
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
