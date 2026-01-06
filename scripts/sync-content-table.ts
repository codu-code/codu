/**
 * Sync Content Table
 *
 * This script populates the unified content table from:
 * - post table (as ARTICLE type)
 * - aggregated_article table (as LINK type)
 *
 * Run with: npx tsx scripts/sync-content-table.ts
 */

import { db } from "@/server/db";
import {
  content,
  post,
  aggregated_article,
  user,
  feed_source,
} from "@/server/db/schema";
import { eq, isNotNull, sql } from "drizzle-orm";
import crypto from "crypto";

// Track used slugs to avoid conflicts
const usedSlugs = new Set<string>();

// Estimate read time based on excerpt/title
// Average reading speed: 200-250 words/minute
// Excerpt is usually 10-20% of article, so we estimate full article length
function estimateReadTime(title: string, excerpt: string | null): number {
  const text = `${title} ${excerpt || ""}`;
  const wordCount = text.split(/\s+/).filter(Boolean).length;

  // Excerpt is typically ~200 words, full article is ~5x longer on average
  const estimatedArticleWords = wordCount * 5;

  // Reading speed: ~225 words per minute
  const readTimeMinutes = Math.ceil(estimatedArticleWords / 225);

  // Clamp between 2 and 15 minutes (reasonable range for most articles)
  return Math.max(2, Math.min(15, readTimeMinutes));
}

// Generate a unique slug by adding a suffix if needed
async function getUniqueSlug(
  baseSlug: string,
  contentId: string,
): Promise<string> {
  let slug = baseSlug;
  let suffix = 1;

  while (true) {
    // Check if slug is already used in this sync run
    if (!usedSlugs.has(slug)) {
      // Check if slug exists in database with a different ID
      const existing = await db
        .select({ id: content.id })
        .from(content)
        .where(eq(content.slug, slug))
        .limit(1);

      if (existing.length === 0 || existing[0].id === contentId) {
        usedSlugs.add(slug);
        return slug;
      }
    }

    // Try with suffix
    slug = `${baseSlug}-${suffix}`;
    suffix++;

    // Safety limit
    if (suffix > 100) {
      // Use UUID suffix as fallback
      slug = `${baseSlug}-${crypto.randomUUID().slice(0, 8)}`;
      usedSlugs.add(slug);
      return slug;
    }
  }
}

async function syncPostsToContent() {
  console.log("Syncing published posts to content table as ARTICLE type...");

  // Get all published posts with their authors
  const posts = await db
    .select({
      id: post.id,
      title: post.title,
      body: post.body,
      excerpt: post.excerpt,
      userId: post.userId,
      slug: post.slug,
      canonicalUrl: post.canonicalUrl,
      coverImage: post.coverImage,
      readTimeMins: post.readTimeMins,
      published: post.published,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      showComments: post.showComments,
      upvotes: post.upvotes,
      downvotes: post.downvotes,
    })
    .from(post)
    .where(isNotNull(post.published));

  console.log(`Found ${posts.length} published posts to sync`);

  let synced = 0;
  let errors = 0;

  for (const p of posts) {
    try {
      // Check if this post already exists in content table
      const existing = await db
        .select({ id: content.id })
        .from(content)
        .where(eq(content.id, p.id))
        .limit(1);

      // Get unique slug for this post
      const uniqueSlug = await getUniqueSlug(p.slug, p.id);

      if (existing.length > 0) {
        // Update existing content
        await db
          .update(content)
          .set({
            type: "POST",
            title: p.title,
            body: p.body,
            excerpt: p.excerpt,
            userId: p.userId,
            slug: uniqueSlug,
            canonicalUrl: p.canonicalUrl,
            coverImage: p.coverImage,
            readTimeMins: p.readTimeMins,
            published: true,
            publishedAt: p.published,
            showComments: p.showComments,
            upvotes: p.upvotes,
            downvotes: p.downvotes,
            updatedAt: p.updatedAt,
          })
          .where(eq(content.id, p.id));
      } else {
        // Insert new content
        await db.insert(content).values({
          id: p.id, // Keep the same ID for referential integrity
          type: "POST",
          title: p.title,
          body: p.body,
          excerpt: p.excerpt,
          userId: p.userId,
          slug: uniqueSlug,
          canonicalUrl: p.canonicalUrl,
          coverImage: p.coverImage,
          readTimeMins: p.readTimeMins,
          published: true,
          publishedAt: p.published,
          showComments: p.showComments,
          upvotes: p.upvotes,
          downvotes: p.downvotes,
          createdAt: p.createdAt,
          updatedAt: p.updatedAt,
        });
      }
      synced++;
    } catch (error) {
      console.error(`Error syncing post ${p.id}:`, error);
      errors++;
    }
  }

  console.log(`Synced ${synced} posts, ${errors} errors`);
  return { synced, errors };
}

async function syncAggregatedArticlesToContent() {
  console.log("Syncing aggregated articles to content table as LINK type...");

  // Get all aggregated articles with their source info
  const articles = await db
    .select({
      id: aggregated_article.id,
      shortId: aggregated_article.shortId,
      title: aggregated_article.title,
      excerpt: aggregated_article.excerpt,
      externalUrl: aggregated_article.externalUrl,
      imageUrl: aggregated_article.imageUrl,
      ogImageUrl: aggregated_article.ogImageUrl,
      sourceAuthor: aggregated_article.sourceAuthor,
      slug: aggregated_article.slug,
      sourceId: aggregated_article.sourceId,
      publishedAt: aggregated_article.publishedAt,
      upvotes: aggregated_article.upvotes,
      downvotes: aggregated_article.downvotes,
      clickCount: aggregated_article.clickCount,
      createdAt: aggregated_article.createdAt,
    })
    .from(aggregated_article);

  console.log(`Found ${articles.length} aggregated articles to sync`);

  let synced = 0;
  let errors = 0;

  for (const a of articles) {
    try {
      // Generate a unique content ID from the aggregated article ID
      // Using a deterministic ID so we can update on re-runs
      const contentId = `link-${a.id}`;

      // Check if already exists
      const existing = await db
        .select({ id: content.id })
        .from(content)
        .where(eq(content.id, contentId))
        .limit(1);

      // Get unique slug for this article
      const baseSlug = a.slug || a.shortId || `link-${a.id}`;
      const uniqueSlug = await getUniqueSlug(baseSlug, contentId);

      // Estimate read time for the external article
      const readTimeMins = estimateReadTime(a.title, a.excerpt);

      if (existing.length > 0) {
        // Update existing
        await db
          .update(content)
          .set({
            type: "LINK",
            title: a.title,
            excerpt: a.excerpt,
            externalUrl: a.externalUrl,
            imageUrl: a.imageUrl,
            ogImageUrl: a.ogImageUrl,
            sourceAuthor: a.sourceAuthor,
            slug: uniqueSlug,
            sourceId: a.sourceId,
            published: true,
            publishedAt: a.publishedAt,
            upvotes: a.upvotes,
            downvotes: a.downvotes,
            clickCount: a.clickCount,
            readTimeMins,
          })
          .where(eq(content.id, contentId));
      } else {
        // Insert new
        await db.insert(content).values({
          id: contentId,
          type: "LINK",
          title: a.title,
          excerpt: a.excerpt,
          externalUrl: a.externalUrl,
          imageUrl: a.imageUrl,
          ogImageUrl: a.ogImageUrl,
          sourceAuthor: a.sourceAuthor,
          slug: uniqueSlug,
          sourceId: a.sourceId,
          published: true,
          publishedAt: a.publishedAt,
          upvotes: a.upvotes,
          downvotes: a.downvotes,
          clickCount: a.clickCount,
          readTimeMins,
          createdAt: a.createdAt,
          showComments: true,
        });
      }
      synced++;
    } catch (error) {
      console.error(`Error syncing aggregated article ${a.id}:`, error);
      errors++;
    }
  }

  console.log(`Synced ${synced} aggregated articles, ${errors} errors`);
  return { synced, errors };
}

async function getContentStats() {
  const stats = await db
    .select({
      type: content.type,
      count: sql<number>`count(*)::int`,
    })
    .from(content)
    .where(eq(content.published, true))
    .groupBy(content.type);

  console.log("\nContent table stats:");
  for (const stat of stats) {
    console.log(`  ${stat.type}: ${stat.count} items`);
  }

  const total = stats.reduce((sum, s) => sum + s.count, 0);
  console.log(`  TOTAL: ${total} items`);
}

async function main() {
  console.log("=== Content Table Sync Script ===\n");

  try {
    // Sync posts first (ARTICLE type)
    const postResult = await syncPostsToContent();

    console.log("");

    // Sync aggregated articles (LINK type)
    const articleResult = await syncAggregatedArticlesToContent();

    console.log("\n=== Summary ===");
    console.log(
      `Posts synced: ${postResult.synced} (${postResult.errors} errors)`,
    );
    console.log(
      `Articles synced: ${articleResult.synced} (${articleResult.errors} errors)`,
    );

    // Show final stats
    await getContentStats();

    console.log("\n=== Sync Complete ===");
    process.exit(0);
  } catch (error) {
    console.error("Fatal error during sync:", error);
    process.exit(1);
  }
}

main();
