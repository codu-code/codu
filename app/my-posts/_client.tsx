"use client";

import { useState, Fragment } from "react";
import { ExclamationIcon, XIcon } from "@heroicons/react/outline";
import { Dialog, Transition, Menu } from "@headlessui/react";
import Link from "next/link";
import {
  ChevronDownIcon,
  PencilAltIcon,
  TrashIcon,
} from "@heroicons/react/solid";
import { useSearchParams } from "next/navigation";
import { api } from "@/server/trpc/react";
import { Modal } from "../../components/Modal/Modal";
import { redirect } from "next/navigation";

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

const MyPosts = () => {
  const searchParams = useSearchParams();

  const tab = searchParams?.get("tab");

  const [selectedArticleToDelete, setSelectedArticleToDelete] =
    useState<string>();
  const drafts = api.post.drafts.useQuery();
  const published = api.post.myPosts.useQuery();

  const { mutate, status: deleteStatus } = api.post.delete.useMutation({
    onSuccess() {
      setSelectedArticleToDelete(undefined);
      drafts.refetch();
      published.refetch();
    },
  });

  const tabs = [
    {
      name: "Drafts",
      href: "?tab=drafts",
      value: "drafts",
      data: drafts.data,
      status: drafts.status,
      current: tab !== "published",
    },
    {
      name: "Published",
      href: "?tab=published",
      value: "published",
      data: published.data,
      status: published.status,
      current: tab === "published",
    },
  ];

  const selectedTabData = tab === "published" ? tabs[1] : tabs[0];

  return (
    <>
      <Modal
        open={!!selectedArticleToDelete}
        onClose={() => setSelectedArticleToDelete(undefined)}
      >
        <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
          <button
            type="button"
            className="bg-neutral-900 text-neutral-400 hover:text-neutral-500 focus:outline-none"
            onClick={() => setSelectedArticleToDelete(undefined)}
          >
            <span className="sr-only">Close</span>
            <XIcon className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>
        <div className="sm:flex sm:items-start">
          <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-orange-400 to-pink-600 sm:mx-0 sm:h-10 sm:w-10">
            <ExclamationIcon
              className="text-white-600 h-6 w-6"
              aria-hidden="true"
            />
          </div>
          <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
            <Dialog.Title
              as="h3"
              className="text-lg font-medium leading-6 text-white"
            >
              Delete article
            </Dialog.Title>
            <div className="mt-2">
              <p className="text-sm text-neutral-500">
                Are you sure you want to delete this article?
              </p>
              <p className="mt-2 text-sm text-neutral-500">
                All of the data will be permanently removed from our servers
                forever. This action cannot be undone.
              </p>
            </div>
          </div>
        </div>
        <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
          <button
            type="button"
            disabled={deleteStatus === "loading"}
            className="primary-button ml-4"
            onClick={() => {
              if (selectedArticleToDelete)
                mutate({ id: selectedArticleToDelete });
            }}
          >
            {deleteStatus === "loading" ? "Deleting..." : "Delete"}
          </button>
          <button
            type="button"
            className="mt-3 inline-flex w-full justify-center rounded-md border border-neutral-300 bg-white px-4 py-2 text-base font-medium text-neutral-700 shadow-sm hover:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:mt-0 sm:w-auto sm:text-sm"
            onClick={() => setSelectedArticleToDelete(undefined)}
          >
            Cancel
          </button>
        </div>
      </Modal>
      <div className="relative mx-4 max-w-2xl bg-neutral-100 dark:bg-black sm:mx-auto">
        <div className="mb-4 mt-8 border-b border-neutral-200">
          <div className="sm:hidden">
            <label htmlFor="tabs" className="sr-only">
              Select a tab
            </label>
            {/* Use an "onChange" listener to redirect the user to the selected tab URL. */}
            <select
              id="tabs"
              name="tabs"
              className="block w-full text-white"
              onChange={(e) => {
                const { value } = e.target;
                redirect(`?tab=${value.toLowerCase()}`);
              }}
              defaultValue={tabs.find((tab) => tab.current)?.name}
            >
              {tabs.map((tab) => (
                <option key={tab.name} value={tab.value}>
                  {tab.name}
                </option>
              ))}
            </select>
          </div>
          <div className="hidden sm:block">
            <nav className="flex" aria-label="Tabs">
              {tabs.map((tab) => (
                <Link
                  className={classNames(
                    tab.current
                      ? "bg-black text-neutral-200 dark:bg-neutral-100 dark:text-neutral-700"
                      : "text-neutral-700 hover:text-neutral-400 dark:text-neutral-200",
                    "rounded-t-md px-4 py-2 text-base font-medium",
                  )}
                  aria-current={tab.current ? "page" : undefined}
                  key={tab.name}
                  href={tab.href}
                >
                  {tab.name}
                </Link>
              ))}
            </nav>
          </div>
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
              ({ id, title, excerpt, readTimeMins, slug }) => (
                <article
                  className="mb-4 border-2 border-neutral-100 bg-white p-4 dark:bg-black"
                  key={id}
                >
                  {tab === "published" ? (
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
                  <div className="flex justify-end">
                    <Menu as="div" className="relative inline-block text-left">
                      <div>
                        <Menu.Button className="inline-flex w-full justify-center border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 shadow-sm hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-neutral-100">
                          Options
                          <ChevronDownIcon
                            className="-mr-1 ml-2 h-5 w-5"
                            aria-hidden="true"
                          />
                        </Menu.Button>
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
                        <Menu.Items className="absolute right-0 mt-2 w-40 origin-top-right divide-y divide-neutral-100 bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                          <div className="py-1">
                            <Menu.Item>
                              {({ active }) => (
                                <Link
                                  className={classNames(
                                    active
                                      ? "bg-neutral-100 text-black"
                                      : "text-neutral-700",
                                    "group flex items-center px-4 py-2 text-sm",
                                  )}
                                  href={`/create/${id}`}
                                >
                                  <PencilAltIcon
                                    className="mr-3 h-5 w-5 text-neutral-400 group-hover:text-neutral-500"
                                    aria-hidden="true"
                                  />
                                  Edit
                                </Link>
                              )}
                            </Menu.Item>

                            <Menu.Item>
                              {({ active }) => (
                                <button
                                  onClick={() => setSelectedArticleToDelete(id)}
                                  className={classNames(
                                    active
                                      ? "bg-neutral-100 text-black"
                                      : "text-neutral-700",
                                    "group flex w-full items-center px-4 py-2 text-sm",
                                  )}
                                >
                                  <TrashIcon
                                    className="mr-3 h-5 w-5 text-neutral-400 group-hover:text-neutral-500"
                                    aria-hidden="true"
                                  />
                                  Delete
                                </button>
                              )}
                            </Menu.Item>
                          </div>
                        </Menu.Items>
                      </Transition>
                    </Menu>
                  </div>
                </article>
              ),
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
