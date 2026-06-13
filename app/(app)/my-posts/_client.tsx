"use client";

import { useState, Fragment } from "react";
import {
  Transition,
  Menu,
  MenuButton,
  MenuItems,
  MenuItem,
} from "@headlessui/react";
import Link from "next/link";
import {
  ChevronDownIcon,
  PencilIcon,
  TrashIcon,
} from "@heroicons/react/20/solid";
import { useSearchParams } from "next/navigation";
import { api } from "@/server/trpc/react";
import { Tabs } from "@/components/Tabs";
import { PromptDialog } from "@/components/PromptService";
import { status, getPostStatus } from "@/utils/post";

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

const renderDate = (label: string, date: string | Date) => (
  <small>
    {label} {new Date(date).toLocaleDateString()} at{" "}
    {new Date(date).toLocaleTimeString(navigator.language, {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })}
  </small>
);

const MyPosts = ({ username }: { username: string | null }) => {
  const searchParams = useSearchParams();

  const tabFromParams = searchParams?.get("tab");

  const [selectedArticleToDelete, setSelectedArticleToDelete] =
    useState<string>();
  const drafts = api.content.myDrafts.useQuery({});
  const scheduled = api.content.myScheduled.useQuery({});
  const publishedContent = api.content.myPublished.useQuery({});

  const { mutate, status: deleteStatus } = api.content.delete.useMutation({
    onSuccess() {
      setSelectedArticleToDelete(undefined);
      drafts.refetch();
      publishedContent.refetch();
    },
  });

  const TAB_VALUES_ARRAY = ["drafts", "scheduled", "published"];
  const [DRAFTS, SCHEDULED, PUBLISHED] = TAB_VALUES_ARRAY;

  const selectedTab =
    tabFromParams && TAB_VALUES_ARRAY.includes(tabFromParams)
      ? tabFromParams
      : DRAFTS;

  const tabs = [
    {
      name: "Drafts",
      href: `?tab=${DRAFTS}`,
      value: DRAFTS,
      data: drafts.data,
      status: drafts.status,
      current: selectedTab === DRAFTS,
    },
    {
      name: "Scheduled",
      href: `?tab=${SCHEDULED}`,
      value: SCHEDULED,
      data: scheduled.data,
      status: scheduled.status,
      current: selectedTab === SCHEDULED,
    },
    {
      name: "Published",
      href: `?tab=${PUBLISHED}`,
      value: PUBLISHED,
      data: publishedContent.data,
      status: publishedContent.status,
      current: selectedTab === PUBLISHED,
    },
  ];

  const selectedTabData =
    tabs[TAB_VALUES_ARRAY.findIndex((t) => t === selectedTab)];

  return (
    <>
      {selectedArticleToDelete && (
        <PromptDialog
          confirm={() => {
            if (selectedArticleToDelete)
              mutate({ id: selectedArticleToDelete });
          }}
          cancel={() => setSelectedArticleToDelete(undefined)}
          title="Delete article"
          subTitle="Are you sure you want to delete this article?"
          content="All of the data will be permanently removed from our servers forever. This action cannot be undone."
          confirmText={deleteStatus === "pending" ? "Deleting..." : "Delete"}
          cancelText="Cancel"
        />
      )}
      <div className="relative mx-4 max-w-2xl bg-canvas sm:mx-auto">
        <div className="mb-4 mt-8">
          <Tabs tabs={tabs} />
        </div>
        <div>
          {selectedTabData.status === "pending" && (
            <p className="py-4 font-medium">Fetching your posts...</p>
          )}
          {selectedTabData.status === "error" && (
            <p className="py-4 font-medium">
              Something went wrong fetching your posts... Refresh the page.
            </p>
          )}

          {selectedTabData.status === "success" &&
            selectedTabData.data?.map((item) => {
              const { id, title, excerpt, slug, publishedAt, updatedAt } = item;
              // The drafts query also returns auto-moderation states the owner
              // should see (`in_review`, `rejected`). Other tabs don't include
              // `status`, so guard the access.
              const dbStatus =
                "status" in item
                  ? (item as { status: string }).status
                  : undefined;
              const postStatus = publishedAt
                ? getPostStatus(new Date(publishedAt))
                : status.DRAFT;
              return (
                <article
                  className="mb-4 border border-hairline bg-surface p-4"
                  key={id}
                >
                  {selectedTab === PUBLISHED && username ? (
                    <Link href={`/${username}/${slug}`}>
                      <h2 className="mb-2 text-2xl font-semibold hover:underline">
                        {title}
                      </h2>
                    </Link>
                  ) : (
                    <h2 className="mb-2 flex flex-wrap items-center gap-2 text-2xl font-semibold">
                      {title}
                      {dbStatus === "in_review" && (
                        <span className="bg-warning/12 rounded-full px-2 py-0.5 font-mono text-xs text-warning">
                          In review
                        </span>
                      )}
                      {dbStatus === "rejected" && (
                        <span className="bg-danger/12 rounded-full px-2 py-0.5 font-mono text-xs text-danger">
                          Rejected
                        </span>
                      )}
                    </h2>
                  )}
                  <p className="break-words">
                    {excerpt || "No excerpt yet... Write more to see one."}
                  </p>
                  <div className="flex items-center">
                    <div className="flex-grow">
                      {publishedAt && postStatus === status.SCHEDULED ? (
                        <>
                          {renderDate("Scheduled to publish on ", publishedAt)}
                        </>
                      ) : publishedAt && postStatus === status.PUBLISHED ? (
                        <>
                          {/*If updatedAt is greater than publishedAt by more than one minute show updated at else show publishedAt
                              as on updating publishedAt updatedAt is automatically updated and is greater than publishedAt*/}
                          {updatedAt &&
                          new Date(updatedAt).getTime() -
                            new Date(publishedAt).getTime() >=
                            60000 ? (
                            <>{renderDate("Last updated on ", updatedAt)}</>
                          ) : (
                            <>{renderDate("Published on ", publishedAt)}</>
                          )}
                        </>
                      ) : postStatus === status.DRAFT ? (
                        <>
                          {updatedAt &&
                            renderDate("Last updated on ", updatedAt)}
                        </>
                      ) : null}
                    </div>

                    <Menu as="div" className="relative inline-block text-left">
                      <div>
                        <MenuButton className="dropdown-button">
                          Options
                          <ChevronDownIcon
                            className="-mr-1 ml-2 h-5 w-5"
                            aria-hidden="true"
                          />
                        </MenuButton>
                      </div>

                      <Transition
                        as={Fragment}
                        enter="transition ease-out duration-100"
                        enterFrom="transform opacity-0 scale-95"
                        enterTo="transform opacity-100 scale-100"
                        leave="transition ease-in duration-75"
                        leaveFrom="transform opacity-100 scale-100"
                        leaveTo="transform opacity-0 scale-95"
                      >
                        <MenuItems className="absolute right-0 mt-2 w-40 origin-top-right divide-y divide-hairline bg-surface shadow-lg ring-1 ring-hairline focus:outline-none">
                          <div className="dropdown-bg py-1">
                            <MenuItem>
                              <Link
                                className="dropdown-item group flex items-center px-4 py-2 text-sm text-fg data-[focus]:text-muted"
                                href={`/create/${id}`}
                              >
                                <PencilIcon
                                  className="mr-3 h-5 w-5 text-muted group-hover:text-faint"
                                  aria-hidden="true"
                                />
                                Edit
                              </Link>
                            </MenuItem>

                            <MenuItem>
                              <button
                                onClick={() => setSelectedArticleToDelete(id)}
                                className="dropdown-item group flex w-full items-center px-4 py-2 text-sm text-fg data-[focus]:text-muted"
                              >
                                <TrashIcon
                                  className="mr-3 h-5 w-5 text-faint group-hover:text-muted"
                                  aria-hidden="true"
                                />
                                Delete
                              </button>
                            </MenuItem>
                          </div>
                        </MenuItems>
                      </Transition>
                    </Menu>
                  </div>
                </article>
              );
            })}
          {selectedTabData.status === "success" &&
            selectedTabData.data?.length === 0 && (
              <p className="py-4 font-medium">Nothing to show here... 🥲</p>
            )}
        </div>
      </div>
    </>
  );
};

export default MyPosts;
