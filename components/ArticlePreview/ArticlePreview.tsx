import type { NextPage } from "next";
import Link from "next/link";
import { Temporal } from "@js-temporal/polyfill";

type Props = {
  title: string;
  description: string;
  slug: string;
  date: string;
  readTime: string;
  author: {
    name: string;
    image: string;
  };
};

const ArticlePreview: NextPage<Props> = ({
  title,
  description,
  slug,
  author,
  date,
  readTime,
}) => {
  const dateTime = Temporal.Instant.from(date);
  const readableDate = dateTime.toLocaleString(["en-IE"], {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <article className="p-4 my-4 shadow-lg shadow-pink-500/50 border-2 light:border-black border-white">
      <div className="flex space-x-1 text-sm text-gray-500 mb-2">
        <time dateTime={dateTime.toString()}>{readableDate}</time>
        {readTime && (
          <>
            <span aria-hidden="true">&middot;</span>
            <span>{readTime} read</span>
          </>
        )}
      </div>
      <Link href={`/articles/${slug}`}>
        <header className="text-2xl leading-6 font-semibold tracking-wide cursor-pointer hover:underline">
          {title}
        </header>
      </Link>
      <p className="tracking-wide text-sm md:text-base my-3">{description}</p>
      <div className="sm:flex justify-between content-center">
        <div className="flex items-center">
          <Link href={`/articles/${slug}`}>
            <a className="fancy-link semibold text-lg">Read full article</a>
          </Link>
        </div>
        <div className="flex justify-end items-center">
          <p className="text-sm font-medium text-gray-500">
            Written by{" "}
            <span className="text-gray-400 font-semibold">{author.name}</span>
          </p>
          <div>
            <span className="sr-only">{author.name}</span>
            <img
              className="ml-3 h-10 w-10 rounded-full"
              src={author.image}
              alt={`${author.name}'s avatar`}
            />
          </div>
        </div>
      </div>
    </article>
  );
};

export default ArticlePreview;
