import { useState, Fragment } from "react";
import { NextPage, GetServerSideProps } from "next";
import { ExclamationIcon, XIcon } from "@heroicons/react/outline";
import { Dialog, Transition, Menu } from "@headlessui/react";
import { unstable_getServerSession } from "next-auth";
import Link from "next/link";
import {
  ArchiveIcon,
  ArrowCircleRightIcon,
  ChevronDownIcon,
  DuplicateIcon,
  HeartIcon,
  PencilAltIcon,
  TrashIcon,
  UserAddIcon,
} from "@heroicons/react/solid";
import Layout from "../../components/Layout/Layout";
import { authOptions } from "../api/auth/[...nextauth]";
import { trpc } from "../../utils/trpc";
import { Modal } from "../../components/Modal/Modal";

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

const Drafts: NextPage = () => {
  const [deleteModalOpen, setDeleteModalOpen] = useState<boolean>(false);
  const [selectedArticleToDelete, setSelectedArticleToDelete] =
    useState<string>();
  const { data, status, refetch } = trpc.useQuery(["post.drafts"]);

  const { mutate, status: deleteStatus } = trpc.useMutation(
    ["post.delete-post"],
    {
      onSuccess() {
        setSelectedArticleToDelete(undefined);
        refetch();
      },
    }
  );

  return (
    <Layout>
      <div className="border-t-2">
        <Modal
          open={!!selectedArticleToDelete}
          onClose={() => setSelectedArticleToDelete(undefined)}
        >
          <div className="hidden sm:block absolute top-0 right-0 pt-4 pr-4">
            <button
              type="button"
              className="bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              onClick={() => setSelectedArticleToDelete(undefined)}
            >
              <span className="sr-only">Close</span>
              <XIcon className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>
          <div className="sm:flex sm:items-start">
            <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
              <ExclamationIcon
                className="h-6 w-6 text-red-600"
                aria-hidden="true"
              />
            </div>
            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
              <Dialog.Title
                as="h3"
                className="text-lg leading-6 font-medium text-gray-900"
              >
                Delete article
              </Dialog.Title>
              <div className="mt-2">
                <p className="text-sm text-gray-500">
                  Are you sure you want to delete this article?
                </p>
                <p className="text-sm text-gray-500 mt-2">
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
              className="w-full inline-flex justify-center border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
              onClick={() => {
                if (selectedArticleToDelete)
                  mutate({ id: selectedArticleToDelete });
              }}
            >
              {deleteStatus === "loading" ? "Deleting..." : "Delete"}
            </button>
            <button
              type="button"
              className="mt-3 w-full inline-flex justify-center border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm"
              onClick={() => setSelectedArticleToDelete(undefined)}
            >
              Cancel
            </button>
          </div>
        </Modal>
        <div className="max-w-xl px-4 mx-auto text-white">
          <div className="pb-3 border-b border-gray-200 pt-8 mb-4">
            <h1 className="text-2xl leading-6 font-medium">Drafts</h1>
          </div>
          <div>
            {status === "loading" && (
              <p className="font-medium py-4">Fetching your drafts...</p>
            )}
            {status === "error" && (
              <p className="font-medium py-4">
                Something went wrong... Refresh the page.
              </p>
            )}
            {status === "success" &&
              data.map(({ id, title, excerpt, readTimeMins }) => (
                <article className="border-2 p-4 mb-4" key={id}>
                  <h2 className=" text-2xl font-semibold mb-2">{title}</h2>
                  <p>{excerpt || "No excerpt yet... Write more to see one."}</p>
                  <p className="mt-2 font-light text-sm text-gray-400">
                    Read time so far: {readTimeMins} mins
                  </p>
                  <div className="flex justify-end">
                    <Menu as="div" className="relative inline-block text-left">
                      <div>
                        <Menu.Button className="inline-flex justify-center w-full border border-gray-300 shadow-sm px-4 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100 focus:ring-indigo-500">
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
                        <Menu.Items className="origin-top-right absolute right-0 mt-2 w-40 shadow-lg bg-white ring-1 ring-black ring-opacity-5 divide-y divide-gray-100 focus:outline-none">
                          <div className="py-1">
                            <Menu.Item>
                              {({ active }) => (
                                <Link href={`/create/${id}`}>
                                  <a
                                    className={classNames(
                                      active
                                        ? "bg-gray-100 text-gray-900"
                                        : "text-gray-700",
                                      "group flex items-center px-4 py-2 text-sm"
                                    )}
                                  >
                                    <PencilAltIcon
                                      className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500"
                                      aria-hidden="true"
                                    />
                                    Edit
                                  </a>
                                </Link>
                              )}
                            </Menu.Item>

                            <Menu.Item>
                              {({ active }) => (
                                <button
                                  onClick={() => setSelectedArticleToDelete(id)}
                                  className={classNames(
                                    active
                                      ? "bg-gray-100 text-gray-900"
                                      : "text-gray-700",
                                    "group flex items-center px-4 py-2 text-sm"
                                  )}
                                >
                                  <TrashIcon
                                    className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500"
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
              ))}
            {status === "success" && data.length === 0 && (
              <p className="font-medium py-4">Nothing published yet... 🥲</p>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Drafts;

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await unstable_getServerSession(
    context.req,
    context.res,
    authOptions
  );

  if (!session) {
    return {
      redirect: {
        destination: "/get-started",
        permanent: false,
      },
    };
  }

  return {
    props: {},
  };
};
