import * as Sentry from "@sentry/nextjs";
import { type MetadataRoute } from "next";

import { db } from "@/server/db";
import { post } from "@/server/db/schema";
import { lte, and, isNull, isNotNull } from "drizzle-orm";

const BASE_URL = "https://www.codu.co";
const ROUTES_TO_INDEX = ["/articles", "/sponsorship", "/code-of-conduct"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const articles = (
    await db
      .select()
      .from(post)
      .where(
        and(
          isNotNull(post.published),
          isNull(post.canonicalUrl),
          lte(post.published, new Date().toISOString()),
        ),
      )
  ).map(({ slug, updatedAt, createdAt }) => ({
    url: `${BASE_URL}/articles/${slug}`,
    lastModified: updatedAt || createdAt,
  }));

  const users = (await db.query.user.findMany()).map(
    ({ username, updatedAt, createdAt }) => ({
      url: `${BASE_URL}/${username}`,
      lastModified: updatedAt || createdAt || new Date(),
    }),
  );

  const routes = ROUTES_TO_INDEX.map((route) => ({
    url: BASE_URL + route,
    lastModified: new Date(),
  }));

  // Shape and connect all the data
  const data = [
    {
      url: BASE_URL,
      lastModified: new Date(),
    },
    ...routes,
    ...articles,
    ...users,
  ];

  // Capture data as sitemap has been inconsistent and want to test on dev
  Sentry.captureMessage(
    `${JSON.stringify(data)}; Routes Count = ${
      routes.length
    }, Articles Count = ${articles.length}, Users Count = ${users.length}`,
  );

  return data;
}
