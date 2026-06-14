/**
 * Local script to fetch RSS feeds and populate the posts table directly.
 * Use this for testing without running the Lambda cron.
 *
 * Prerequisites: Run create-source-users.ts first to ensure all sources have linked users.
 *
 * Usage: npx tsx scripts/fetch-rss.ts
 */

import { db } from "../server/db";
import { feed_sources, posts } from "../server/db/schema";
import { eq, and, isNotNull } from "drizzle-orm";
import { nanoid } from "nanoid";
import Parser from "rss-parser";
import crypto from "crypto";
import { ensureHttps, unwrapDoubledUrl } from "../utils/url";

const parser = new Parser({
  timeout: 10000,
  headers: {
    "User-Agent": "Mozilla/5.0 (compatible; CoduBot/1.0; +https://codu.co)",
  },
});

// Generate SEO-friendly slug from title + shortId
function generateSlug(title: string, shortId: string): string {
  const slugifiedTitle = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "") // Remove special characters
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Replace multiple hyphens with single
    .substring(0, 280) // Limit length
    .replace(/^-|-$/g, ""); // Remove leading/trailing hyphens

  return `${slugifiedTitle}-${shortId}`;
}

// Simple excerpt extraction
function extractExcerpt(content: string, maxLength = 200): string {
  // Remove HTML tags
  const text = content.replace(/<[^>]*>/g, "").trim();
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + "...";
}

// Calculate read time from word count
function calculateReadTime(wordCount: number): number {
  // Reading speed: ~225 words per minute
  const readTimeMinutes = Math.ceil(wordCount / 225);
  // Clamp between 1 and 30 minutes
  return Math.max(1, Math.min(30, readTimeMinutes));
}

// Extract text content from HTML and count words
function extractTextAndWordCount(html: string): {
  text: string;
  wordCount: number;
} {
  // Remove scripts and styles
  const cleaned = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const wordCount = cleaned.split(/\s+/).filter((w) => w.length > 0).length;
  return { text: cleaned, wordCount };
}

// Extract image from content or enclosure
function extractImage(item: Parser.Item): string | null {
  // Check enclosure
  if (item.enclosure?.url) {
    return item.enclosure.url;
  }

  // Check media:content
  const mediaContent = (item as Record<string, unknown>)["media:content"];
  if (
    mediaContent &&
    typeof mediaContent === "object" &&
    "url" in (mediaContent as Record<string, unknown>)
  ) {
    return (mediaContent as Record<string, string>).url;
  }

  // Try to extract from content
  const itemContent =
    item.content || (item as Record<string, unknown>)["content:encoded"] || "";
  const imgMatch = (itemContent as string).match(
    /<img[^>]+src=["']([^"']+)["']/i,
  );
  if (imgMatch) {
    return imgMatch[1];
  }

  return null;
}

// Fetch article metadata: OG image and read time (combined to avoid double requests)
async function fetchArticleMetadata(
  url: string,
): Promise<{ ogImage: string | null; readTimeMins: number }> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; CoduBot/1.0; +https://codu.co)",
      },
    });
    clearTimeout(timeout);

    if (!response.ok) return { ogImage: null, readTimeMins: 3 };
    const html = await response.text();

    // Extract OG image
    let ogImage: string | null = null;
    const ogMatch =
      html.match(
        /<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i,
      ) ||
      html.match(
        /<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i,
      );
    if (ogMatch?.[1]) {
      ogImage = ogMatch[1];
    } else {
      // Fall back to twitter:image
      const twitterMatch =
        html.match(
          /<meta[^>]*name=["']twitter:image["'][^>]*content=["']([^"']+)["']/i,
        ) ||
        html.match(
          /<meta[^>]*content=["']([^"']+)["'][^>]*name=["']twitter:image["']/i,
        );
      if (twitterMatch?.[1]) ogImage = twitterMatch[1];
    }

    // Calculate read time from word count
    const { wordCount } = extractTextAndWordCount(html);
    const readTimeMins = calculateReadTime(wordCount);

    return { ogImage, readTimeMins };
  } catch {
    return { ogImage: null, readTimeMins: 3 };
  }
}

// Small delay helper for rate limiting
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

interface FeedSource {
  id: number;
  name: string;
  url: string;
  userId: string | null;
}

async function fetchAndProcessFeed(source: FeedSource) {
  console.log(`\nFetching: ${source.name} (${source.url})`);

  if (!source.userId) {
    console.log(
      `  Skipping: No linked user profile (run create-source-users.ts first)`,
    );
    return { success: false, error: "No user profile" };
  }

  try {
    const feed = await parser.parseURL(source.url);
    console.log(`  Found ${feed.items.length} items`);

    // Batch fetch existing URLs for this source (O(1) lookup instead of O(n) queries)
    const existingUrls = await db
      .select({ url: posts.externalUrl })
      .from(posts)
      .where(eq(posts.sourceId, source.id));
    const existingUrlSet = new Set(existingUrls.map((r) => r.url));
    console.log(`  Already have ${existingUrlSet.size} items from this source`);

    let newCount = 0;
    let skippedCount = 0;

    for (const item of feed.items) {
      if (!item.link || !item.title) {
        skippedCount++;
        continue;
      }

      // Skip articles without a publish date (poor quality RSS feeds)
      if (!item.pubDate) {
        skippedCount++;
        continue;
      }

      // Skip articles older than 30 days
      const publishedDate = new Date(item.pubDate);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      if (publishedDate < thirtyDaysAgo) {
        skippedCount++;
        continue;
      }

      // Fast duplicate check using Set (O(1) lookup)
      if (existingUrlSet.has(item.link)) {
        skippedCount++;
        continue;
      }

      // Extract excerpt from RSS content
      const excerpt = extractExcerpt(
        item.contentSnippet || item.content || item.summary || "",
      );
      let imageUrl = extractImage(item);

      // Fetch article metadata (OG image + accurate read time from actual content)
      let readTimeMins = 3; // Default fallback

      console.log(`    Fetching: ${item.title.substring(0, 50)}...`);
      const metadata = await fetchArticleMetadata(item.link);
      readTimeMins = metadata.readTimeMins;

      if (!imageUrl && metadata.ogImage) {
        imageUrl = metadata.ogImage;
        console.log(`    ✓ Found OG image, ${readTimeMins} min read`);
      } else {
        console.log(`    ✓ ${readTimeMins} min read`);
      }

      // Some feeds (e.g. HackerNoon's media:thumbnail) prefix an already-
      // absolute CDN URL with their own origin, producing a 404ing doubled URL.
      imageUrl = ensureHttps(unwrapDoubledUrl(imageUrl));

      // Rate limit: small delay between fetches
      await delay(200);

      // Generate shortId for unique slug
      const shortId = nanoid(7);
      const slug = generateSlug(item.title, shortId);

      // Insert into posts table (new unified schema)
      await db.insert(posts).values({
        id: crypto.randomUUID(),
        type: "link",
        title: item.title.substring(0, 500),
        slug,
        excerpt: excerpt || null,
        externalUrl: item.link,
        coverImage: imageUrl,
        sourceId: source.id,
        sourceAuthor: item.creator || item.author || null,
        readingTime: readTimeMins,
        status: "published",
        publishedAt: publishedDate.toISOString(),
        authorId: source.userId, // Use the feed source's linked user
        showComments: true,
      });

      newCount++;
    }

    console.log(`  Added: ${newCount}, Skipped: ${skippedCount}`);
    return { success: true, newCount, skippedCount };
  } catch (error) {
    console.error(
      `  Error: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
    return { success: false, error };
  }
}

async function main() {
  console.log("=== RSS Feed Fetcher (Direct to Posts) ===\n");

  // Get all active sources with linked user profiles
  const sources = await db.query.feed_sources.findMany({
    where: and(
      eq(feed_sources.status, "active"),
      isNotNull(feed_sources.userId),
    ),
  });

  console.log(`Found ${sources.length} active feed sources with user profiles`);

  // Check for sources without users
  const sourcesWithoutUsers = await db.query.feed_sources.findMany({
    where: and(
      eq(feed_sources.status, "active"),
      eq(feed_sources.userId, null as unknown as string),
    ),
  });

  if (sourcesWithoutUsers.length > 0) {
    console.log(
      `\n⚠️  ${sourcesWithoutUsers.length} active sources have no linked user profiles.`,
    );
    console.log("   Run: npx tsx scripts/create-source-users.ts");
    for (const source of sourcesWithoutUsers) {
      console.log(`   - ${source.name}`);
    }
  }

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
