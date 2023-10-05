import { useState, Fragment } from "react";
import type {
  NextPage,
  GetServerSideProps,
  InferGetServerSidePropsType,
} from "next";
import { useRouter } from "next/router";
import { ExclamationIcon, XIcon } from "@heroicons/react/outline";
import { Dialog, Transition, Menu } from "@headlessui/react";
import { getServerSession } from "next-auth";
import Link from "next/link";
import {
  ChevronDownIcon,
  PencilAltIcon,
  TrashIcon,
} from "@heroicons/react/solid";
import Layout from "../../components/Layout/Layout";
import { authOptions } from "../../app/api/auth/authOptions";
import { trpc } from "../../utils/trpc";
import { Modal } from "../../components/Modal/Modal";

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

const MyPosts: NextPage = ({
  userId,
}: InferGetServerSidePropsType<typeof getServerSideProps>) => {
  const router = useRouter();

  if (!userId) router.push("/get-started");
  const { tab } = router.query;

  const [selectedArticleToDelete, setSelectedArticleToDelete] =
    useState<string>();
  const drafts = trpc.post.drafts.useQuery();
  const published = trpc.post.myPosts.useQuery();

  const { mutate, status: deleteStatus } = trpc.post.delete.useMutation({
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
    <Layout>
      <>
        <Modal
          open={!!selectedArticleToDelete}
          onClose={() => setSelectedArticleToDelete(undefined)}
        >
          <div className="hidden sm:block absolute top-0 right-0 pt-4 pr-4">
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
            <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-gradient-to-r from-orange-400 to-pink-600 sm:mx-0 sm:h-10 sm:w-10">
              <ExclamationIcon
                className="h-6 w-6 text-white-600"
                aria-hidden="true"
              />
            </div>
            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
              <Dialog.Title
                as="h3"
                className="text-lg leading-6 font-medium text-white"
              >
                Delete article
              </Dialog.Title>
              <div className="mt-2">
                <p className="text-sm text-neutral-500">
                  Are you sure you want to delete this article?
                </p>
                <p className="text-sm text-neutral-500 mt-2">
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
              className="ml-4 primary-button"
              onClick={() => {
                if (selectedArticleToDelete)
                  mutate({ id: selectedArticleToDelete });
              }}
            >
              {deleteStatus === "loading" ? "Deleting..." : "Delete"}
            </button>
            <button
              type="button"
              className="mt-3 rounded-md w-full inline-flex justify-center border border-neutral-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-neutral-700 hover:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm"
              onClick={() => setSelectedArticleToDelete(undefined)}
            >
              Cancel
            </button>
          </div>
        </Modal>
        <div className="relative sm:mx-auto max-w-2xl mx-4">
          <div className="border-b border-neutral-200 mt-8 mb-4">
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
                  router.push(`?tab=${value.toLowerCase()}`);
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
                        ? "bg-neutral-100 text-neutral-700"
                        : "text-neutral-200 hover:text-neutral-400",
                      "px-4 py-2 font-medium text-base rounded-t-md",
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
              <p className="font-medium py-4">Fetching your posts...</p>
            )}
            {selectedTabData.status === "error" && (
              <p className="font-medium py-4">
                Something went wrong fetching your posts... Refresh the page.
              </p>
            )}

            {selectedTabData.status === "success" &&
              selectedTabData.data?.map(
                ({ id, title, excerpt, readTimeMins, slug }) => (
                  <article className="border-2 p-4 mb-4 bg-black" key={id}>
                    {tab === "published" ? (
                      <Link href={`articles/${slug}`}>
                        <h2 className="text-2xl font-semibold mb-2 hover:underline">
                          {title}
                        </h2>
                      </Link>
                    ) : (
                      <h2 className=" text-2xl font-semibold mb-2">{title}</h2>
                    )}
                    <p>
                      {excerpt || "No excerpt yet... Write more to see one."}
                    </p>
                    <p className="mt-2 font-light text-sm text-neutral-400">
                      Read time so far: {readTimeMins} mins
                    </p>
                    <div className="flex justify-end">
                      <Menu
                        as="div"
                        className="relative inline-block text-left"
                      >
                        <div>
                          <Menu.Button className="inline-flex justify-center w-full border border-neutral-300 shadow-sm px-4 py-2 bg-white text-sm font-medium text-neutral-700 hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-neutral-100 focus:ring-indigo-500">
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
                          <Menu.Items className="origin-top-right absolute right-0 mt-2 w-40 shadow-lg bg-white ring-1 ring-black ring-opacity-5 divide-y divide-neutral-100 focus:outline-none">
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
                                    onClick={() =>
                                      setSelectedArticleToDelete(id)
                                    }
                                    className={classNames(
                                      active
                                        ? "bg-neutral-100 text-black"
                                        : "text-neutral-700",
                                      "group flex items-center px-4 py-2 text-sm w-full",
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
                <p className="font-medium py-4">Nothing to show here... 🥲</p>
              )}
          </div>
        </div>
      </>
    </Layout>
  );
};

export default MyPosts;

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getServerSession(context.req, context.res, authOptions);

  if (!session) {
    return {
      redirect: {
        destination: "/get-started",
        permanent: false,
      },
    };
  }

  return {
    props: {
      userId: session.user?.id,
    },
  };
};
