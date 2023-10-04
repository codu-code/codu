import type { NextPage } from "next";
import { Fragment, useState } from "react";
import Link from "next/link";
import { Temporal } from "@js-temporal/polyfill";
import { BookmarkIcon, DotsHorizontalIcon } from "@heroicons/react/outline";
import { Menu, Transition } from "@headlessui/react";
import { trpc } from "../../utils/trpc";
import { signIn, useSession } from "next-auth/react";

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
  const [bookmarked, setIsBookmarked] = useState(bookmarkedInitialState);
  const { data: session } = useSession();

  const dateTime = Temporal.Instant.from(date);
  const readableDate = dateTime.toLocaleString(["en-IE"], {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const { mutate: bookmark, status: bookmarkStatus } =
    trpc.post.bookmark.useMutation({
      onSettled() {
        setIsBookmarked((isBookmarked) => !isBookmarked);
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
      console.error(err);
    }
  };

  return (
    <article className="border-l-4 border-l-pink-600 p-4 my-4 shadow-lg bg-white dark:bg-neutral-900">
      <div className="flex justify-between">
        <div className="flex items-center mb-4">
          <span className="sr-only">{name}</span>
          <Link href={`/${username}`}>
            <img
              className="mr-3 rounded-full object-cover h-12 w-12"
              src={image}
              alt={`${name}'s avatar`}
            />
          </Link>
          <div className="flex text-xs text-neutral-500 flex-col justify-center">
            <p className="font-medium text-neutral-500">
              Written by{" "}
              <Link
                href={`/${username}`}
                className="text-neutral-900 dark:text-neutral-400 font-semibold"
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
              <div className="flex justify-start items-center"></div>
            </div>
          </div>
        </div>
      </div>
      <header>
        <Link
          className="text-2xl leading-6 font-semibold tracking-wide cursor-pointer hover:underline"
          href={`/articles/${slug}`}
        >
          {title}
        </Link>
      </header>
      <p className="tracking-wide text-sm md:text-lg my-3 break-words">
        {excerpt}
      </p>
      <div className="flex justify-between content-center w-full">
        <div className="flex items-center justify-between w-full">
          <Link
            className="fancy-link semibold text-lg"
            href={`/articles/${slug}`}
          >
            Read full article
          </Link>
          <div className="flex gap-x-2">
            {showBookmark && (
              <button
                className="lg:mx-auto p-1 rounded-full hover:bg-neutral-300 dark:hover:bg-neutral-800"
                onClick={() => {
                  if (bookmarked) return bookmarkPost(id, false);
                  bookmarkPost(id);
                  if (!session) {
                    signIn();
                  }
                }}
              >
                <BookmarkIcon
                  className={`w-6 h-6${bookmarked ? " fill-blue-400" : ""}`}
                />
              </button>
            )}
            {menuOptions && (
              <Menu as="div" className="relative">
                <div>
                  <Menu.Button className="p-1 rounded-full hover:bg-neutral-300 dark:hover:bg-neutral-800">
                    <span className="sr-only">Open user menu</span>
                    <DotsHorizontalIcon className="w-6 h-6" />
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
                  <Menu.Items className="origin-top-right absolute bottom-10 right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 px-1 ring-black ring-opacity-5 focus:outline-none">
                    {menuOptions.map((item) => (
                      <Menu.Item key={item.label}>
                        {"href" in item ? (
                          <Link
                            className="block px-4 py-2 text-neutral-700 hover:bg-neutral-200 rounded w-full text-left"
                            key={item.label}
                            href={item.href}
                          >
                            {item.label}
                          </Link>
                        ) : (
                          <button
                            className="block px-4 py-2 text-neutral-700 hover:bg-neutral-200 rounded w-full text-left"
                            onClick={item.onClick}
                          >
                            {item.label}
                          </button>
                        )}
                      </Menu.Item>
                    ))}
                  </Menu.Items>
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
