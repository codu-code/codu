import Link from "next/link";
import { ArrowTopRightOnSquareIcon } from "@heroicons/react/20/solid";
import { Temporal } from "@js-temporal/polyfill";
import {
  ensureHttps,
  getFaviconUrl,
  getHostname,
  safeExternalHref,
} from "@/utils/url";
import { type FeedArticle } from "./_resolvers";
import FeedArticleInteractions, {
  TrackedExternalLink,
} from "./_feedArticleInteractions";

type Props = {
  sourceSlug: string;
  article: FeedArticle;
};

// Server component: renders the crawlable article shell (h1, excerpt, source
// attribution, outbound link, image, date) from the data the page already
// resolved. Per-user interactivity lives in the FeedArticleInteractions island.
const FeedArticleContent = ({ sourceSlug, article }: Props) => {
  const dateTime = article.publishedAt
    ? Temporal.Instant.from(new Date(article.publishedAt).toISOString())
    : null;
  const readableDate = dateTime
    ? dateTime.toLocaleString(["en-IE"], {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  const faviconUrl = getFaviconUrl(
    article.source?.websiteUrl || article.externalUrl,
  );
  const hostname = article.externalUrl
    ? getHostname(article.externalUrl)
    : null;
  // Guard against javascript:/data: schemes — z.string().url() accepts them.
  const safeExternalUrl = safeExternalHref(article.externalUrl);

  return (
    <article className="mx-auto max-w-prose py-4 sm:py-8">
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-1.5 font-mono text-sm text-muted transition-colors hover:text-fg"
      >
        ‹ Back to feed
      </Link>

      <p className="eyebrow">
        <span className="slash">{"// "}</span>
        {article.source?.name || "Article"}
        {readableDate ? ` · ${readableDate}` : ""}
      </p>

      <h1 className="mt-4 font-display text-3xl font-extrabold tracking-tight text-fg md:text-4xl">
        {article.title}
      </h1>

      {article.excerpt && (
        <p className="mt-4 text-lg leading-relaxed text-muted">
          {article.excerpt}
        </p>
      )}

      <div className="mt-6 flex items-center gap-3">
        <Link href={`/s/${sourceSlug}`} className="flex-shrink-0">
          {article.source?.logoUrl ? (
            <img
              src={article.source.logoUrl}
              alt=""
              className="h-11 w-11 rounded-full border border-hairline object-cover"
            />
          ) : faviconUrl ? (
            <img
              src={faviconUrl}
              alt=""
              className="h-11 w-11 rounded-full border border-hairline"
            />
          ) : (
            <div className="bg-accent/12 flex h-11 w-11 items-center justify-center rounded-full text-sm font-bold text-accent">
              {article.source?.name?.charAt(0).toUpperCase() || "?"}
            </div>
          )}
        </Link>
        <div className="min-w-0 flex-1">
          <Link
            href={`/s/${sourceSlug}`}
            className="block text-sm font-semibold text-fg hover:text-accent"
          >
            {article.source?.name || "Unknown Source"}
          </Link>
          <div className="font-mono text-xs text-faint">
            @{sourceSlug}
            {article.sourceAuthor &&
            article.sourceAuthor.trim() &&
            !["by", "by,", "by ,"].includes(
              article.sourceAuthor.trim().toLowerCase(),
            )
              ? ` · ${article.sourceAuthor.replace(/^by\s+/i, "").trim()}`
              : ""}
          </div>
        </div>
      </div>

      {ensureHttps(article.imageUrl) && safeExternalUrl ? (
        <TrackedExternalLink
          articleId={article.id}
          href={safeExternalUrl}
          className="relative mt-8 block overflow-hidden rounded-lg border border-hairline"
        >
          <img
            src={ensureHttps(article.imageUrl)!}
            alt=""
            className="w-full object-cover transition-opacity hover:opacity-90"
            style={{ maxHeight: "400px" }}
          />
          <div className="absolute bottom-2 right-2 rounded-md bg-canvas/70 px-2 py-1 font-mono text-xs text-fg backdrop-blur">
            <ArrowTopRightOnSquareIcon className="mr-1 inline h-3.5 w-3.5" />
            {hostname}
          </div>
        </TrackedExternalLink>
      ) : (
        <div className="mt-8 h-48 rounded-lg border border-hairline bg-elevated bg-grid-dots bg-[length:22px_22px]" />
      )}

      {safeExternalUrl && (
        <TrackedExternalLink
          articleId={article.id}
          href={safeExternalUrl}
          className="primary-button mt-8 w-full"
        >
          <ArrowTopRightOnSquareIcon className="h-5 w-5" />
          Read Full Article at {hostname}
        </TrackedExternalLink>
      )}

      {/* Inline source info - styled like author bio */}
      {article.source && (
        <div className="mt-8 flex items-center gap-3 rounded-lg border border-hairline bg-surface p-4">
          <Link href={`/s/${sourceSlug}`} className="flex-shrink-0">
            {article.source.logoUrl ? (
              <img
                src={article.source.logoUrl}
                alt=""
                className="h-8 w-8 rounded-full object-cover"
              />
            ) : faviconUrl ? (
              <img src={faviconUrl} alt="" className="h-8 w-8 rounded-full" />
            ) : (
              <div className="bg-accent/12 flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold text-accent">
                {article.source.name?.charAt(0).toUpperCase() || "?"}
              </div>
            )}
          </Link>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <Link
                href={`/s/${sourceSlug}`}
                className="font-medium text-fg hover:text-accent"
              >
                {article.source.name}
              </Link>
              <span className="font-mono text-xs text-faint">
                @{sourceSlug}
              </span>
            </div>
            {article.source.description && (
              <p className="truncate text-sm text-muted">
                {article.source.description}
              </p>
            )}
          </div>
        </div>
      )}

      <FeedArticleInteractions
        contentId={article.id}
        sourceSlug={sourceSlug}
        articleSlug={article.slug}
        initialUpvotes={article.upvotes}
        initialDownvotes={article.downvotes}
      />
    </article>
  );
};

export default FeedArticleContent;
