import { type MetadataRoute } from "next";

import { db } from "@/server/db";
import { user, feed_sources, posts } from "@/server/db/schema";
import { lte, and, isNull, isNotNull, eq } from "drizzle-orm";

// Regenerate sitemap every hour to pick up new feed content from cron jobs.
export const revalidate = 3600;

const BASE_URL = "https://www.codu.co";
const ROUTES_TO_INDEX = [
  "/about",
  // "/articles" omitted — it 301-redirects to "/?type=article"; sitemaps should
  // list only canonical 200 URLs.
  "/",
  "/advertise",
  "/code-of-conduct",
  "/volunteer",
  "/speakers",
];

// Discussions + questions live under /d/{slug}; everything else member-authored
// (article / til / resource / member-link) lives under /{username}/{slug}.
const DISCUSSION_TYPES = ["discussion", "question"] as const;

// TODO: split via generateSitemaps when total URLs >5k (queries are already
// partitioned by type, so the split is mechanical).
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date().toISOString();

  // Member content. Excludes cross-posted (canonicalUrl → off Codú) and
  // aggregated rows (source_id → handled separately).
  const memberPosts = await db
    .select({
      slug: posts.slug,
      type: posts.type,
      updatedAt: posts.updatedAt,
      createdAt: posts.createdAt,
      publishedAt: posts.publishedAt,
      username: user.username,
    })
    .from(posts)
    .innerJoin(user, eq(posts.authorId, user.id))
    .where(
      and(
        eq(posts.status, "published"),
        lte(posts.publishedAt, now),
        isNull(posts.canonicalUrl),
        isNull(posts.sourceId),
        isNotNull(user.username),
      ),
    );

  const members = memberPosts.map(
    ({ slug, type, updatedAt, createdAt, username }) => {
      const isDiscussion = (DISCUSSION_TYPES as readonly string[]).includes(
        type,
      );
      // Discussions/questions resolve under /d/{slug}; all other member content
      // under /{username}/{slug}. The slug already ends with the urlId.
      const path = isDiscussion ? `/d/${slug}` : `/${username}/${slug}`;
      return {
        url: `${BASE_URL}${path}`,
        lastModified: new Date(updatedAt || createdAt),
        priority: isDiscussion ? 0.6 : 0.7,
      };
    },
  );

  // User profiles: /{username} — only handle-having users, else we'd advertise
  // `/null` (404) URLs and erode crawl trust.
  const users = (
    await db.query.user.findMany({ where: isNotNull(user.username) })
  ).map(({ username, updatedAt, createdAt }) => ({
    url: `${BASE_URL}/${username}`,
    lastModified: new Date(updatedAt || createdAt),
    priority: 0.8,
  }));

  // Source profiles + aggregated/RSS source articles. Wrapped in try/catch since
  // these tables may lag migrations on a fresh environment.
  let sources: { url: string; lastModified: Date; priority: number }[] = [];
  let sourceArticles: { url: string; lastModified: Date; priority: number }[] =
    [];

  try {
    // Source profiles: /s/{slug}
    sources = (
      await db.query.feed_sources.findMany({
        where: and(
          eq(feed_sources.status, "active"),
          isNotNull(feed_sources.slug),
        ),
      })
    ).map(({ slug, updatedAt, createdAt }) => ({
      url: `${BASE_URL}/s/${slug}`,
      lastModified: new Date(updatedAt || createdAt),
      priority: 0.6,
    }));

    // Aggregated source articles: /s/{sourceSlug}/{slug}. Included — they
    // self-canonical to Codú and drive the freshness strategy.
    sourceArticles = (
      await db
        .select({
          articleSlug: posts.slug,
          sourceSlug: feed_sources.slug,
          publishedAt: posts.publishedAt,
          updatedAt: posts.updatedAt,
        })
        .from(posts)
        .innerJoin(feed_sources, eq(posts.sourceId, feed_sources.id))
        .where(
          and(
            eq(posts.type, "link"),
            eq(posts.status, "published"),
            eq(feed_sources.status, "active"),
            isNotNull(feed_sources.slug),
            isNotNull(posts.slug),
          ),
        )
    ).map(({ articleSlug, sourceSlug, publishedAt, updatedAt }) => ({
      url: `${BASE_URL}/s/${sourceSlug}/${articleSlug}`,
      lastModified: new Date(updatedAt || publishedAt || new Date()),
      priority: 0.5,
    }));
  } catch {
    // Tables may not exist yet if migrations haven't been run — continue with
    // empty arrays for sources and sourceArticles.
  }

  const routes = ROUTES_TO_INDEX.map((route) => ({
    url: BASE_URL + route,
    lastModified: new Date(),
    priority: 0.9,
  }));

  const allRoutes = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      priority: 1.0,
    },
    ...routes,
    ...users,
    ...sources,
    ...members,
    ...sourceArticles,
  ].filter((route) => !route.url.includes("/api/og"));

  return allRoutes;
}
