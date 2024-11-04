"use client";

import {
  Popover,
  PopoverButton,
  PopoverPanel,
  Transition,
} from "@headlessui/react";
import React, { Fragment, useEffect, useState } from "react";

import { api } from "@/server/trpc/react";

import {
  BookmarkIcon,
  EllipsisHorizontalIcon,
  HeartIcon,
} from "@heroicons/react/20/solid";
import copy from "copy-to-clipboard";
import { type Session } from "next-auth";
import { signIn } from "next-auth/react";
import { ReportModal } from "../ReportModal/ReportModal";

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
      // @TODO handle error
      console.error(err);
    }
  };

  const bookmarkPost = async (postId: string, setBookmarked = true) => {
    if (bookmarkStatus === "loading") return;
    try {
      await bookmark({ postId, setBookmarked });
    } catch (err) {
      // @TODO handle error
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

  const [isPopoverPanelOpen, setIsPopoverPanelOpen] = useState(true);

  const closePopoverPanel = (e: React.FormEvent) => {
    e.preventDefault();
    setIsPopoverPanelOpen(false);
  };

  const openPopoverPanel = () => {
    setIsPopoverPanelOpen(true);
  };

  return (
    <Transition
      show={!!data}
      as={Fragment}
      enter="transition ease-out duration-200"
      enterFrom="transform opacity-0 scale-75"
      enterTo="transform opacity-100 scale-100"
    >
      <div className="fixed bottom-0 z-20 w-full border-t border-neutral-700 bg-white py-2 dark:bg-neutral-900 lg:top-1/2 lg:h-56 lg:w-20 lg:-translate-y-1/2 lg:border-b lg:border-r lg:px-2">
        <div className="flex h-full justify-evenly lg:flex-col">
          <div className="flex items-center lg:flex-col">
            <button
              aria-label="like-trigger"
              className="rounded-full p-1 hover:bg-neutral-300 dark:hover:bg-neutral-800"
              onClick={() => {
                if (data?.currentUserLiked) return likePost(postId, false);
                likePost(postId);
                if (!session) {
                  signIn();
                }
              }}
            >
              <HeartIcon
                className={`h-6 w-6 ${
                  data?.currentUserLiked
                    ? "fill-red-400"
                    : "fill-neutral-400 dark:fill-neutral-600"
                }`}
              />
            </button>
            <span>{data?.likes || 0}</span>
          </div>

          <button
            className="rounded-full p-1 hover:bg-neutral-300 focus:outline-none focus:ring-white focus-visible:ring-2 focus-visible:ring-pink-600 focus-visible:ring-offset-pink-600 dark:hover:bg-neutral-800 lg:mx-auto"
            aria-label="bookmark-trigger"
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
              className={`h-6 w-6 ${
                data?.currentUserBookmarked
                  ? "fill-blue-400"
                  : "fill-neutral-400 dark:fill-neutral-600"
              }`}
            />
          </button>

          <Popover className="relative ml-4">
            <PopoverButton
              onClick={openPopoverPanel}
              aria-label="more-options-trigger"
              className="rounded-full p-1 hover:bg-neutral-300 dark:hover:bg-neutral-800"
            >
              <span className="sr-only">Open user menu</span>
              <EllipsisHorizontalIcon className="h-6 w-6 fill-neutral-800 dark:fill-neutral-300" />
            </PopoverButton>
            <Transition
              as={Fragment}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <PopoverPanel
                className={`absolute bottom-14 right-0 mt-2 w-48 origin-top-right rounded-md bg-white px-1 py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none dark:bg-white lg:bottom-0 lg:left-16 ${isPopoverPanelOpen ? "" : "hidden"}`}
              >
                <div>
                  <ul>
                    <li className="block rounded px-4 py-2 text-neutral-900 hover:bg-neutral-200 dark:text-neutral-700">
                      <a
                        href={`https://twitter.com/intent/tweet?text="${postTitle}", by ${postUsername}&hashtags=coducommunity,codu&url=${postUrl}`}
                      >
                        Share to X
                      </a>
                    </li>
                    <li>
                      <a
                        className="block rounded px-4 py-2 text-neutral-900 hover:bg-neutral-200 dark:text-neutral-700"
                        href={`https://www.linkedin.com/sharing/share-offsite/?url=${postUrl}`}
                      >
                        Share to LinkedIn
                      </a>
                    </li>
                    <li>
                      <button
                        className="block w-full rounded px-4 py-2 text-left text-neutral-900 hover:bg-neutral-200 dark:text-neutral-700"
                        onClick={handleCopyToClipboard}
                      >
                        {label}
                      </button>
                    </li>
                    <li className="block rounded px-4 py-2 text-neutral-900 hover:bg-neutral-200 dark:text-neutral-700">
                      <button onClick={closePopoverPanel}>
                        <ReportModal
                          type="post"
                          title={postTitle}
                          id={postId}
                        />
                      </button>
                    </li>
                  </ul>
                </div>
              </PopoverPanel>
            </Transition>
          </Popover>
        </div>
      </div>
    </Transition>
  );
};

export default ArticleMenu;
