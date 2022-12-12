import { Children, Fragment, useEffect } from "react";

import Head from "next/head";
import ArticlePreview from "../../components/ArticlePreview/ArticlePreview";
import ArticleLoading from "../../components/ArticlePreview/ArticleLoading";
import Layout from "../../components/Layout/Layout";
import PageHeading from "../../components/PageHeading/PageHeading";
import { trpc } from "../../utils/trpc";
import { useInView } from "react-intersection-observer";

const ArticlesPage = () => {
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
        <title>Codú | Articles - View our latest web developer articles</title>
        <meta name="description" content="Codú | Web Developer Community" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Layout>
        <div className="border-t border-white">
          <div className="relative sm:mx-auto max-w-2xl mx-4">
            <PageHeading>Articles</PageHeading>
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
                          <ArticlePreview
                            key={title}
                            id={id}
                            slug={slug}
                            title={title}
                            excerpt={excerpt}
                            name={name}
                            username={username || ""}
                            image={image}
                            date={updatedAt.toISOString()}
                            readTime={readTimeMins}
                            bookmarkedInitialState={currentUserLikesPost}
                          />
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

export default ArticlesPage;
