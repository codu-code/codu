import { Children, Fragment, useEffect } from "react";
import Head from "next/head";
import { TagIcon } from "@heroicons/react/outline";
import ArticlePreview from "../../components/ArticlePreview/ArticlePreview";
import ArticleLoading from "../../components/ArticlePreview/ArticleLoading";
import Layout from "../../components/Layout/Layout";
import { trpc } from "../../utils/trpc";
import { useInView } from "react-intersection-observer";
import { useRouter } from "next/router";

const ArticlesPage = () => {
  const router = useRouter();

  const { filter, tag: dirtyTag } = router.query;
  const tag = typeof dirtyTag === "string" ? dirtyTag.toLowerCase() : null;

  type Filter = "newest" | "oldest" | "top";
  const filters: Filter[] = ["newest", "oldest", "top"];

  const getSortBy = () => {
    if (typeof filter === "string") {
      const hasFilter = filters.some((f) => f === filter);
      if (hasFilter) return filter as Filter;
    }
    return "newest";
  };

  const selectedSortFilter = getSortBy();

  const { status, data, isFetchingNextPage, fetchNextPage, hasNextPage } =
    trpc.post.all.useInfiniteQuery(
      { limit: 15, sort: selectedSortFilter, tag },
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

  // @TODO make a list of words like "JavaScript" that we can map the words to if they exist
  const capitalize = (str: string) =>
    str.replace(/(?:^|\s|["'([{])+\S/g, (match) => match.toUpperCase());

  return (
    <>
      <Head>
        <title>{`Codú - View our ${selectedSortFilter} web developer articles`}</title>
        <meta name="description" content="Codú | Web Developer Community" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="manifest" href="site.webmanifest" />
        <link rel="mask-icon" href="safari-pinned-tab.svg" color="#000000" />
        <link rel="shortcut icon" href="favicon.ico" />
        <meta name="msapplication-TileColor" content="#000000" />
        <meta name="msapplication-config" content="browserconfig.xml" />
        <meta name="theme-color" content="#000" />
        <link rel="alternate" type="application/rss+xml" href="/feed.xml" />
        <meta
          property="og:image"
          content="https://codu.co/images/og/home-og.png"
          key="og:image"
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://codu.co/articles" />
      </Head>
      <Layout>
        <div className="border-t border-white">
          <div className="relative sm:mx-auto max-w-2xl mx-2">
            <div className="my-8 border-b-2 pb-4 flex justify-between items-center">
              <h1 className="text-3xl tracking-tight font-extrabold text-neutral-50 sm:text-4xl ">
                {typeof tag === "string" ? (
                  <div className="flex justify-center items-center">
                    <TagIcon className="text-neutral-200 h-6 w-6 mr-3" />
                    {capitalize(tag)}
                  </div>
                ) : (
                  "Articles"
                )}
              </h1>
              <div>
                <label htmlFor="filter" className="sr-only">
                  Location
                </label>
                <select
                  id="filter"
                  name="filter"
                  className="capitalize mt-2 block w-full rounded-md border-0 py-1.5 pl-3 pr-10  ring-1 ring-inset ring-neutral-300 focus:ring-2 focus:ring-pink-600 sm:text-sm sm:leading-6 "
                  onChange={(e) => {
                    router.push(
                      `/articles?filter=${e.target.value}${
                        tag ? `&tag=${tag}` : ""
                      }`
                    );
                  }}
                  value={selectedSortFilter}
                >
                  <option>newest</option>
                  <option>oldest</option>
                  <option>top</option>
                </select>
              </div>
            </div>
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
              {status === "success" && !data.pages[0].posts.length && (
                <h2 className="text-lg">No results founds</h2>
              )}
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
