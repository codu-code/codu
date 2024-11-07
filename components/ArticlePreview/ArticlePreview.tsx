"use client";
import * as Sentry from "@sentry/nextjs";
import type { NextPage } from "next";
import { Fragment, useState } from "react";
import Link from "next/link";
import { Temporal } from "@js-temporal/polyfill";
import {
  BookmarkIcon,
  EllipsisHorizontalIcon,
} from "@heroicons/react/20/solid";
import {
  Menu,
  MenuButton,
  MenuItem,
  MenuItems,
  Transition,
} from "@headlessui/react";
import { api } from "@/server/trpc/react";
import { signIn, useSession } from "next-auth/react";
import { toast } from "sonner";

type ButtonOptions = {
  label: string;
  postId: string;
  onClick: () => void | Promise<void>;
};
type LinkOptions = { label: string; postId: string; href: string };

type Props = {
  title: string;
  excerpt: string;
  slug: string;
  date: string;
  readTime: number;
  name: string;
  image: string;
  username: string;
  id: string;
  menuOptions?: Array<ButtonOptions | LinkOptions>;
  showBookmark?: boolean;
  bookmarkedInitialState?: boolean;
  likes: number;
};

const ArticlePreview: NextPage<Props> = ({
  title,
  excerpt,
  slug,
  name,
  image,
  date,
  readTime,
  id,
  username,
  menuOptions,
  showBookmark = true,
  bookmarkedInitialState = false,
}) => {
  const { data: session } = useSession();
  const [bookmarked, setIsBookmarked] = useState(bookmarkedInitialState);
  const howManySavedToShow = 3;

  const { refetch } = api.post.myBookmarks.useQuery(
    { limit: howManySavedToShow },
    { enabled: !!session },
  );
  const dateTime = Temporal.Instant.from(new Date(date).toISOString());
  const readableDate = dateTime.toLocaleString(["en-IE"], {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const { mutate: bookmark, status: bookmarkStatus } =
    api.post.bookmark.useMutation({
      onSettled() {
        setIsBookmarked((isBookmarked) => !isBookmarked);
      },
      onSuccess: () => {
        refetch();
      },
      onError: (error) => {
        toast.error("Failed to update bookmark");
        Sentry.captureException(error);
      },
    });

  const bookmarkPost = async (postId: string, setBookmarked = true) => {
    if (bookmarkStatus === "loading") return;
    try {
      if (!session) {
        signIn();
      }
      return await bookmark({ postId, setBookmarked });
    } catch (err) {
      Sentry.captureException(err);
    }
  };

  return (
    <article className="relative my-2 rounded-r border border-l-0 border-neutral-300 bg-white p-4 pl-6 dark:border-neutral-600 dark:bg-neutral-900">
      <div className="absolute bottom-[-1px] left-0 top-[-1px] flex w-2 justify-between bg-pink-600" />
      <div className="flex justify-between">
        <div className="mb-4 flex items-center">
          <span className="sr-only">{name}</span>
          <Link href={`/${username}`}>
            <img
              className="mr-3 h-12 w-12 rounded-full object-cover"
              src={image}
              alt={`${name}'s avatar`}
            />
          </Link>
          <div className="flex flex-col justify-center text-xs text-neutral-500">
            <p className="font-medium text-neutral-500">
              Written by{" "}
              <Link
                href={`/${username}`}
                className="font-semibold text-neutral-900 dark:text-neutral-400"
              >
                {name}
              </Link>
            </p>
            <div className="flex space-x-2">
              <time dateTime={dateTime.toString()}>{readableDate}</time>
              {readTime && (
                <>
                  <span aria-hidden="true">&middot;</span>
                  <span>{readTime} min read</span>
                </>
              )}
              <div className="flex items-center justify-start"></div>
            </div>
          </div>
        </div>
      </div>
      <header>
        <Link
          className="cursor-pointer break-words text-2xl font-semibold leading-6 tracking-wide hover:underline"
          href={`/articles/${slug}`}
        >
          {title}
        </Link>
      </header>
      <p className="my-3 break-words text-sm tracking-wide md:text-lg">
        {excerpt}
      </p>
      <div className="flex w-full content-center justify-between">
        <div className="flex w-full items-center justify-between">
          <Link
            className="semibold cursor-pointer bg-gradient-to-r from-orange-400 to-pink-600 bg-clip-text text-lg tracking-wide text-transparent hover:from-orange-300 hover:to-pink-500"
            href={`/articles/${slug}`}
          >
            Read full article
          </Link>
          <div className="flex gap-x-2">
            {showBookmark && (
              <button
                className="rounded-full p-2 hover:bg-neutral-300 focus:outline-none focus:ring-white focus-visible:ring-2 focus-visible:ring-pink-600 focus-visible:ring-offset-pink-600 dark:hover:bg-neutral-800 lg:mx-auto"
                onClick={() => {
                  if (!session) {
                    return signIn();
                  }
                  if (bookmarked) {
                    return bookmarkPost(id, false);
                  }
                  bookmarkPost(id);
                }}
                aria-label={
                  bookmarked ? "Remove bookmark" : "Bookmark this post"
                }
              >
                <BookmarkIcon
                  className={`h-6 w-6 ${
                    bookmarked
                      ? "fill-blue-400"
                      : "fill-neutral-400 dark:fill-neutral-600"
                  }`}
                />
              </button>
            )}
            {menuOptions && (
              <Menu as="div" className="relative">
                <div>
                  <MenuButton className="rounded-full p-1 hover:bg-neutral-300 dark:hover:bg-neutral-800">
                    <span className="sr-only">Open user menu</span>
                    <EllipsisHorizontalIcon className="h-6 w-6" />
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
                  <MenuItems className="absolute bottom-10 right-0 mt-2 w-48 origin-top-right rounded-md bg-white px-1 py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                    {menuOptions.map((item) => (
                      <MenuItem key={item.label}>
                        {"href" in item ? (
                          <Link
                            className="block w-full rounded px-4 py-2 text-left text-neutral-700 hover:bg-neutral-200"
                            key={item.label}
                            href={item.href}
                          >
                            {item.label}
                          </Link>
                        ) : (
                          <button
                            className="block w-full rounded px-4 py-2 text-left text-neutral-700 hover:bg-neutral-200"
                            onClick={item.onClick}
                          >
                            {item.label}
                          </button>
                        )}
                      </MenuItem>
                    ))}
                  </MenuItems>
                </Transition>
              </Menu>
            )}
          </div>
        </div>
      </div>
    </article>
  );
};

export default ArticlePreview;
