// Served at /llms.txt — a concise, machine-readable summary for LLMs/AEO agents
// following the llms.txt convention (https://llmstxt.org). Links only
// high-value server-rendered pages. Revalidated hourly since the topic list is
// now driven by the database (matching app/sitemap.ts's cadence).
import { db } from "@/server/db";
import { posts, post_tags, tag } from "@/server/db/schema";
import { and, desc, eq, isNotNull, lte, sql } from "drizzle-orm";
import { getCamelCaseFromLower } from "@/utils/utils";
import { SITE_ORIGIN as BASE_URL } from "@/config/site";

export const revalidate = 3600;

const TOP_TAGS_LIMIT = 15;

// Top tag landing pages by published-post count — same join shape as the tag
// section of app/sitemap.ts, plus a count/order/limit.
async function getTopTags(): Promise<{ slug: string; title: string }[]> {
  try {
    const rows = await db
      .select({
        slug: tag.slug,
        title: tag.title,
        postCount: sql<number>`count(*)`,
      })
      .from(tag)
      .innerJoin(post_tags, eq(post_tags.tagId, tag.id))
      .innerJoin(posts, eq(post_tags.postId, posts.id))
      .where(
        and(
          eq(posts.status, "published"),
          lte(posts.publishedAt, new Date().toISOString()),
          isNotNull(tag.slug),
        ),
      )
      .groupBy(tag.id, tag.slug, tag.title)
      .orderBy(desc(sql`count(*)`))
      .limit(TOP_TAGS_LIMIT);

    return rows.filter(
      (row): row is { slug: string; title: string; postCount: number } =>
        row.slug !== null,
    );
  } catch {
    // DB unavailable (fresh environment / migrations lagging) — serve the
    // static sections without the topics list rather than failing the route.
    return [];
  }
}

function buildBody(topTags: { slug: string; title: string }[]): string {
  const topicsSection =
    topTags.length > 0
      ? `\n## Topics\n${topTags
          .map(
            ({ slug, title }) =>
              `- ${getCamelCaseFromLower(title)}: ${BASE_URL}/tag/${slug}`,
          )
          .join("\n")}\n`
      : "";

  return `# Codú

> Codú is a community for AI builders and indie hackers — a place to share what
> you're building, ask questions, swap lessons, and read fresh writing and links
> from across the ecosystem.

## What you'll find
- Member articles, today-I-learned notes, and resource shares
- Discussions and questions from the community
- An aggregated feed of curated writing from sources across the web

## Key links
- Home / feed: ${BASE_URL}/
- About: ${BASE_URL}/about
- Discussions: ${BASE_URL}/discussions
- Sitemap: ${BASE_URL}/sitemap.xml
${topicsSection}
## Notes
- All content canonicalises to www.codu.co.
- For crawl rules see ${BASE_URL}/robots.txt.
`;
}

export async function GET(): Promise<Response> {
  const topTags = await getTopTags();

  return new Response(buildBody(topTags), {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=3600",
    },
  });
}
