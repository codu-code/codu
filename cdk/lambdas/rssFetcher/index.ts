import { SSMClient, GetParameterCommand } from "@aws-sdk/client-ssm";
import { Client } from "pg";
import Parser from "rss-parser";

const ssmClient = new SSMClient({ region: "eu-west-1" });

// Custom fields to extract from RSS items
const parser = new Parser({
  customFields: {
    item: [
      ["media:content", "mediaContent", { keepArray: false }],
      ["media:thumbnail", "mediaThumbnail", { keepArray: false }],
      ["enclosure", "enclosure", { keepArray: false }],
    ],
  },
});

// Calculate read time from word count
function calculateReadTime(wordCount: number): number {
  // Reading speed: ~225 words per minute
  const readTimeMinutes = Math.ceil(wordCount / 225);
  // Clamp between 1 and 30 minutes
  return Math.max(1, Math.min(30, readTimeMinutes));
}

// Extract text content from HTML and count words
function extractTextAndWordCount(html: string): { text: string; wordCount: number } {
  const cleaned = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const wordCount = cleaned.split(/\s+/).filter(w => w.length > 0).length;
  return { text: cleaned, wordCount };
}

// Helper to get values from AWS SSM
async function getSsmValue(secretName: string): Promise<string> {
  const params = {
    Name: secretName,
    WithDecryption: true,
  };

  try {
    const command = new GetParameterCommand(params);
    const response = await ssmClient.send(command);
    if (!response.Parameter || !response.Parameter.Value) {
      throw new Error(`Parameter not found: ${secretName}`);
    }
    return response.Parameter.Value;
  } catch (error) {
    console.error(`Error retrieving secret: ${error}`);
    throw error;
  }
}

// Extract and clean excerpt from content
function extractExcerpt(
  content: string | undefined,
  maxLength = 300,
): string {
  if (!content) return "";

  // Strip HTML tags
  const text = content
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + "...";
}

// Generate a short random ID (similar to nanoid)
function generateShortId(length = 8): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

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

// Extract image URL from various RSS item fields
function extractImageUrl(item: Parser.Item): string | null {
  // Try different common image locations in RSS feeds
  const mediaContent = (item as Record<string, unknown>).mediaContent as
    | { $?: { url?: string } }
    | undefined;
  const mediaThumbnail = (item as Record<string, unknown>).mediaThumbnail as
    | { $?: { url?: string } }
    | undefined;
  const enclosure = item.enclosure as
    | { url?: string; type?: string }
    | undefined;

  if (mediaContent?.$?.url) {
    return mediaContent.$.url;
  }
  if (mediaThumbnail?.$?.url) {
    return mediaThumbnail.$.url;
  }
  if (enclosure?.url && enclosure.type?.startsWith("image/")) {
    return enclosure.url;
  }

  return null;
}

// Fetch article metadata: OG image and read time (combined to avoid double requests)
async function fetchArticleMetadata(url: string): Promise<{ ogImage: string | null; readTimeMins: number }> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "Mozilla/5.0 (compatible; CoduBot/1.0; +https://codu.co)" },
    });
    clearTimeout(timeout);

    if (!response.ok) return { ogImage: null, readTimeMins: 3 };
    const html = await response.text();

    // Extract OG image
    let ogImage: string | null = null;
    const ogMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i)
      || html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i);
    if (ogMatch?.[1]) {
      ogImage = ogMatch[1];
    } else {
      // Fall back to twitter:image
      const twitterMatch = html.match(/<meta[^>]*name=["']twitter:image["'][^>]*content=["']([^"']+)["']/i)
        || html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']twitter:image["']/i);
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

// Main Lambda handler
exports.handler = async function () {
  console.log("RSS Fetcher Lambda running");

  const stats = {
    sourcesProcessed: 0,
    articlesAdded: 0,
    sourcesWithErrors: 0,
    errors: [] as string[],
  };

  try {
    const DATABASE_URL = await getSsmValue("/env/db/dbUrl");

    const client = new Client({
      connectionString: DATABASE_URL,
    });

    await client.connect();
    console.log("Connected to database");

    // Get active feed sources (use new lowercase table name)
    const { rows: sources } = await client.query(`
      SELECT id, url, name
      FROM feed_sources
      WHERE status = 'active'
    `);

    console.log(`Found ${sources.length} active feed sources`);

    for (const source of sources) {
      try {
        console.log(`Fetching: ${source.name} (${source.url})`);

        const feed = await parser.parseURL(source.url);
        let newArticles = 0;

        // Batch fetch existing URLs for this source (O(1) lookup instead of O(n) queries)
        const { rows: existingUrls } = await client.query(
          `SELECT external_url FROM posts WHERE source_id = $1`,
          [source.id],
        );
        const existingUrlSet = new Set(existingUrls.map((r: { external_url: string }) => r.external_url));
        console.log(`  Already have ${existingUrlSet.size} items from this source`);

        for (const item of feed.items) {
          // Skip items without required fields
          if (!item.link || !item.title) {
            continue;
          }

          // Skip articles without a publish date (poor quality RSS feeds)
          // Articles without dates pile up as "new" and aren't useful
          if (!item.pubDate) {
            continue;
          }

          // Skip articles older than 30 days
          const publishedDate = new Date(item.pubDate);
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          if (publishedDate < thirtyDaysAgo) {
            continue;
          }

          // Fast duplicate check using Set (O(1) lookup)
          if (existingUrlSet.has(item.link)) {
            continue;
          }

          // Extract content for excerpt and tagging
          const contentSnippet =
            item.contentSnippet || item.content || item.summary || "";
          const excerpt = extractExcerpt(contentSnippet);
          let imageUrl = extractImageUrl(item);

          // Fetch article metadata (OG image + accurate read time from actual content)
          console.log(`    Fetching: ${item.title.substring(0, 50)}...`);
          const metadata = await fetchArticleMetadata(item.link);
          const readTimeMins = metadata.readTimeMins;

          // Use OG image as fallback if no RSS image found
          if (!imageUrl && metadata.ogImage) {
            imageUrl = metadata.ogImage;
            console.log(`    ✓ Found OG image, ${readTimeMins} min read`);
          } else {
            console.log(`    ✓ ${readTimeMins} min read`);
          }

          // Small delay between fetches to be polite
          await new Promise((resolve) => setTimeout(resolve, 200));

          // Generate shortId and slug for the new article (7 chars to match DB column)
          const shortId = generateShortId(7);
          const slug = generateSlug(item.title, shortId);

          // Insert directly into posts table (new schema)
          await client.query(
            `INSERT INTO posts
             (type, title, slug, excerpt, external_url, cover_image, source_id, source_author, reading_time, status, published_at, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())`,
            [
              "link", // Post type (lowercase in new schema)
              item.title.substring(0, 500), // Limit title length
              slug,
              excerpt,
              item.link,
              imageUrl, // cover_image
              source.id,
              item.creator || item.author || null,
              readTimeMins,
              "published", // status (lowercase in new schema)
              item.pubDate ? new Date(item.pubDate).toISOString() : null,
            ],
          );

          newArticles++;
        }

        // Update source status - success
        await client.query(
          `UPDATE feed_sources
           SET last_fetched_at = NOW(),
               last_success_at = NOW(),
               error_count = 0,
               last_error = NULL,
               updated_at = NOW()
           WHERE id = $1`,
          [source.id],
        );

        console.log(`Added ${newArticles} new articles from ${source.name}`);
        stats.articlesAdded += newArticles;
        stats.sourcesProcessed++;
      } catch (error) {
        console.error(`Error fetching ${source.name}:`, error);
        stats.sourcesWithErrors++;
        stats.errors.push(`${source.name}: ${(error as Error).message}`);

        // Update source with error status
        await client.query(
          `UPDATE feed_sources
           SET last_fetched_at = NOW(),
               error_count = error_count + 1,
               last_error = $1,
               status = CASE WHEN error_count >= 5 THEN 'error' ELSE status END,
               updated_at = NOW()
           WHERE id = $2`,
          [(error as Error).message.substring(0, 500), source.id],
        );
      }

      // Small delay between sources to be polite
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    await client.end();

    console.log("RSS Fetcher completed:", stats);

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: {
        message: "success",
        stats,
      },
    };
  } catch (error) {
    console.error("Fatal error:", error);

    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: {
        message: "error",
        error: (error as Error).message,
        stats,
      },
    };
  }
};
