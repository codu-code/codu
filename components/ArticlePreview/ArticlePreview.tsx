"use client";
import type { NextPage } from "next";
import { Fragment, useId, useRef, useState } from "react";
import Link from "next/link";
import { Temporal } from "@js-temporal/polyfill";
import ArticleBookmark from "../ArticleBookmark/ArticleBookmark";
import { DotsHorizontalIcon } from "@heroicons/react/outline";
import { Menu, Transition } from "@headlessui/react";
import "./ArticlePreview.css";

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
  const ctaLinkId = useId();
  const [mouseDownTime, setMouseDownTime] = useState(0);

  const ctaRef = useRef<HTMLAnchorElement>(null);
  const dateTime = Temporal.Instant.from(date);
  const readableDate = dateTime.toLocaleString(["en-IE"], {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const handleMouseDown = () => {
    setMouseDownTime(+new Date());
  };

  const handleMouseUp = (event: React.SyntheticEvent) => {
    event.stopPropagation();
    const mouseUpTime = +new Date();
    // detect how long the user is taking between mousedown and mouseup and suppress the event to allow for text selection
    if (mouseUpTime - mouseDownTime < 200) {
      ctaRef.current?.click();
    }
  };

  return (
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
    <article
      onMouseUp={handleMouseUp}
      onMouseDown={handleMouseDown}
      className="card my-2 cursor-pointer rounded-r border border-l-4 border-neutral-300 border-l-pink-600 bg-white p-4 dark:border-neutral-600 dark:border-l-pink-600 dark:bg-neutral-900"
    >
      <div className="flex justify-between">
        <header className="mb-4 flex items-center">
          <img
            className="mr-3 h-12 w-12 rounded-full object-cover"
            src={image}
            alt=""
          />
          <div className="flex flex-col justify-center text-xs text-neutral-500">
            <Link
              href={`/${username}`}
              className="font-semibold text-neutral-900 dark:text-neutral-400"
            >
              <span className="font-medium text-neutral-500">Written by</span>
              &nbsp;{name}
            </Link>
            <div className="flex space-x-2">
              <time dateTime={dateTime.toString()}>{readableDate}</time>
              {readTime && (
                <>
                  <span aria-hidden="true">&middot;</span>
                  <span>{readTime} min read</span>
                </>
              )}
            </div>
          </div>
        </header>
      </div>
      <h3>
        <Link
          ref={ctaRef}
          aria-labelledby={`${slug} ${ctaLinkId}`}
          className="text-2xl font-semibold leading-6 tracking-wide hover:underline"
          href={`/articles/${slug}`}
          id={slug}
        >
          {title}
        </Link>
      </h3>
      <p className="my-3 break-words text-sm tracking-wide md:text-lg">
        {excerpt}
      </p>
      <div className="flex w-full content-center justify-between">
        <div className="flex w-full items-center justify-between">
          <span
            aria-hidden="true"
            id={ctaLinkId}
            className="cta fancy-link semibold text-lg"
          >
            Read full article
          </span>
          <div className="flex gap-x-2">
            <ArticleBookmark
              showBookmark={showBookmark}
              id={id}
              initialState={bookmarkedInitialState}
            />
            {menuOptions && (
              <Menu as="div" className="relative">
                <div>
                  <Menu.Button className="rounded-full p-1 hover:bg-neutral-300 dark:hover:bg-neutral-800">
                    <span className="sr-only">Open user menu</span>
                    <DotsHorizontalIcon className="h-6 w-6" />
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
                  <Menu.Items className="absolute bottom-10 right-0 mt-2 w-48 origin-top-right rounded-md bg-white px-1 py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                    {menuOptions.map((item) => (
                      <Menu.Item key={item.label}>
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
