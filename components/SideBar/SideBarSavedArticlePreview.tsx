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
    <article className="my-2 flex flex-col border border-hairline bg-surface p-4 px-4 py-3 text-fg">
      <header className="flex grow items-center">
        <Link
          className="mb-2 cursor-pointer text-base font-semibold leading-6 tracking-wide hover:underline"
          href={`/${username}/${slug}`}
        >
          {title}
        </Link>
      </header>
      <div className="flex grow items-center">
        <span className="sr-only">{name}</span>

        <div className="flex flex-col justify-center text-[12px] text-muted">
          <p className="font-medium text-muted">
            Written by{" "}
            <Link href={`/${username}`} className="font-semibold text-faint">
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
