import Link from "next/link";
import { Temporal } from "@js-temporal/polyfill";
import { getFaviconUrl, getHostname } from "@/utils/url";

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

  const faviconUrl = source
    ? getFaviconUrl(source.websiteUrl || externalUrl)
    : null;
  const hostname = getHostname(externalUrl);

  // Render author info (for user posts)
  if (author) {
    return (
      <div className="mb-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted">
        <Link
          href={`/${author.username}`}
          className="flex items-center gap-2 hover:text-fg"
        >
          {author.image ? (
            <img
              src={author.image}
              alt=""
              className="h-5 w-5 rounded-full object-cover"
            />
          ) : (
            <div className="bg-accent/12 flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold text-accent">
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
    const sourceLink = source.slug ? `/${source.slug}` : "#";
    return (
      <div className="mb-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted">
        <Link
          href={sourceLink}
          className="flex items-center gap-2"
          onClick={(e) => e.stopPropagation()}
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
            <div className="bg-accent/12 flex h-5 w-5 items-center justify-center rounded text-xs font-bold text-accent">
              {source.name?.charAt(0).toUpperCase() || "?"}
            </div>
          )}
          <span className="whitespace-nowrap font-mono text-accent-soft hover:text-accent">
            in {source.name || "Unknown Source"}
          </span>
        </Link>
        {source.author &&
          source.author.trim() &&
          !["by", "by,", "by ,"].includes(
            source.author.trim().toLowerCase(),
          ) && (
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
            <span className="text-faint">{hostname}</span>
          </>
        )}
      </div>
    );
  }

  // Fallback - just date
  return readableDate ? (
    <div className="mb-3 text-sm text-muted">
      <time dateTime={dateTime?.toString()}>{readableDate}</time>
    </div>
  ) : null;
};

export default ContentMetaHeader;
