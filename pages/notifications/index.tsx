import { Children, Fragment, useEffect } from "react";

import Head from "next/head";
import ArticleLoading from "../../components/ArticlePreview/ArticleLoading";
import Layout from "../../components/Layout/Layout";
import PageHeading from "../../components/PageHeading/PageHeading";
import { trpc } from "../../utils/trpc";
import { useInView } from "react-intersection-observer";
import { CheckIcon } from "@heroicons/react/solid";
import Link from "next/link";

const Notifications = () => {
  const { status, data, isFetchingNextPage, fetchNextPage, hasNextPage } =
    trpc.post.all.useInfiniteQuery(
      { limit: 15 },
      {
        getNextPageParam: (lastPage) => lastPage.nextCursor,
      }
    );

  const { ref, inView } = useInView();

  useEffect(() => {
    if (inView && hasNextPage) {
      fetchNextPage();
    }
  }, [inView]);

  return (
    <>
      <Head>
        <title>Notfications (213)</title>
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
        <div className="border-t border-white">
          <div className="relative sm:mx-auto max-w-2xl mx-4">
            <PageHeading>Notifications</PageHeading>
            <section>
              {status === "error" && (
                <div>Something went wrong... Please refresh your page.</div>
              )}
              {status === "loading" &&
                Children.toArray(
                  Array.from({ length: 7 }, () => {
                    return <ArticleLoading />;
                  })
                )}
              {status === "success" &&
                data.pages.map((page) => {
                  return (
                    <Fragment key={page.nextCursor ?? "lastPage"}>
                      {page.posts.map(
                        ({
                          slug,
                          title,
                          excerpt,
                          user: { name, image, username },
                          updatedAt,
                          readTimeMins,
                          id,
                          currentUserLikesPost,
                        }) => (
                          <div key={title} className="">
                            <div className="p-4 my-4 border-white border-2 bg-smoke border-l-8 shadow-xl flex justify-between">
                              <div>
                                <p className="mb-2">
                                  New comment on your post from KJASDN kjdnas.
                                  kjasdhfg hjksad gfkjhadsg kfjg asdkj gfkjhadsg
                                  kf gasdj fjk
                                </p>
                                <Link
                                  className="fancy-link"
                                  href={`articles/${slug}`}
                                >
                                  Go to post
                                </Link>
                              </div>
                              <div className="w-10 border-l border-slate-700 ml-2 pl-3 flex flex-col justify-center">
                                <button
                                  title="Mark as read"
                                  className="text-white rounded-full h-8 w-8 flex justify-center items-center hover:bg-slate-700"
                                >
                                  <CheckIcon
                                    className="h-6 w-6"
                                    aria-hidden="true"
                                  />
                                </button>
                              </div>
                            </div>
                          </div>
                        )
                      )}
                    </Fragment>
                  );
                })}
              {isFetchingNextPage ? <ArticleLoading /> : null}
              <span className="invisible" ref={ref}>
                intersection observer marker
              </span>
            </section>
          </div>
        </div>
      </Layout>
    </>
  );
};

export default Notifications;
