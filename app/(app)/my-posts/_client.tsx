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
import { PostStatus, getPostStatus } from "@/utils/post";

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

const MyPosts = () => {
  const searchParams = useSearchParams();

  const tabFromParams = searchParams?.get("tab");

  const [selectedArticleToDelete, setSelectedArticleToDelete] =
    useState<string>();
  const drafts = api.post.myDrafts.useQuery();
  const scheduled = api.post.myScheduled.useQuery();
  const published = api.post.myPublished.useQuery();

  const { mutate, status: deleteStatus } = api.post.delete.useMutation({
    onSuccess() {
      setSelectedArticleToDelete(undefined);
      drafts.refetch();
      published.refetch();
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
      data: published.data,
      status: published.status,
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
          confirmText={deleteStatus === "loading" ? "Deleting..." : "Delete"}
          cancelText="Cancel"
        />
      )}
      <div className="relative mx-4 max-w-2xl bg-neutral-100 dark:bg-black sm:mx-auto">
        <div className="mb-4 mt-8">
          <Tabs tabs={tabs} />
        </div>
        <div>
          {selectedTabData.status === "loading" && (
            <p className="py-4 font-medium">Fetching your posts...</p>
          )}
          {selectedTabData.status === "error" && (
            <p className="py-4 font-medium">
              Something went wrong fetching your posts... Refresh the page.
            </p>
          )}

          {selectedTabData.status === "success" &&
            selectedTabData.data?.map(
              ({ id, title, excerpt, readTimeMins, slug, published, updatedAt }) => {
                const postStatus = published
                  ? getPostStatus(new Date(published))
                  : PostStatus.DRAFT;
                return (
                  <article
                    className="mb-4 border border-neutral-300 bg-white p-4 dark:bg-neutral-900"
                    key={id}
                  >
                    {selectedTab === PUBLISHED ? (
                      <Link href={`articles/${slug}`}>
                        <h2 className="mb-2 text-2xl font-semibold hover:underline">
                          {title}
                        </h2>
                      </Link>
                    ) : (
                      <h2 className=" mb-2 text-2xl font-semibold">{title}</h2>
                    )}
                    <p className="break-words">
                      {excerpt || "No excerpt yet... Write more to see one."}
                    </p>
                    <p className="mt-2 text-sm font-light text-neutral-400">
                      Read time so far: {readTimeMins} mins
                    </p>
                    <div className="flex items-center">
                      <div className="flex-grow">
                        {published && postStatus === PostStatus.SCHEDULED ? (
                          <small>
                            Scheduled to publish on{" "}
                            {new Date(published).toLocaleDateString()} at{" "}
                            {new Date(published).toLocaleTimeString(
                              navigator.language,
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                                hour12: false,
                              },
                            )}
                          </small>
                        ) : published && postStatus === PostStatus.PUBLISHED ? (
                          <small>
                            {/*If updatedAt is greater than published by more than on minutes show updated at else show published 
                              as on updating published updatedAt is automatically updated and is greater than published*/}
                            {(new Date(updatedAt).getTime() - new Date(published).getTime()) >= 60000 ? (
                              <>
                                {"Last updated on "}
                                {new Date(updatedAt).toLocaleDateString()} at{" "}
                                {new Date(updatedAt).toLocaleTimeString(navigator.language, {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  hour12: false,
                                })}
                              </>
                            ) : (
                              <>
                                {"Published on "}
                                {new Date(published).toLocaleDateString()} at{" "}
                                {new Date(published).toLocaleTimeString(navigator.language, {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  hour12: false,
                                })}
                              </>
                            )}
                          </small>
                        ): postStatus === PostStatus.DRAFT ? (
                        <small>
                          Last Updated on {" "}
                          {new Date(updatedAt).toLocaleDateString()} at{" "}
                          {new Date(updatedAt).toLocaleTimeString(
                            navigator.language,
                            {
                              hour: "2-digit",
                              minute: "2-digit",
                              hour12: false,
                            },
                          )}
                        </small>
                      ): null}
                      </div>

                      <Menu
                        as="div"
                        className="relative inline-block text-left"
                      >
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
                          <MenuItems className="absolute right-0 mt-2 w-40 origin-top-right divide-y divide-neutral-100 bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                            <div className="dropdown-bg py-1">
                              <MenuItem>
                                <Link
                                  className="dropdown-item group flex items-center px-4 py-2 text-sm text-neutral-700 data-[focus]:bg-neutral-100 data-[focus]:text-black"
                                  href={`/create/${id}`}
                                >
                                  <PencilIcon
                                    className="mr-3 h-5 w-5 text-neutral-400 group-hover:text-neutral-500"
                                    aria-hidden="true"
                                  />
                                  Edit
                                </Link>
                              </MenuItem>

                              <MenuItem>
                                <button
                                  onClick={() => setSelectedArticleToDelete(id)}
                                  className="dropdown-item group flex w-full items-center px-4 py-2 text-sm text-neutral-700 data-[focus]:bg-neutral-100 data-[focus]:text-black"
                                >
                                  <TrashIcon
                                    className="mr-3 h-5 w-5 text-neutral-400 group-hover:text-neutral-500"
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
              },
            )}
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
