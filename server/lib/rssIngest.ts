// RSS ingest into the live `posts` table, shared by the admin Sync route and
// scripts/fetch-rss.ts. cdk/lambdas/rssFetcher is the scheduled production
// ingest; it is bundled separately and cannot import this module, so the two
// are kept behaviourally in step by hand.
import * as Sentry from "@sentry/nextjs";
import { eq, sql } from "drizzle-orm";
import { customAlphabet } from "nanoid";
import Parser from "rss-parser";

import type { db as Database } from "@/server/db";
import { feed_sources, posts } from "@/server/db/schema";
import { fetchPublicHtml } from "@/server/lib/fetchPage";
import { ensureHttps, unwrapDoubledUrl } from "@/utils/url";

const USER_AGENT = "Mozilla/5.0 (compatible; CoduBot/1.0; +https://codu.co)";
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;
const DEFAULT_READ_TIME_MINS = 3;
const WORDS_PER_MINUTE = 225;
// A source failing with this many errors already recorded is flipped to "error".
const ERROR_COUNT_LIMIT = 5;

type MediaField = { $?: { url?: string } };

export type FeedItem = Parser.Item & {
  author?: string;
  mediaContent?: MediaField;
  mediaThumbnail?: MediaField;
};

type IngestableItem = FeedItem & {
  link: string;
  title: string;
  pubDate: string;
};

export interface ArticleMetadata {
  ogImage: string | null;
  readTimeMins: number;
}

export interface SourceIngestResult {
  sourceId: number;
  sourceName: string;
  added: number;
  skipped: number;
  error: string | null;
}

type IngestSource = Pick<
  typeof feed_sources.$inferSelect,
  "id" | "name" | "url" | "userId"
>;

const parser = new Parser<Record<string, unknown>, FeedItem>({
  timeout: 10000,
  headers: { "User-Agent": USER_AGENT },
  customFields: {
    item: [
      ["media:content", "mediaContent", { keepArray: false }],
      ["media:thumbnail", "mediaThumbnail", { keepArray: false }],
    ],
  },
});

const generateShortId = customAlphabet(
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",
  7,
);

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Strip tags, collapse whitespace and cap the result at `maxLength`. */
export function extractExcerpt(
  content: string | undefined,
  maxLength = 300,
): string {
  if (!content) return "";
  const text = content
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + "...";
}

/** SEO-friendly slug: the slugified title followed by the short id. */
export function generateSlug(title: string, shortId: string): string {
  const slugifiedTitle = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .substring(0, 280)
    .replace(/^-|-$/g, "");

  return `${slugifiedTitle}-${shortId}`;
}

/** The feed's own image for an item: media:content > media:thumbnail > image enclosure. */
export function extractImageUrl(item: FeedItem): string | null {
  if (item.mediaContent?.$?.url) return item.mediaContent.$.url;
  if (item.mediaThumbnail?.$?.url) return item.mediaThumbnail.$.url;
  if (item.enclosure?.url && item.enclosure.type?.startsWith("image/")) {
    return item.enclosure.url;
  }
  return null;
}

/**
 * True when an item should become a post: it has a link, a title and a
 * parseable publish date within the last 30 days, and its link is not already
 * stored for the source.
 */
export function isIngestable(
  item: FeedItem,
  existingUrls: ReadonlySet<string | null>,
  now: Date,
): item is IngestableItem {
  if (!item.link || !item.title || !item.pubDate) return false;

  const publishedAt = new Date(item.pubDate).getTime();
  if (Number.isNaN(publishedAt) || publishedAt < now.getTime() - MAX_AGE_MS) {
    return false;
  }

  return !existingUrls.has(item.link);
}

/** OG image (twitter:image as fallback) and estimated read time of a page. */
export function parseArticleMetadata(html: string): ArticleMetadata {
  const ogImage =
    html.match(
      /<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i,
    )?.[1] ??
    html.match(
      /<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i,
    )?.[1] ??
    html.match(
      /<meta[^>]*name=["']twitter:image["'][^>]*content=["']([^"']+)["']/i,
    )?.[1] ??
    html.match(
      /<meta[^>]*content=["']([^"']+)["'][^>]*name=["']twitter:image["']/i,
    )?.[1] ??
    null;

  const wordCount = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 0).length;
  const readTimeMins = Math.max(
    1,
    Math.min(30, Math.ceil(wordCount / WORDS_PER_MINUTE)),
  );

  return { ogImage, readTimeMins };
}

/** Map an ingestable feed item to the `posts` row inserted for it. */
export function buildPostValues(
  item: IngestableItem,
  source: { id: number; userId: string },
  shortId: string,
  metadata: ArticleMetadata,
): typeof posts.$inferInsert {
  const sourceAuthor = item.creator || item.author;

  return {
    type: "link",
    title: item.title.substring(0, 500),
    slug: generateSlug(item.title, shortId),
    excerpt:
      extractExcerpt(item.contentSnippet || item.content || item.summary) ||
      null,
    externalUrl: item.link,
    // Some feeds (e.g. HackerNoon's media:thumbnail) prefix an already-absolute
    // CDN URL with their own origin, producing a 404ing doubled URL — unwrap it.
    coverImage: ensureHttps(
      unwrapDoubledUrl(extractImageUrl(item) ?? metadata.ogImage),
    ),
    sourceId: source.id,
    sourceAuthor: sourceAuthor ? sourceAuthor.substring(0, 200) : null,
    readingTime: metadata.readTimeMins,
    status: "published",
    publishedAt: new Date(item.pubDate).toISOString(),
    authorId: source.userId,
  };
}

// Feed-supplied links are untrusted, so the page is fetched through the guard.
async function fetchArticleMetadata(url: string): Promise<ArticleMetadata> {
  const html = await fetchPublicHtml(url, {
    timeoutMs: 5000,
    userAgent: USER_AGENT,
  });
  return html
    ? parseArticleMetadata(html)
    : { ogImage: null, readTimeMins: DEFAULT_READ_TIME_MINS };
}

async function ingestFeed(
  db: typeof Database,
  source: IngestSource,
): Promise<SourceIngestResult> {
  const result: SourceIngestResult = {
    sourceId: source.id,
    sourceName: source.name,
    added: 0,
    skipped: 0,
    error: null,
  };

  // Posts need an author; scripts/create-source-users.ts links one per source.
  if (!source.userId) {
    return { ...result, error: "No linked user profile" };
  }

  try {
    const feed = await parser.parseURL(source.url);

    const existing = await db
      .select({ url: posts.externalUrl })
      .from(posts)
      .where(eq(posts.sourceId, source.id));
    const existingUrls = new Set(existing.map((row) => row.url));

    for (const item of feed.items) {
      if (!isIngestable(item, existingUrls, new Date())) {
        result.skipped++;
        continue;
      }

      const metadata = await fetchArticleMetadata(item.link);
      try {
        await db
          .insert(posts)
          .values(
            buildPostValues(
              item,
              { id: source.id, userId: source.userId },
              generateShortId(),
              metadata,
            ),
          );
        existingUrls.add(item.link);
        result.added++;
      } catch (error) {
        // One unstorable item must not fail the rest of the feed.
        Sentry.captureException(error);
        result.skipped++;
      }

      // Be polite to the publisher between article fetches.
      await delay(200);
    }

    const now = new Date().toISOString();
    await db
      .update(feed_sources)
      .set({
        lastFetchedAt: now,
        lastSuccessAt: now,
        errorCount: 0,
        lastError: null,
        // A source that had been parked after repeated failures works again.
        status: sql`CASE WHEN ${feed_sources.status} = 'error' THEN 'active' ELSE ${feed_sources.status} END`,
      })
      .where(eq(feed_sources.id, source.id));
  } catch (error) {
    result.error = error instanceof Error ? error.message : "Unknown error";

    await db
      .update(feed_sources)
      .set({
        lastFetchedAt: new Date().toISOString(),
        errorCount: sql`${feed_sources.errorCount} + 1`,
        lastError: result.error.substring(0, 500),
        status: sql`CASE WHEN ${feed_sources.errorCount} >= ${ERROR_COUNT_LIMIT} THEN 'error' ELSE ${feed_sources.status} END`,
      })
      .where(eq(feed_sources.id, source.id));
  }

  return result;
}

/** Ingest one feed source by id, whatever its status. Null if it doesn't exist. */
export async function ingestSource(
  db: typeof Database,
  sourceId: number,
): Promise<SourceIngestResult | null> {
  const source = await db.query.feed_sources.findFirst({
    where: eq(feed_sources.id, sourceId),
  });
  return source ? ingestFeed(db, source) : null;
}

/** Ingest every active feed source in turn, returning one result per source. */
export async function ingestActiveSources(
  db: typeof Database,
): Promise<SourceIngestResult[]> {
  const sources = await db.query.feed_sources.findMany({
    where: eq(feed_sources.status, "active"),
  });

  const results: SourceIngestResult[] = [];
  for (const source of sources) {
    results.push(await ingestFeed(db, source));
    await delay(100);
  }
  return results;
}
