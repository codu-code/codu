"use client";

import { Children, Fragment, useEffect } from "react";
import { TagIcon } from "@heroicons/react/20/solid";
import ArticlePreview from "@/components/ArticlePreview/ArticlePreview";
import ArticleLoading from "@/components/ArticlePreview/ArticleLoading";
import { useInView } from "react-intersection-observer";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import challenge from "@/public/images/announcements/challenge.png";
import { api } from "@/server/trpc/react";
import SideBarSavedPosts from "@/components/SideBar/SideBarSavedPosts";
import { useSession } from "next-auth/react";
import { getCamelCaseFromLower } from "@/utils/utils";
import PopularTagsLoading from "@/components/PopularTags/PopularTagsLoading";

const ArticlesPage = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session } = useSession();
  const filter = searchParams?.get("filter");
  const dirtyTag = searchParams?.get("tag");

  const tag = typeof dirtyTag === "string" ? dirtyTag : null;
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
    api.post.published.useInfiniteQuery(
      {
        limit: 15,
        sort: selectedSortFilter,
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
  }, [inView]);

  return (
    <>
      <div className="mx-2">
        <div className="mt-8 flex max-w-5xl items-center justify-between border-b border-b-neutral-300 pb-2 dark:border-b-neutral-600 sm:mx-auto sm:max-w-2xl lg:max-w-5xl">
          <h1 className="text-3xl font-bold tracking-tight text-neutral-800 dark:text-neutral-50 sm:text-4xl ">
            {typeof tag === "string" ? (
              <div className="flex items-center justify-center">
                <TagIcon className="mr-3 h-6 w-6 text-neutral-800 dark:text-neutral-200" />
                {getCamelCaseFromLower(tag)}
              </div>
            ) : (
              "Articles"
            )}
          </h1>
          <div className="min-w-fit">
            <label htmlFor="filter" className="sr-only">
              Location
            </label>
            <select
              id="filter"
              name="filter"
              className="mt-2 block w-full rounded border-neutral-300 py-1 pl-3 pr-10 text-sm leading-6 focus:ring-2 focus:ring-pink-600 dark:border-neutral-600 dark:bg-neutral-800"
              onChange={(e) => {
                router.push(
                  `/articles?filter=${e.target.value}${
                    tag ? `&tag=${tag}` : ""
                  }`,
                );
              }}
              value={selectedSortFilter}
            >
              {filters.map((filter) => (
                <option key={filter} value={filter}>
                  {getCamelCaseFromLower(filter)}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="mx-auto grid-cols-12 gap-8 sm:max-w-2xl lg:grid lg:max-w-5xl">
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
                        }) => {
                          // TODO: Bump posts that were recently updated to the top and show that they were updated recently
                          if (!published) return null;
                          return (
                            <ArticlePreview
                              key={id}
                              id={id}
                              slug={slug}
                              title={title}
                              excerpt={excerpt}
                              name={user?.name || ""}
                              username={user?.username || ""}
                              image={user?.image || ""}
                              date={published}
                              readTime={readTimeMins}
                              bookmarkedInitialState={currentUserBookmarkedPost}
                            />
                          );
                        },
                      )}
                    </Fragment>
                  );
                })}
              {status === "success" && !data.pages[0].posts.length && (
                <h2 className="mt-8 text-lg">No results founds</h2>
              )}
              {isFetchingNextPage ? <ArticleLoading /> : null}
              <span className="invisible" ref={ref}>
                intersection observer marker
              </span>
            </section>
          </div>
          <section className="col-span-4 hidden lg:block">
            <div className="mb-8 mt-2 border border-neutral-300 bg-white text-neutral-900 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-50">
              <Link href="/articles/join-our-6-week-writing-challenge-quohtgqb">
                <Image
                  className="w-full"
                  src={challenge}
                  alt={`"Codú Writing Challenge" text on white background`}
                />
              </Link>
              <div className="my-3 break-words px-4 py-2 text-sm tracking-wide">
                <Link
                  className="block text-lg font-semibold leading-6 underline"
                  href="/articles/join-our-6-week-writing-challenge-quohtgqb"
                >
                  Join the Codú writing challenge!
                </Link>
                <p className="my-3">
                  Join our first Codú challenge! Write 6 articles in 6 weeks and
                  earn a swag bag.
                </p>
                <p>Click the link to find out more.</p>
              </div>
            </div>
            <h3 className="mb-4 mt-4 text-2xl font-semibold leading-6 tracking-wide">
              Popular topics
            </h3>
            <div className="flex flex-wrap gap-2">
              {tagsStatus === "loading" && <PopularTagsLoading />}
              {tagsStatus === "success" &&
                tagsData.data.map(({ title }) => (
                  <Link
                    key={title}
                    // only reason this is toLowerCase is to make url look nicer. Not needed for functionality
                    href={`/articles?tag=${title.toLowerCase()}`}
                    className="border border-neutral-300 bg-white px-6 py-2 text-neutral-900 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-50"
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
