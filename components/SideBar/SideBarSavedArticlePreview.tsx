import type { NextPage } from "next";
import Link from "next/link";
import { Temporal } from "@js-temporal/polyfill";

type Props = {
  title: string;
  slug: string;
  date: string | null;
  readTime: number;
  name: string;
  username: string;
};

const SideBarSavedArticlePreview: NextPage<Props> = ({
  title,
  slug,
  date,
  readTime,
  name,
  username,
}) => {
  if (!date) return null;

  const dateTime = Temporal.Instant.from(new Date(date).toISOString());
  const readableDate = dateTime.toLocaleString(["en-IE"], {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <article className="my-2 flex flex-col border border-neutral-300 bg-white p-4 px-4 py-3 text-neutral-900 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-50">
      <header className="flex grow items-center">
        <Link
          className="mb-2 cursor-pointer text-base font-semibold leading-6 tracking-wide hover:underline"
          href={`/articles/${slug}`}
        >
          {title}
        </Link>
      </header>
      <div className="flex grow items-center">
        <span className="sr-only">{name}</span>

        <div className="flex flex-col justify-center text-[12px] text-neutral-500">
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
