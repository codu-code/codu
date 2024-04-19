"use client";

import { Children, Fragment, useEffect } from "react";
import { useInView } from "react-intersection-observer";
import { CheckCircleIcon } from "@heroicons/react/20/solid";
import { Temporal } from "@js-temporal/polyfill";
import Link from "next/link";
import {
  NEW_COMMENT_ON_YOUR_POST,
  NEW_REPLY_TO_YOUR_COMMENT,
} from "@/utils/notifications";
import PageHeading from "@/components/PageHeading/PageHeading";
import { api } from "@/server/trpc/react";

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
  }, [inView]);

  const noNotifications = !data?.pages[0].data.length;

  const Placeholder = () => (
    <div className="my-4 w-full border border-neutral-100 bg-neutral-100 p-4 shadow dark:border-white dark:bg-black">
      <div className="animate-pulse">
        <div className="flex space-x-4">
          <div className="h-10 w-10 rounded-full bg-gray-300 dark:bg-neutral-800"></div>
          <div className="flex-1 space-y-2 py-1">
            <div className="grid grid-cols-8 gap-4">
              <div className="col-span-6 h-4 rounded bg-gray-300 dark:bg-neutral-800"></div>
              <div className="col-span-3 h-2 rounded bg-gray-300 dark:bg-neutral-800"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div className="relative mx-4 max-w-2xl sm:mx-auto">
        <div className="relative mb-4">
          <PageHeading>Notifications</PageHeading>
          {!!count && count > 0 && (
            <button
              onClick={() => deleteAll()}
              className="secondary-button absolute right-0 top-0 px-1 py-2 text-sm"
            >
              Mark all as read
            </button>
          )}
        </div>

        <section>
          {status === "error" && (
            <div>Something went wrong... Please refresh your page.</div>
          )}
          {status === "loading" &&
            Children.toArray(
              Array.from({ length: 7 }, () => {
                return <Placeholder />;
              }),
            )}
          {status !== "loading" && noNotifications && (
            <p className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">
              No new notifications. ✅{" "}
            </p>
          )}

          {status === "success" &&
            data.pages.map((page) => {
              return (
                <Fragment key={page.nextCursor ?? "lastPage"}>
                  {page.data.map(({ id, createdAt, type, post, notifier }) => {
                    if (!post || !notifier) return null;

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
                      ].includes(type)
                    )
                      return null;
                    return (
                      <div key={id}>
                        <div className="my-2 flex justify-between border border-neutral-300 bg-white p-4 text-neutral-800 dark:border-white dark:bg-black dark:text-neutral-200">
                          <div>
                            <div className="flex gap-3 sm:gap-5">
                              <div>
                                {image && (
                                  <Link className="flex " href={`/${username}`}>
                                    <img
                                      className="h-10 w-10 rounded-full"
                                      src={image}
                                      alt={`${name}'s avatar`}
                                    />
                                  </Link>
                                )}
                              </div>
                              <div>
                                <p className="mb-1">
                                  <Link
                                    className="font-semibold underline"
                                    href={`/${username}`}
                                  >
                                    {name}
                                  </Link>{" "}
                                  {type === NEW_COMMENT_ON_YOUR_POST &&
                                    "started a discussion on your post:"}
                                  {type === NEW_REPLY_TO_YOUR_COMMENT &&
                                    "replied to your comment on:"}
                                </p>
                                <p>
                                  <Link
                                    className="text-lg font-semibold underline"
                                    href={`articles/${post.slug}`}
                                  >
                                    {post.title}
                                  </Link>
                                </p>
                                <time className="text-sm text-neutral-500">
                                  {readableDate}
                                </time>
                              </div>
                            </div>
                          </div>
                          <div className="ml-2 flex w-10 flex-col justify-center border-l border-neutral-300 pl-3 dark:border-neutral-700">
                            <button
                              title="Mark as read"
                              className="h-8 w-8 fill-neutral-600  hover:fill-neutral-500 dark:text-white"
                              onClick={() => mutate({ id })}
                            >
                              <CheckCircleIcon
                                className="h-full w-full fill-inherit"
                                aria-hidden="true"
                              />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </Fragment>
              );
            })}
          {isFetchingNextPage ? <Placeholder /> : null}
          <span className="invisible" ref={ref}>
            intersection observer marker
          </span>
        </section>
      </div>
    </>
  );
};

export default Notifications;
