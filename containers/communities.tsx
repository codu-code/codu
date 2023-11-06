import { Children, Fragment, useEffect, useState } from "react";
import { trpc } from "../utils/trpc";
import { useInView } from "react-intersection-observer";
import ArticleLoading from "@/components/ArticlePreview/ArticleLoading";
import CommunityPreview from "@/components/CommunityPreview/CommunityPreview";

export default function CommunitiesList() {
  const [searchQuery, setSearchQuery] = useState("");

  const { status, data, isFetchingNextPage, fetchNextPage, hasNextPage } =
    trpc.community.all.useInfiniteQuery(
      { limit: 15, filter: searchQuery },
      {
        getNextPageParam: (lastPage) => lastPage.nextCursor,
      },
    );

  const { ref, inView } = useInView();

  useEffect(() => {
    if (inView && hasNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, fetchNextPage]);

  const handleInputChange = (q: string) => {
    setSearchQuery(q);
  };

  return (
    <div className="mx-auto lg:max-w-5xl sm:max-w-2xl">
      <div>
        <section>
          <div className="bg-neutral-900 text-neutral-700 shadow-xl">
            <div className="border border-neutral-900 py-6 px-4 sm:p-6 lg:pb-8 ">
              <div>
                <label htmlFor="username">Search</label>
                <div className="mt-1 shadow-sm flex">
                  <input
                    type="text"
                    onChange={(e) => {
                      handleInputChange(e.target.value);
                    }}
                    value={searchQuery}
                  />
                </div>
              </div>
            </div>
          </div>
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
                  {page.communities.map((community) => (
                    <CommunityPreview
                      key={community.id}
                      id={community.id}
                      slug={community.slug}
                      name={community.name}
                      excerpt={community.excerpt}
                      image={community.coverImage}
                      city={community.city}
                      country={community.country}
                      membersCount={community.members.length}
                    />
                  ))}
                </Fragment>
              );
            })}
          {status === "success" && !data.pages[0].communities.length && (
            <h2 className="text-lg mt-8">No results founds</h2>
          )}
          {isFetchingNextPage ? <ArticleLoading /> : null}
          <span className="invisible" ref={ref}>
            intersection observer marker
          </span>
        </section>
      </div>
    </div>
  );
}
