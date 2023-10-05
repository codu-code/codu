import { Children, Fragment, useEffect } from "react";
import { useInView } from "react-intersection-observer";
import { CheckIcon } from "@heroicons/react/solid";
import { Temporal } from "@js-temporal/polyfill";
import Link from "next/link";
import {
  NEW_COMMENT_ON_YOUR_POST,
  NEW_REPLY_TO_YOUR_COMMENT,
} from "../../utils/notifications";
import Head from "next/head";
import Layout from "../../components/Layout/Layout";
import PageHeading from "../../components/PageHeading/PageHeading";
import { trpc } from "../../utils/trpc";
import { authOptions } from "../../app/api/auth/authOptions";
import { getServerSession } from "next-auth";
import type { GetServerSideProps } from "next/types";

const Notifications = () => {
  const {
    status,
    data,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
    refetch,
  } = trpc.notification.get.useInfiniteQuery(
    { limit: 20 },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    },
  );

  const { data: count, refetch: refetchCount } =
    trpc.notification.getCount.useQuery();

  const { mutate } = trpc.notification.delete.useMutation({
    onSuccess: () => {
      refetch();
      refetchCount();
    },
  });

  const { mutate: deleteAll } = trpc.notification.deleteAll.useMutation({
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
    <div className="border-neutral-100 dark:border-white border shadow p-4 w-full my-4 bg-neutral-100 dark:bg-black">
      <div className="animate-pulse">
        <div className="flex space-x-4">
          <div className="rounded-full bg-gray-300 dark:bg-neutral-800 h-10 w-10"></div>
          <div className="flex-1 space-y-2 py-1">
            <div className="grid grid-cols-8 gap-4">
              <div className="h-4 bg-gray-300 dark:bg-neutral-800 rounded col-span-6"></div>
              <div className="h-2 bg-gray-300 dark:bg-neutral-800 rounded col-span-3"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <Head>
        <title>{`Notfications ${count ? `(${count})` : ""}`}</title>
        <meta name="description" content="Your notifications" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="manifest" href="site.webmanifest" />
        <link rel="mask-icon" href="safari-pinned-tab.svg" color="#000000" />
        <link rel="shortcut icon" href="favicon.ico" />
        <meta name="msapplication-TileColor" content="#000000" />
        <meta name="msapplication-config" content="browserconfig.xml" />
        <meta name="theme-color" content="#000" />
        <link rel="alternate" type="application/rss+xml" href="/feed.xml" />
      </Head>
      <Layout>
        <div className="relative sm:mx-auto max-w-2xl mx-4">
          <div className="relative mb-4">
            <PageHeading>Notifications</PageHeading>
            {!!count && count > 0 && (
              <button
                onClick={() => deleteAll()}
                className="absolute top-0 right-0 secondary-button text-sm py-2 px-1"
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
              <p className="text-neutral-900 dark:text-neutral-50 text-lg font-semibold">
                No new notifications. ✅{" "}
              </p>
            )}

            {status === "success" &&
              data.pages.map((page) => {
                return (
                  <Fragment key={page.nextCursor ?? "lastPage"}>
                    {page.data.map(
                      ({ id, createdAt, type, post, notifier }) => {
                        if (!post || !notifier) return null;

                        const dateTime = Temporal.Instant.from(
                          createdAt.toISOString(),
                        );
                        const isCurrentYear =
                          new Date().getFullYear() === createdAt.getFullYear();

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
                            <div className="p-4 my-2 border-neutral-100 dark:border-white border bg-neutral-100 dark:bg-black shadow-xl flex justify-between">
                              <div>
                                <div className="flex gap-3 sm:gap-5">
                                  {image && (
                                    <Link
                                      className="underline font-semibold flex flex-shrink-0"
                                      href={`/${username}`}
                                    >
                                      <img
                                        className="h-10 mb-2 rounded-full"
                                        src={image}
                                        alt={`${name}'s avatar`}
                                      />
                                    </Link>
                                  )}
                                  <div>
                                    <p className="mb-1">
                                      <Link
                                        className="underline font-semibold"
                                        href={`/${username}`}
                                      >
                                        {name}
                                      </Link>{" "}
                                      {type === NEW_COMMENT_ON_YOUR_POST &&
                                        "started a discussion on your post "}
                                      {type === NEW_REPLY_TO_YOUR_COMMENT &&
                                        "replied to your comment on "}
                                      <Link
                                        className="underline font-semibold"
                                        href={`articles/${post.slug}`}
                                      >
                                        {post.title}
                                      </Link>
                                      .
                                    </p>
                                    <time className="text-neutral-500 text-sm">
                                      {readableDate}
                                    </time>
                                  </div>
                                </div>
                              </div>
                              <div className="w-10 border-l border-slate-700 ml-2 pl-3 flex flex-col justify-center">
                                <button
                                  title="Mark as read"
                                  className="dark:text-white rounded-full h-8 w-8 flex justify-center items-center hover:bg-gray-300 dark:hover:bg-slate-700"
                                  onClick={() => mutate({ id })}
                                >
                                  <CheckIcon
                                    className="h-6 w-6"
                                    aria-hidden="true"
                                  />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      },
                    )}
                  </Fragment>
                );
              })}
            {isFetchingNextPage ? <Placeholder /> : null}
            <span className="invisible" ref={ref}>
              intersection observer marker
            </span>
          </section>
        </div>
      </Layout>
    </>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getServerSession(context.req, context.res, authOptions);

  if (!session) {
    return {
      redirect: {
        destination: "/get-started",
        permanent: false,
      },
    };
  }

  return {
    props: {},
  };
};

export default Notifications;
