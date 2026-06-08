"use client";

import { Fragment, useEffect } from "react";
import { useInView } from "react-intersection-observer";
import { CheckCircleIcon } from "@heroicons/react/20/solid";
import { Temporal } from "@js-temporal/polyfill";
import Link from "next/link";
import {
  NEW_COMMENT_ON_YOUR_POST,
  NEW_REPLY_TO_YOUR_COMMENT,
  NEW_FOLLOWER,
  POST_APPROVED,
  NEW_COMMENT_ON_FOLLOWED_POST,
} from "@/utils/notifications";
import { api } from "@/server/trpc/react";

// Moved outside to avoid "cannot create components during render" error
const Placeholder = () => (
  <div className="flex items-start gap-3 px-5 py-4">
    <div className="animate-pulse">
      <div className="h-9 w-9 rounded-full bg-elevated"></div>
    </div>
    <div className="flex-1 animate-pulse space-y-2 py-1">
      <div className="h-3 w-3/4 rounded bg-elevated"></div>
      <div className="h-2 w-1/3 rounded bg-elevated"></div>
    </div>
  </div>
);

const Notifications = () => {
  const {
    status,
    data,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
    refetch,
  } = api.notification.get.useInfiniteQuery(
    { limit: 20 },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    },
  );

  const { data: count, refetch: refetchCount } =
    api.notification.getCount.useQuery();

  const { mutate } = api.notification.delete.useMutation({
    onSuccess: () => {
      refetch();
      refetchCount();
    },
  });

  const { mutate: deleteAll } = api.notification.deleteAll.useMutation({
    onSuccess: () => {
      refetch();
      refetchCount();
    },
  });

  const { ref, inView } = useInView();

  useEffect(() => {
    if (inView && hasNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, fetchNextPage]);

  const noNotifications = !data?.pages[0].data.length;

  return (
    <div className="relative mx-4 max-w-2xl sm:mx-auto">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">
            <span className="slash">{"// "}</span>
            {count && count > 0 ? `${count} new` : "all caught up"}
          </p>
          <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-fg">
            Notifications
          </h1>
        </div>
        {!!count && count > 0 && (
          <button
            onClick={() => deleteAll()}
            className="secondary-button text-sm"
          >
            Mark all as read
          </button>
        )}
      </div>

      <section className="mt-6">
        {status === "error" && (
          <div className="rounded-lg border border-hairline bg-surface p-4 text-danger">
            Something went wrong... Please refresh your page.
          </div>
        )}

        {status === "pending" && (
          <div className="divide-y divide-hairline overflow-hidden rounded-lg border border-hairline">
            {Array.from({ length: 7 }, (_, i) => (
              <Placeholder key={i} />
            ))}
          </div>
        )}

        {status !== "pending" && noNotifications && (
          <div className="rounded-lg border border-dashed border-hairline p-12 text-center font-mono text-sm text-faint">
            {"// "}no new notifications — you&apos;re all caught up
          </div>
        )}

        {status === "success" && !noNotifications && (
          <div className="divide-y divide-hairline overflow-hidden rounded-lg border border-hairline">
            {data.pages.map((page) => (
              <Fragment key={page.nextCursor ?? "lastPage"}>
                {page.data.map(({ id, createdAt, type, post, notifier }) => {
                  if (!notifier) return null;
                  const isFollow = type === NEW_FOLLOWER;
                  // Comment notifications need a post; follows don't.
                  if (!isFollow && !post) return null;

                  const dateTime = Temporal.Instant.from(
                    new Date(createdAt).toISOString(),
                  );
                  const isCurrentYear =
                    new Date().getFullYear() ===
                    new Date(createdAt).getFullYear();

                  const readableDate = dateTime.toLocaleString(
                    ["en-IE"],
                    isCurrentYear
                      ? {
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "numeric",
                        }
                      : {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        },
                  );
                  const { username, name, image } = notifier;
                  // Check that we handle the notifications
                  if (
                    ![
                      NEW_COMMENT_ON_YOUR_POST,
                      NEW_REPLY_TO_YOUR_COMMENT,
                      NEW_FOLLOWER,
                      POST_APPROVED,
                      NEW_COMMENT_ON_FOLLOWED_POST,
                    ].includes(type)
                  )
                    return null;

                  const action =
                    type === NEW_COMMENT_ON_YOUR_POST
                      ? "started a discussion on your post"
                      : type === NEW_REPLY_TO_YOUR_COMMENT
                        ? "replied to your comment"
                        : type === NEW_COMMENT_ON_FOLLOWED_POST
                          ? "commented on a discussion you follow"
                          : type === POST_APPROVED
                            ? "approved your post — it's now live"
                            : "started following you";

                  return (
                    <div
                      key={id}
                      className="flex items-start gap-3 bg-surface px-5 py-4 transition-colors"
                    >
                      {image ? (
                        <Link
                          className="flex shrink-0"
                          href={`/${username}`}
                        >
                          <img
                            className="h-9 w-9 rounded-full"
                            src={image}
                            alt={`${name}'s avatar`}
                          />
                        </Link>
                      ) : (
                        <div className="h-9 w-9 shrink-0 rounded-full bg-elevated" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-muted">
                          <Link
                            className="font-semibold text-fg hover:text-accent"
                            href={`/${username}`}
                          >
                            {name}
                          </Link>{" "}
                          {action}{" "}
                          <span className="font-mono text-xs text-faint">
                            · {readableDate}
                          </span>
                        </p>
                        {!isFollow && post && (
                          <Link
                            className="mt-1 block text-sm font-semibold text-fg hover:text-accent"
                            href={`articles/${post.slug}`}
                          >
                            {post.title}
                          </Link>
                        )}
                      </div>
                      <button
                        title="Mark as read"
                        className="shrink-0 text-faint transition-colors hover:text-accent"
                        onClick={() => mutate({ id })}
                      >
                        <CheckCircleIcon
                          className="h-6 w-6"
                          aria-hidden="true"
                        />
                      </button>
                    </div>
                  );
                })}
              </Fragment>
            ))}
            {isFetchingNextPage ? <Placeholder /> : null}
          </div>
        )}
        <span className="invisible" ref={ref}>
          intersection observer marker
        </span>
      </section>
    </div>
  );
};

export default Notifications;
