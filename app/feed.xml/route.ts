import RSS from "rss";
import * as Sentry from "@sentry/nextjs";

import { db } from "@/server/db";
import { posts } from "@/server/db/schema";
import { and, desc, eq, inArray, isNull, lte } from "drizzle-orm";
import { buildContentHref } from "@/server/lib/content-url";

const SITE_ORIGIN = "https://www.codu.co";

// Member-written content only: articles and community text posts. Aggregated
// source content (sourceId set) canonicalises off Codú, and bare link/resource
// shares aren't readable items, so neither belongs in the feed.
const FEED_TYPES = ["article", "discussion", "question", "til"] as const;

export async function GET() {
  const feed = new RSS({
    title: "Codú",
    description:
      "Codú — articles and tutorials for AI builders and indie hackers.",
    generator: "RSS for Node and Next.js",
    feed_url: `${SITE_ORIGIN}/feed.xml`,
    site_url: `${SITE_ORIGIN}/`,
    managingEditor: "Niall Maher",
    webMaster: "niall@codu.co (Niall Maher)",
    copyright: `Copyright ${new Date().getFullYear().toString()}, Codú Limited`,
    language: "en-US",
    pubDate: new Date().toUTCString(),
    ttl: 60,
  });

  try {
    const items = await db.query.posts.findMany({
      columns: {
        title: true,
        excerpt: true,
        slug: true,
        type: true,
        publishedAt: true,
        updatedAt: true,
      },
      with: {
        author: { columns: { username: true, name: true } },
        tags: { with: { tag: true } },
      },
      where: and(
        eq(posts.status, "published"),
        lte(posts.publishedAt, new Date().toISOString()),
        isNull(posts.sourceId),
        inArray(posts.type, [...FEED_TYPES]),
      ),
      orderBy: [desc(posts.publishedAt)],
      limit: 50,
    });

    for (const item of items) {
      if (!item.slug || !item.publishedAt) continue;
      const path = buildContentHref({
        type: item.type,
        slug: item.slug,
        authorUsername: item.author?.username,
      });
      if (!path) continue;

      feed.item({
        title: item.title,
        description: item.excerpt ?? "",
        url: `${SITE_ORIGIN}${path}`,
        categories: item.tags.map(({ tag }) => tag.title.toLowerCase()),
        author: item.author?.name ?? undefined,
        date: item.publishedAt,
      });
    }

    return new Response(feed.xml({ indent: true }), {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
      },
    });
  } catch (error) {
    Sentry.captureException(error);
    return new Response("An error occurred while generating the feed.");
  }
}
