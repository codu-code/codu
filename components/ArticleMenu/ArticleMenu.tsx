"use client";

import React, { Fragment, useEffect, useState } from "react";
import { Popover, Transition } from "@headlessui/react";

import { api } from "@/server/trpc/react";

import {
  HeartIcon,
  BookmarkIcon,
  DotsHorizontalIcon,
} from "@heroicons/react/outline";
import copy from "copy-to-clipboard";
import { type Session } from "next-auth";
import { signIn } from "next-auth/react";
import { ReportComments } from "../Comments/ReportComments";

interface CopyToClipboardOption {
  label: string;
  href: string;
}

interface Props {
  session: Session | null;
  postId: string;
  postTitle: string;
  postUsername: string;
  postUrl: string;
}

const ArticleMenu = ({
  session,
  postId,
  postTitle,
  postUsername,
  postUrl,
}: Props) => {
  const [copied, setCopied] = useState<boolean>(false);
  const [copyToClipboard, setCopyToClipboard] = useState<CopyToClipboardOption>(
    {
      label: "",
      href: "",
    },
  );

  const { label, href } = copyToClipboard;

  const { data, refetch } = api.post.sidebarData.useQuery({
    id: postId,
  });

  useEffect(() => {
    setCopyToClipboard({
      label: copied ? "Copied!" : "Copy to clipboard",
      href: location.href,
    });
    const to = setTimeout(setCopied, 1000, false);
    return () => clearTimeout(to);
  }, [copied]);

  const { mutate: like, status: likeStatus } = api.post.like.useMutation({
    onSettled() {
      refetch();
    },
  });

  const { mutate: bookmark, status: bookmarkStatus } =
    api.post.bookmark.useMutation({
      onSettled() {
        refetch();
      },
    });

  const likePost = async (postId: string, setLiked = true) => {
    if (likeStatus === "loading") return;
    try {
      await like({ postId, setLiked });
    } catch (err) {
      console.error(err);
    }
  };

  const bookmarkPost = async (postId: string, setBookmarked = true) => {
    if (bookmarkStatus === "loading") return;
    try {
      await bookmark({ postId, setBookmarked });
    } catch (err) {
      console.error(err);
    }
  };

  const handleCopyToClipboard = (e: React.FormEvent) => {
    if (label !== e.currentTarget.innerHTML) {
      setCopied(false);
    } else {
      e.preventDefault();
      copy(href);
      setCopied(true);
    }
  };

  return (
    <Transition
      show={!!data}
      as={Fragment}
      enter="transition ease-out duration-200"
      enterFrom="transform opacity-0 scale-75"
      enterTo="transform opacity-100 scale-100"
    >
      <div className="bg-neutral-100 dark:bg-neutral-900 border-t border-neutral-700 fixed lg:w-20 lg:border-r lg:border-b bottom-0 w-full py-2 z-20 lg:top-1/2 lg:-translate-y-1/2 lg:h-56 lg:px-2">
        <div className="flex justify-evenly lg:flex-col h-full">
          <div className="flex items-center lg:flex-col">
            <button
              className="p-1 rounded-full hover:bg-neutral-300 dark:hover:bg-neutral-800"
              onClick={() => {
                if (data?.currentUserLiked) return likePost(postId, false);
                likePost(postId);
                if (!session) {
                  signIn();
                }
              }}
            >
              <HeartIcon
                className={`w-6 h-6${
                  data?.currentUserLiked ? " fill-red-400" : ""
                }`}
              />
            </button>
            <span className="w-4 ml-2">{data?.likes || 0}</span>
          </div>

          <button
            className="lg:mx-auto p-1 rounded-full hover:bg-neutral-300 dark:hover:bg-neutral-800"
            onClick={() => {
              if (!session) {
                signIn();
              }
              if (data?.currentUserBookmarked)
                return bookmarkPost(postId, false);
              bookmarkPost(postId);
            }}
          >
            <BookmarkIcon
              className={`w-6 h-6${
                data?.currentUserBookmarked ? " fill-blue-400" : ""
              }`}
            />
          </button>

          <Popover className="ml-4 relative">
            <Popover.Button className="p-1 rounded-full hover:bg-neutral-300 dark:hover:bg-neutral-800">
              <span className="sr-only">Open user menu</span>
              <DotsHorizontalIcon className="w-6 h-6" />
            </Popover.Button>

            <Transition
              as={Fragment}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Popover.Panel className="origin-top-right absolute bottom-14 right-0 lg:left-16 lg:bottom-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white dark:bg-white ring-1 px-1 ring-black ring-opacity-5 focus:outline-none">
                <div>
                  <ul>
                    <li className="block px-4 py-2 text-neutral-900 dark:text-neutral-700 hover:bg-neutral-200 rounded">
                      <a
                        href={`https://twitter.com/intent/tweet?text="${postTitle}", by ${postUsername}&hashtags=coducommunity,codu&url=${postUrl}`}
                      >
                        Share to X
                      </a>
                    </li>
                    <li>
                      <a
                        className="block px-4 py-2 text-neutral-900 dark:text-neutral-700 hover:bg-neutral-200 rounded"
                        href={`https://www.linkedin.com/sharing/share-offsite/?url=${postUrl}`}
                      >
                        Share to LinkedIn
                      </a>
                    </li>

                    <li className="block px-4 py-2 text-neutral-900 dark:text-neutral-700 hover:bg-neutral-200 rounded">
                      <ReportComments
                        postTitle={postTitle}
                        name={postUsername}
                        postId={postId}
                        postUsername={postUsername}
                        postUrl={postUrl}
                      />
                    </li>
                  </ul>
                </div>
              </Popover.Panel>
            </Transition>
          </Popover>
        </div>
      </div>
    </Transition>
  );
};

export default ArticleMenu;
