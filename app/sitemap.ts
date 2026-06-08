import { type MetadataRoute } from "next";

import { db } from "@/server/db";
import { post, user, feed_sources, posts } from "@/server/db/schema";
import { lte, and, isNull, isNotNull, eq } from "drizzle-orm";

// Regenerate sitemap every hour to pick up new feed content from cron jobs
export const revalidate = 3600;

const BASE_URL = "https://www.codu.co";
const ROUTES_TO_INDEX = [
  "/about",
  "/articles",
  "/",
  "/advertise",
  "/code-of-conduct",
  "/volunteer",
  "/speakers",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // User articles with new URL pattern: /[username]/[slug]
  const articles = (
    await db
      .select({
        slug: post.slug,
        updatedAt: post.updatedAt,
        createdAt: post.createdAt,
        username: user.username,
      })
      .from(post)
      .innerJoin(user, eq(post.userId, user.id))
      .where(
        and(
          isNotNull(post.published),
          isNull(post.canonicalUrl),
          lte(post.published, new Date().toISOString()),
        ),
      )
  ).map(({ slug, updatedAt, createdAt, username }) => ({
    url: `${BASE_URL}/${username}/${slug}`,
    lastModified: new Date(updatedAt || createdAt),
    priority: 0.7,
  }));

  // User profiles: /[username]
  const users = (await db.query.user.findMany()).map(
    ({ username, updatedAt, createdAt }) => ({
      url: `${BASE_URL}/${username}`,
      lastModified: new Date(updatedAt || createdAt),
      priority: 0.8,
    }),
  );

  // Feed sources (pseudo-user profiles): /[sourceSlug]
  // Wrapped in try/catch to handle case where migrations haven't been run yet
  let sources: { url: string; lastModified: Date; priority: number }[] = [];
  let feedArticles: { url: string; lastModified: Date; priority: number }[] =
    [];

  try {
    sources = (
      await db.query.feed_sources.findMany({
        where: eq(feed_sources.status, "active"),
      })
    ).map(({ slug, updatedAt, createdAt }) => ({
      url: `${BASE_URL}/${slug}`,
      lastModified: new Date(updatedAt || createdAt),
      priority: 0.6,
    }));

    // Feed articles from posts table (type=link): /[sourceSlug]/[slug]
    feedArticles = (
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
          ),
        )
    ).map(({ articleSlug, sourceSlug, publishedAt, updatedAt }) => ({
      url: `${BASE_URL}/${sourceSlug}/${articleSlug}`,
      lastModified: new Date(updatedAt || publishedAt || new Date()),
      priority: 0.5,
    }));
  } catch {
    // Tables may not exist yet if migrations haven't been run
    // Continue with empty arrays for sources and feedArticles
  }

  const routes = ROUTES_TO_INDEX.map((route) => ({
    url: BASE_URL + route,
    lastModified: new Date(),
    priority: 0.9,
  }));

  // Shape and connect all the data
  const allRoutes = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      priority: 1.0,
    },
    ...routes,
    ...users,
    ...sources,
    ...articles,
    ...feedArticles,
  ].filter((route) => !route.url.includes("/api/og"));

  return allRoutes;
}
