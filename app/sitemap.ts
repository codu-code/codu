import * as Sentry from "@sentry/nextjs";
import { type MetadataRoute } from "next";

import { db } from "@/server/db";
import { post, user, feed_source, aggregated_article } from "@/server/db/schema";
import { lte, and, isNull, isNotNull, eq } from "drizzle-orm";

const BASE_URL = "https://www.codu.co";
const ROUTES_TO_INDEX = ["/articles", "/feed", "/sponsorship", "/code-of-conduct"];

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
  const sources = (
    await db.query.feed_source.findMany({
      where: eq(feed_source.status, "ACTIVE"),
    })
  ).map(({ slug, updatedAt, createdAt }) => ({
    url: `${BASE_URL}/${slug}`,
    lastModified: new Date(updatedAt || createdAt),
    priority: 0.6,
  }));

  // Feed articles: /[sourceSlug]/[articleSlug]
  const feedArticles = (
    await db
      .select({
        articleSlug: aggregated_article.slug,
        shortId: aggregated_article.shortId,
        sourceSlug: feed_source.slug,
        fetchedAt: aggregated_article.fetchedAt,
        publishedAt: aggregated_article.publishedAt,
      })
      .from(aggregated_article)
      .innerJoin(feed_source, eq(aggregated_article.sourceId, feed_source.id))
      .where(eq(feed_source.status, "ACTIVE"))
  ).map(({ articleSlug, shortId, sourceSlug, fetchedAt, publishedAt }) => ({
    // Use article slug if available, fallback to shortId
    url: `${BASE_URL}/${sourceSlug}/${articleSlug || shortId}`,
    lastModified: new Date(fetchedAt || publishedAt || new Date()),
    priority: 0.5,
  }));

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
  ].filter((route) => !route.url.includes("/api/og")); // Filter out OG routes

  // Capture data as sitemap has been inconsistent and want to test on dev
  Sentry.captureMessage(
    `Sitemap generated: Routes=${routes.length}, Articles=${articles.length}, Users=${users.length}, Sources=${sources.length}, FeedArticles=${feedArticles.length}`,
  );

  return allRoutes;
}
