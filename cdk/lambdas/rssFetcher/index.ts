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

// Keyword to tag mapping for auto-tagging
const TAG_KEYWORDS: Record<string, string[]> = {
  JAVASCRIPT: [
    "javascript",
    "js",
    "node",
    "nodejs",
    "deno",
    "bun",
    "npm",
    "yarn",
  ],
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

// Extract tags from title and content based on keywords
function extractTags(title: string, content: string): string[] {
  const text = `${title} ${content}`.toLowerCase();
  const tags: string[] = [];

  for (const [tag, keywords] of Object.entries(TAG_KEYWORDS)) {
    if (keywords.some((keyword) => text.includes(keyword))) {
      tags.push(tag);
    }
  }

  return tags.slice(0, 5); // Max 5 tags per article
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

    // Get active feed sources
    const { rows: sources } = await client.query(`
      SELECT id, url, name
      FROM "FeedSource"
      WHERE status = 'ACTIVE'
    `);

    console.log(`Found ${sources.length} active feed sources`);

    for (const source of sources) {
      try {
        console.log(`Fetching: ${source.name} (${source.url})`);

        const feed = await parser.parseURL(source.url);
        let newArticles = 0;

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

          // Check if article already exists (by URL)
          const { rows: existing } = await client.query(
            `SELECT id FROM "AggregatedArticle" WHERE url = $1`,
            [item.link],
          );

          if (existing.length > 0) {
            continue;
          }

          // Extract content for excerpt and tagging
          const contentSnippet =
            item.contentSnippet || item.content || item.summary || "";
          const excerpt = extractExcerpt(contentSnippet);
          const imageUrl = extractImageUrl(item);

          // Insert new article
          const {
            rows: [newArticle],
          } = await client.query(
            `INSERT INTO "AggregatedArticle"
             ("sourceId", "title", "excerpt", "url", "imageUrl", "author", "publishedAt", "fetchedAt", "createdAt")
             VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
             RETURNING id`,
            [
              source.id,
              item.title.substring(0, 500), // Limit title length
              excerpt,
              item.link,
              imageUrl,
              item.creator || item.author || null,
              item.pubDate ? new Date(item.pubDate).toISOString() : null,
            ],
          );

          // Auto-tag the article
          const tags = extractTags(item.title, contentSnippet);
          for (const tagTitle of tags) {
            try {
              // Get or create tag
              let tagId: number;
              const { rows: existingTags } = await client.query(
                `SELECT id FROM "Tag" WHERE title = $1`,
                [tagTitle],
              );

              if (existingTags.length > 0) {
                tagId = existingTags[0].id;
              } else {
                const { rows: newTags } = await client.query(
                  `INSERT INTO "Tag" (title, "createdAt") VALUES ($1, NOW()) RETURNING id`,
                  [tagTitle],
                );
                tagId = newTags[0].id;
              }

              // Link tag to article
              await client.query(
                `INSERT INTO "AggregatedArticleTag" ("articleId", "tagId")
                 VALUES ($1, $2) ON CONFLICT DO NOTHING`,
                [newArticle.id, tagId],
              );
            } catch (tagError) {
              // Log but don't fail if tagging fails
              console.warn(`Failed to add tag "${tagTitle}":`, tagError);
            }
          }

          newArticles++;
        }

        // Update source status - success
        await client.query(
          `UPDATE "FeedSource"
           SET "lastFetchedAt" = NOW(),
               "lastSuccessAt" = NOW(),
               "errorCount" = 0,
               "lastError" = NULL,
               "updatedAt" = NOW()
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
          `UPDATE "FeedSource"
           SET "lastFetchedAt" = NOW(),
               "errorCount" = "errorCount" + 1,
               "lastError" = $1,
               "status" = CASE WHEN "errorCount" >= 5 THEN 'ERROR' ELSE status END,
               "updatedAt" = NOW()
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
