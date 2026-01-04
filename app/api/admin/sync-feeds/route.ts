import { NextResponse } from "next/server";
import { getServerAuthSession } from "@/server/auth";
import { db } from "@/server/db";
import { feed_source, aggregated_article, aggregated_article_tag, tag } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import Parser from "rss-parser";
import { customAlphabet } from "nanoid";
import { fetchOgImage } from "@/lib/og-image";

// Generate Reddit-style short IDs: lowercase + numbers, 7 characters
const generateShortId = customAlphabet(
  "0123456789abcdefghijklmnopqrstuvwxyz",
  7,
);

// Keyword to tag mapping for auto-tagging
const TAG_KEYWORDS: Record<string, string[]> = {
  JAVASCRIPT: ["javascript", "js", "node", "nodejs", "deno", "bun", "npm", "yarn"],
  REACT: ["react", "nextjs", "next.js", "remix", "gatsby"],
  VUE: ["vue", "nuxt", "vuejs"],
  TYPESCRIPT: ["typescript", "ts"],
  PYTHON: ["python", "django", "flask", "fastapi"],
  CSS: ["css", "tailwind", "sass", "scss", "styling", "styled-components"],
  "WEB DEV": ["web", "frontend", "backend", "fullstack", "api", "rest", "graphql"],
  DEVOPS: ["docker", "kubernetes", "k8s", "ci/cd", "aws", "azure", "gcp", "cloud"],
  CAREER: ["career", "job", "interview", "resume", "hiring", "salary"],
  TUTORIAL: ["tutorial", "guide", "how to", "learn", "beginner", "getting started"],
  AI: ["ai", "machine learning", "ml", "gpt", "llm", "openai", "claude", "chatgpt"],
  DATABASE: ["database", "sql", "postgres", "mongodb", "redis", "prisma", "drizzle"],
};

const parser = new Parser({
  customFields: {
    item: [
      ["media:content", "mediaContent", { keepArray: false }],
      ["media:thumbnail", "mediaThumbnail", { keepArray: false }],
      ["enclosure", "enclosure", { keepArray: false }],
    ],
  },
});

function extractTags(title: string, content: string): string[] {
  const text = `${title} ${content}`.toLowerCase();
  const tags: string[] = [];

  for (const [tagName, keywords] of Object.entries(TAG_KEYWORDS)) {
    if (keywords.some((keyword) => text.includes(keyword))) {
      tags.push(tagName);
    }
  }

  return tags.slice(0, 5);
}

function extractExcerpt(content: string | undefined, maxLength = 500): string {
  if (!content) return "";
  const text = content.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + "...";
}

function extractImageUrl(item: Parser.Item): string | null {
  const mediaContent = (item as Record<string, unknown>).mediaContent as
    | { $?: { url?: string } }
    | undefined;
  const mediaThumbnail = (item as Record<string, unknown>).mediaThumbnail as
    | { $?: { url?: string } }
    | undefined;
  const enclosure = item.enclosure as { url?: string; type?: string } | undefined;

  if (mediaContent?.$?.url) return mediaContent.$.url;
  if (mediaThumbnail?.$?.url) return mediaThumbnail.$.url;
  if (enclosure?.url && enclosure.type?.startsWith("image/")) return enclosure.url;

  return null;
}

export async function POST(request: Request) {
  try {
    // Check admin auth
    const session = await getServerAuthSession();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const sourceId = body.sourceId as number | undefined;

    const stats = {
      sourcesProcessed: 0,
      articlesAdded: 0,
      articlesSkipped: 0,
      ogImagesFetched: 0,
      errors: [] as string[],
    };

    // Get sources to sync
    const sources = sourceId
      ? await db.query.feed_source.findMany({
          where: eq(feed_source.id, sourceId),
        })
      : await db.query.feed_source.findMany({
          where: eq(feed_source.status, "ACTIVE"),
        });

    for (const source of sources) {
      try {
        const feed = await parser.parseURL(source.url);
        let newArticles = 0;

        for (const item of feed.items) {
          if (!item.link || !item.title) continue;

          // Skip old articles (30 days)
          if (item.pubDate) {
            const publishedDate = new Date(item.pubDate);
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            if (publishedDate < thirtyDaysAgo) continue;
          }

          // Check if exists
          const existing = await db.query.aggregated_article.findFirst({
            where: eq(aggregated_article.url, item.link),
          });

          if (existing) {
            stats.articlesSkipped++;
            continue;
          }

          const contentSnippet = item.contentSnippet || item.content || item.summary || "";
          const excerpt = extractExcerpt(contentSnippet);
          const imageUrl = extractImageUrl(item);

          const [newArticle] = await db
            .insert(aggregated_article)
            .values({
              sourceId: source.id,
              shortId: generateShortId(),
              title: item.title.substring(0, 500),
              excerpt,
              url: item.link,
              imageUrl,
              author: item.creator || null,
              publishedAt: item.pubDate ? new Date(item.pubDate).toISOString() : null,
            })
            .returning();

          // Auto-tag
          const tags = extractTags(item.title, contentSnippet);
          for (const tagTitle of tags) {
            try {
              let existingTag = await db.query.tag.findFirst({
                where: eq(tag.title, tagTitle),
              });

              if (!existingTag) {
                const [newTag] = await db.insert(tag).values({ title: tagTitle }).returning();
                existingTag = newTag;
              }

              await db
                .insert(aggregated_article_tag)
                .values({ articleId: newArticle.id, tagId: existingTag.id })
                .onConflictDoNothing();
            } catch {
              // Ignore tag errors
            }
          }

          // Fetch OG image from the article URL
          try {
            const ogImageUrl = await fetchOgImage(item.link);
            if (ogImageUrl) {
              await db
                .update(aggregated_article)
                .set({ ogImageUrl })
                .where(eq(aggregated_article.id, newArticle.id));
              stats.ogImagesFetched++;
            }
          } catch {
            // Silently skip OG image fetch errors
          }

          newArticles++;
          stats.articlesAdded++;
        }

        // Update source status
        await db
          .update(feed_source)
          .set({
            lastFetchedAt: new Date().toISOString(),
            lastSuccessAt: new Date().toISOString(),
            errorCount: 0,
            lastError: null,
          })
          .where(eq(feed_source.id, source.id));

        stats.sourcesProcessed++;
      } catch (error) {
        stats.errors.push(`${source.name}: ${(error as Error).message}`);

        await db
          .update(feed_source)
          .set({
            lastFetchedAt: new Date().toISOString(),
            errorCount: source.errorCount + 1,
            lastError: (error as Error).message.substring(0, 500),
          })
          .where(eq(feed_source.id, source.id));
      }
    }

    return NextResponse.json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error("Sync error:", error);
    return NextResponse.json(
      { error: "Sync failed", details: (error as Error).message },
      { status: 500 },
    );
  }
}
