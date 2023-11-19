// Issue outstanding to easily pass secrets to docker in CDK securely so temporary workaround for build - https://github.com/aws/aws-cdk/issues/24691
import { headers } from "next/headers";
import db from "@/server/db/client";
import * as Sentry from "@sentry/nextjs";

const BASE_URL = "https://www.codu.co";
const ROUTES_TO_INDEX = ["/articles", "/sponsorship", "/code-of-conduct"];

// @TODO - Lock down to codebuild/vercel domains after it works

export async function GET() {
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
  const data = [
    {
      url: BASE_URL,
      lastModified: new Date(),
    },
    ...routes,
    ...articles,
    ...users,
  ];

  return Response.json({ data });
}
