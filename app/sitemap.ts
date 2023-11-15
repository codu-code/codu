import { type MetadataRoute } from "next";
import db from "@/server/db/client";

const BASE_URL = "https://www.codu.co";
const ROUTES_TO_INDEX = ["/articles", "/sponsorship", "/code-of-conduct"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const articles = (
    await db.post.findMany({
      where: {
        NOT: {
          published: null,
        },
      },
    })
  ).map(({ slug, updatedAt }) => ({
    url: `${BASE_URL}/articles/${slug}`,
    lastModified: updatedAt,
  }));

  const users = (await db.post.findMany()).map(({ userId, updatedAt }) => ({
    url: `${BASE_URL}/${userId}`,
    lastModified: updatedAt,
  }));

  const routes = ROUTES_TO_INDEX.map((route) => ({
    url: BASE_URL + route,
    lastModified: new Date(),
  }));
  return [
    {
      url: BASE_URL,
      lastModified: new Date(),
    },
    ...routes,
    ...articles,
    ...users,
  ];
}
