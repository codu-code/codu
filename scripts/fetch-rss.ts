/**
 * Local script to fetch RSS feeds and populate the aggregated_article table.
 * Use this for testing without running the Lambda cron.
 *
 * Usage: npx tsx scripts/fetch-rss.ts
 */

import { db } from "../server/db";
import { feed_source, aggregated_article } from "../server/db/schema";
import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";
import Parser from "rss-parser";

const parser = new Parser({
  timeout: 10000,
  headers: {
    "User-Agent": "Mozilla/5.0 (compatible; CoduBot/1.0; +https://codu.co)",
  },
});

// Simple excerpt extraction
function extractExcerpt(content: string, maxLength = 200): string {
  // Remove HTML tags
  const text = content.replace(/<[^>]*>/g, "").trim();
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + "...";
}

// Extract image from content or enclosure
function extractImage(item: Parser.Item): string | null {
  // Check enclosure
  if (item.enclosure?.url) {
    return item.enclosure.url;
  }

  // Check media:content
  const mediaContent = (item as Record<string, unknown>)["media:content"];
  if (mediaContent && typeof mediaContent === "object" && "url" in (mediaContent as Record<string, unknown>)) {
    return (mediaContent as Record<string, string>).url;
  }

  // Try to extract from content
  const content = item.content || item["content:encoded"] || "";
  const imgMatch = content.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (imgMatch) {
    return imgMatch[1];
  }

  return null;
}

async function fetchAndProcessFeed(source: typeof feed_source.$inferSelect) {
  console.log(`\nFetching: ${source.name} (${source.feedUrl})`);

  try {
    const feed = await parser.parseURL(source.feedUrl);
    console.log(`  Found ${feed.items.length} items`);

    let newCount = 0;
    let skippedCount = 0;

    for (const item of feed.items) {
      if (!item.link || !item.title) {
        skippedCount++;
        continue;
      }

      // Check if article already exists
      const existing = await db.query.aggregated_article.findFirst({
        where: and(
          eq(aggregated_article.url, item.link),
          eq(aggregated_article.sourceId, source.id)
        ),
      });

      if (existing) {
        skippedCount++;
        continue;
      }

      // Extract data
      const excerpt = extractExcerpt(
        item.contentSnippet || item.content || item.summary || ""
      );
      const imageUrl = extractImage(item);
      const publishedAt = item.pubDate
        ? new Date(item.pubDate)
        : new Date();

      // Insert new article
      await db.insert(aggregated_article).values({
        shortId: nanoid(8),
        sourceId: source.id,
        title: item.title.substring(0, 500),
        url: item.link,
        excerpt: excerpt || null,
        author: item.creator || item.author || null,
        imageUrl: imageUrl,
        publishedAt: publishedAt.toISOString(),
        fetchedAt: new Date().toISOString(),
      });

      newCount++;
    }

    console.log(`  Added: ${newCount}, Skipped: ${skippedCount}`);
    return { success: true, newCount, skippedCount };
  } catch (error) {
    console.error(`  Error: ${error instanceof Error ? error.message : "Unknown error"}`);
    return { success: false, error };
  }
}

async function main() {
  console.log("=== RSS Feed Fetcher ===\n");

  // Get all active sources
  const sources = await db.query.feed_source.findMany({
    where: eq(feed_source.isActive, true),
  });

  console.log(`Found ${sources.length} active feed sources`);

  const results = {
    total: sources.length,
    successful: 0,
    failed: 0,
    newArticles: 0,
  };

  for (const source of sources) {
    const result = await fetchAndProcessFeed(source);
    if (result.success) {
      results.successful++;
      results.newArticles += result.newCount || 0;
    } else {
      results.failed++;
    }
  }

  console.log("\n=== Summary ===");
  console.log(`Sources processed: ${results.successful}/${results.total}`);
  console.log(`Failed: ${results.failed}`);
  console.log(`New articles added: ${results.newArticles}`);

  process.exit(0);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
