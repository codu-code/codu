import { Children, Fragment, useEffect, useState } from "react";
import { trpc } from "../utils/trpc";
import { useInView } from "react-intersection-observer";
import ArticleLoading from "@/components/ArticlePreview/ArticleLoading";
import EventPreview from "@/components/EventPreview/EventPreview";

export default function EventsList() {
  const [searchQuery, setSearchQuery] = useState("");

  const { status, data, isFetchingNextPage, fetchNextPage, hasNextPage } =
    trpc.event.all.useInfiniteQuery(
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
    <div className="mx-auto sm:max-w-2xl lg:max-w-5xl">
      <div>
        <section>
          <div className="bg-neutral-900 text-neutral-700 shadow-xl">
            <div className="border border-neutral-900 px-4 py-6 sm:p-6 lg:pb-8 ">
              <div>
                <label htmlFor="search">Search</label>
                <div className="mt-1 flex shadow-sm">
                  <input
                    name="search"
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
                  {page.events.map((event) => (
                    <EventPreview
                      key={event.name}
                      id={event.id}
                      address={`${event.address}, ${event.community.city}, ${event.community.country}`}
                      eventSlug={event.slug}
                      communitySlug={event.community.slug}
                      name={event.name}
                      description={event.description}
                      eventDate={event.eventDate.toISOString()}
                      attendees={event.RSVP.length}
                      coverImage={event.coverImage}
                      commnunityName={event.community.name}
                    />
                  ))}
                </Fragment>
              );
            })}
          {status === "success" && !data.pages[0].events.length && (
            <h2 className="mt-8 text-lg">No results founds</h2>
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
