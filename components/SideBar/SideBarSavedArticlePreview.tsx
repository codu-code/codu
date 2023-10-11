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
    <article className="h-32 p-4 my-4 shadow-lg bg-white dark:bg-neutral-900 flex flex-col">
       <header className="grow flex items-center">
        <Link
          className="text-base leading-6 font-semibold tracking-wide cursor-pointer hover:underline"
          href={`/articles/${slug}`}>
          {title}
        </Link>
      </header>   
      <div className="flex items-center grow">
        <span className="sr-only">{name}</span>
        <Link href={`/${username}`}>
          <img
            className="mr-3 rounded-full object-cover h-8 w-8"
            src={image}
            alt={`${name}'s avatar`}
          />
        </Link>
        <div className="flex text-[12px] text-neutral-500 flex-col justify-center ">
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
    </article>
  );
};

export default SideBarSavedArticlePreview;
