import Link from "next/link";
import { Temporal } from "@js-temporal/polyfill";

// Get favicon URL from a website
const getFaviconUrl = (websiteUrl: string | null | undefined): string | null => {
  if (!websiteUrl) return null;
  try {
    const url = new URL(websiteUrl);
    return `https://www.google.com/s2/favicons?domain=${url.hostname}&sz=32`;
  } catch {
    return null;
  }
};

// Get hostname from URL
const getHostname = (urlString: string | null | undefined): string | null => {
  if (!urlString) return null;
  try {
    const url = new URL(urlString);
    return url.hostname;
  } catch {
    return null;
  }
};

interface AuthorInfo {
  name: string;
  username: string;
  image: string | null;
}

interface SourceInfo {
  name: string;
  slug: string | null;
  logo: string | null;
  websiteUrl: string | null;
  author?: string | null;
}

interface ContentMetaHeaderProps {
  publishedAt: string | null;
  readTimeMins?: number | null;
  externalUrl?: string | null;
  author?: AuthorInfo | null;
  source?: SourceInfo | null;
}

const ContentMetaHeader = ({
  publishedAt,
  readTimeMins,
  externalUrl,
  author,
  source,
}: ContentMetaHeaderProps) => {
  const dateTime = publishedAt
    ? Temporal.Instant.from(new Date(publishedAt).toISOString())
    : null;
  const readableDate = dateTime
    ? dateTime.toLocaleString(["en-IE"], {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  const faviconUrl = source ? getFaviconUrl(source.websiteUrl || externalUrl) : null;
  const hostname = getHostname(externalUrl);

  // Render author info (for user posts)
  if (author) {
    return (
      <div className="mb-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-neutral-500 dark:text-neutral-400">
        <Link
          href={`/${author.username}`}
          className="flex items-center gap-2 hover:text-neutral-700 dark:hover:text-neutral-200"
        >
          {author.image ? (
            <img
              src={author.image}
              alt=""
              className="h-5 w-5 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-orange-100 text-xs font-bold text-orange-600 dark:bg-orange-900 dark:text-orange-300">
              {author.name?.charAt(0).toUpperCase() || "?"}
            </div>
          )}
          <span className="font-medium">{author.name}</span>
        </Link>
        {readableDate && (
          <>
            <span aria-hidden="true">·</span>
            <time dateTime={dateTime?.toString()}>{readableDate}</time>
          </>
        )}
        {readTimeMins && (
          <>
            <span aria-hidden="true">·</span>
            <span>{readTimeMins} min read</span>
          </>
        )}
      </div>
    );
  }

  // Render source info (for feed articles)
  if (source) {
    const sourceLink = source.slug ? `/feed/${source.slug}` : "#";
    return (
      <div className="mb-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-neutral-500 dark:text-neutral-400">
        <Link
          href={sourceLink}
          className="flex items-center gap-2 hover:text-neutral-700 dark:hover:text-neutral-200"
        >
          {source.logo ? (
            <img
              src={source.logo}
              alt=""
              className="h-5 w-5 rounded object-cover"
            />
          ) : faviconUrl ? (
            <img src={faviconUrl} alt="" className="h-5 w-5 rounded" />
          ) : (
            <div className="flex h-5 w-5 items-center justify-center rounded bg-orange-100 text-xs font-bold text-orange-600 dark:bg-orange-900 dark:text-orange-300">
              {source.name?.charAt(0).toUpperCase() || "?"}
            </div>
          )}
          <span className="font-medium">{source.name || "Unknown Source"}</span>
        </Link>
        {source.author &&
          source.author.trim() &&
          !["by", "by,", "by ,"].includes(source.author.trim().toLowerCase()) && (
            <>
              <span aria-hidden="true">·</span>
              <span>{source.author.replace(/^by\s+/i, "").trim()}</span>
            </>
          )}
        {readableDate && (
          <>
            <span aria-hidden="true">·</span>
            <time dateTime={dateTime?.toString()}>{readableDate}</time>
          </>
        )}
        {hostname && (
          <>
            <span aria-hidden="true">·</span>
            <span className="text-neutral-400 dark:text-neutral-500">{hostname}</span>
          </>
        )}
      </div>
    );
  }

  // Fallback - just date
  return readableDate ? (
    <div className="mb-3 text-sm text-neutral-500 dark:text-neutral-400">
      <time dateTime={dateTime?.toString()}>{readableDate}</time>
    </div>
  ) : null;
};

export default ContentMetaHeader;
