import * as Sentry from "@sentry/nextjs";
import { headers } from "next/headers";
import db from "@/server/db/client";

const BASE_URL = "https://www.codu.co";
const ROUTES_TO_INDEX = ["/articles", "/sponsorship", "/code-of-conduct"];

// @TODO - Lock down to codebuild/vercel domains after it works

export default async function sitemap() {
  try {
    const headersList = headers();
    const host = headersList.get("host");
    const origin = headersList.get("origin");

    Sentry.captureMessage(`HOST: ${host}, ORIGIN: ${origin}`);

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

    const users = (await db.user.findMany()).map(({ username, updatedAt }) => ({
      url: `${BASE_URL}/${username}`,
      lastModified: updatedAt,
    }));

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
  } catch (error) {
    Sentry.captureException(error);
  }
}
