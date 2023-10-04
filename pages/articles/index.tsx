import { Children, Fragment, useEffect, useState } from "react";
import Head from "next/head";
import { TagIcon } from "@heroicons/react/outline";
import ArticlePreview from "../../components/ArticlePreview/ArticlePreview";
import ArticleLoading from "../../components/ArticlePreview/ArticleLoading";
import Layout from "../../components/Layout/Layout";
import { trpc } from "../../utils/trpc";
import { useInView } from "react-intersection-observer";
import { useRouter } from "next/router";
import Link from "next/link";
import Image from "next/image";
import challenge from "../../public/images/announcements/challenge.png";
import SearchBar from "../../components/ArticleSearch/SearchBar";

// Needs to be added to DB but testing with hardcoding
const tagsToShow = [
  "JavaScript",
  "Web Development",
  "Tutorial",
  "Productivity",
  "CSS",
  "Terminal",
  "Django",
  "Python",
  "Tips",
];

const ArticlesPage = () => {
  const router = useRouter();

  const { filter, tag: dirtyTag } = router.query;
  const tag = typeof dirtyTag === "string" ? dirtyTag.toLowerCase() : null;
  const [searchTerm, setSearchTerm] = useState("");
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
      { limit: 15, sort: selectedSortFilter, tag, searchTerm },
      {
        getNextPageParam: (lastPage) => lastPage.nextCursor,
      },
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
        <div className="mx-2">
          <div className="max-w-5xl sm:mx-auto mt-8 border-b pb-4 flex justify-between items-center lg:max-w-5xl sm:max-w-2xl">
            <h1 className="text-3xl tracking-tight font-extrabold text-neutral-900 dark:text-neutral-50 sm:text-4xl ">
              {typeof tag === "string" ? (
                <div className="flex justify-center items-center">
                  <TagIcon className="text-neutral-800 dark:text-neutral-200 h-6 w-6 mr-3" />
                  {capitalize(tag)}
                </div>
              ) : (
                "Articles"
              )}
            </h1>
            <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
            <div className="min-w-fit">
              <label htmlFor="filter" className="sr-only">
                Location
              </label>
              <select
                id="filter"
                name="filter"
                className="ring-neutral-900 ring-2 capitalize mt-2 block w-full rounded-md border-0 py-1.5 pl-3 pr-10 dark:ring-1 ring-inset dark:ring-neutral-300 focus:ring-2 focus:ring-pink-600 sm:text-sm sm:leading-6 "
                onChange={(e) => {
                  router.push(
                    `/articles?filter=${e.target.value}${
                      tag ? `&tag=${tag}` : ""
                    }`,
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
          <div className="lg:grid grid-cols-12 gap-8 mx-auto lg:max-w-5xl sm:max-w-2xl">
            <div className="relative md:col-span-8">
              <section>
                {status === "error" && (
                  <div className="mt-8">
                    Something went wrong... Please refresh your page.
                  </div>
                )}
                {status === "loading" &&
                  Children.toArray(
                    Array.from({ length: 7 }, () => {
                      return <ArticleLoading />;
                    }),
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
                          ),
                        )}
                      </Fragment>
                    );
                  })}
                {status === "success" && !data.pages[0].posts.length && (
                  <h2 className="text-lg mt-8">No results founds</h2>
                )}
                {isFetchingNextPage ? <ArticleLoading /> : null}
                <span className="invisible" ref={ref}>
                  intersection observer marker
                </span>
              </section>
            </div>
            <section className="col-span-4 lg:block hidden">
              <div className="text-neutral-50 mt-4 mb-8 border border-neutral-600 bg-neutral-900">
                <Link href="/articles/join-our-6-week-writing-challenge-quohtgqb">
                  <Image
                    className="w-full"
                    src={challenge}
                    alt={`"Codú Writing Challenge" text on white background`}
                  />
                </Link>
                <div className="tracking-wide text-sm my-3 break-words px-4 py-2">
                  <Link
                    className="block underline text-lg leading-6 font-semibold"
                    href="/articles/join-our-6-week-writing-challenge-quohtgqb"
                  >
                    Join the Codú writing challenge!
                  </Link>
                  <p className="my-3">
                    Join our first Codú challenge! Write 6 articles in 6 weeks
                    and earn a swag bag.
                  </p>
                  <p>Click the link to find out more.</p>
                </div>
              </div>
              <h3 className="text-2xl leading-6 font-semibold tracking-wide mb-4 mt-4">
                Recommended topics
              </h3>
              <div className="flex gap-2 flex-wrap">
                {tagsToShow.map((tag) => (
                  <Link
                    key={tag}
                    href={`/articles?tag=${tag.toLowerCase()}`}
                    className="bg-neutral-900 text-neutral-50 px-6 py-2 border border-neutral-600"
                  >
                    {tag}
                  </Link>
                ))}
              </div>
            </section>
          </div>
        </div>
      </Layout>
    </>
  );
};

export default ArticlesPage;
