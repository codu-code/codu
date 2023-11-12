import type { NextPage } from "next";
import Link from "next/link";
import { Temporal } from "@js-temporal/polyfill";

type Props = {
  title: string;
  slug: string;
  date: string;
  readTime: number;
  name: string;
  image: string;
  username: string;
};

const SideBarSavedArticlePreview: NextPage<Props> = ({
  title,
  slug,
  date,
  readTime,
  name,
  image,
  username,
}) => {
  const dateTime = Temporal.Instant.from(date);
  const readableDate = dateTime.toLocaleString(["en-IE"], {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <article className="my-4 flex h-32 flex-col bg-white p-4 shadow-lg dark:bg-neutral-900">
      <header className="flex grow items-center">
        <Link
          className="cursor-pointer text-base font-semibold leading-6 tracking-wide hover:underline"
          href={`/articles/${slug}`}
        >
          {title}
        </Link>
      </header>
      <div className="flex grow items-center">
        <span className="sr-only">{name}</span>
        <Link href={`/${username}`}>
          <img
            className="mr-3 h-8 w-8 rounded-full object-cover"
            src={image}
            alt={`${name}'s avatar`}
          />
        </Link>
        <div className="flex flex-col justify-center text-[12px] text-neutral-500 ">
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
    </article>
  );
};

export default SideBarSavedArticlePreview;
