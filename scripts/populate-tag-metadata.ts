/**
 * Tag Metadata Population Script
 *
 * This script populates the new tag columns (slug, post_count) for existing tags.
 * It also calculates the actual post counts from the post_tags junction table.
 *
 * Run with: npx tsx scripts/populate-tag-metadata.ts
 * Dry run:  npx tsx scripts/populate-tag-metadata.ts --dry-run
 */

import { db } from "@/server/db";
import { tag, post_tags } from "@/server/db/schema";
import { eq, sql, isNull } from "drizzle-orm";

const isDryRun = process.argv.includes("--dry-run");

/**
 * Generate a URL-friendly slug from a tag title
 */
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function populateSlugs(): Promise<{ updated: number; skipped: number }> {
  console.log("Populating tag slugs...");

  // Get all tags without slugs
  const tagsWithoutSlugs = await db
    .select({
      id: tag.id,
      title: tag.title,
      slug: tag.slug,
    })
    .from(tag)
    .where(isNull(tag.slug));

  let updated = 0;
  let skipped = 0;

  for (const t of tagsWithoutSlugs) {
    const newSlug = generateSlug(t.title);

    if (!newSlug) {
      console.log(`  Skipping tag ${t.id} (${t.title}) - empty slug`);
      skipped++;
      continue;
    }

    // Check if slug already exists
    const existingSlug = await db
      .select({ id: tag.id })
      .from(tag)
      .where(eq(tag.slug, newSlug))
      .limit(1);

    if (existingSlug.length > 0) {
      // Add ID suffix for uniqueness
      const uniqueSlug = `${newSlug}-${t.id}`;
      console.log(
        `  Tag ${t.id} (${t.title}): slug "${newSlug}" exists, using "${uniqueSlug}"`,
      );

      if (!isDryRun) {
        await db.update(tag).set({ slug: uniqueSlug }).where(eq(tag.id, t.id));
      }
    } else {
      console.log(`  Tag ${t.id} (${t.title}): "${newSlug}"`);

      if (!isDryRun) {
        await db.update(tag).set({ slug: newSlug }).where(eq(tag.id, t.id));
      }
    }
    updated++;
  }

  return { updated, skipped };
}

async function populatePostCounts(): Promise<{
  updated: number;
  discrepancies: Array<{
    tagId: number;
    title: string;
    storedCount: number;
    actualCount: number;
  }>;
}> {
  console.log("\nCalculating post counts...");

  // Get actual post counts from post_tags table
  const actualCounts = await db
    .select({
      tagId: post_tags.tagId,
      count: sql<number>`COUNT(*)::int`,
    })
    .from(post_tags)
    .groupBy(post_tags.tagId);

  // Create a map for quick lookup
  const actualCountsMap = new Map(actualCounts.map((c) => [c.tagId, c.count]));

  // Get all tags with their current post counts
  const allTags = await db
    .select({
      id: tag.id,
      title: tag.title,
      postCount: tag.postCount,
    })
    .from(tag);

  const discrepancies: Array<{
    tagId: number;
    title: string;
    storedCount: number;
    actualCount: number;
  }> = [];
  let updated = 0;

  for (const t of allTags) {
    const actualCount = actualCountsMap.get(t.id) || 0;

    if (t.postCount !== actualCount) {
      discrepancies.push({
        tagId: t.id,
        title: t.title,
        storedCount: t.postCount,
        actualCount,
      });

      if (!isDryRun) {
        await db
          .update(tag)
          .set({ postCount: actualCount })
          .where(eq(tag.id, t.id));
        updated++;
      }
    }
  }

  return { updated, discrepancies };
}

async function main() {
  console.log("=== Tag Metadata Population ===");
  console.log(
    `Mode: ${isDryRun ? "DRY RUN (no changes will be made)" : "LIVE"}\n`,
  );

  try {
    // Populate slugs
    const slugResult = await populateSlugs();
    console.log(`\nSlugs populated: ${slugResult.updated}`);
    console.log(`Slugs skipped: ${slugResult.skipped}`);

    // Populate post counts
    const countResult = await populatePostCounts();
    console.log(
      `\nPost count discrepancies found: ${countResult.discrepancies.length}`,
    );

    if (countResult.discrepancies.length > 0) {
      console.log("Discrepancies:");
      for (const d of countResult.discrepancies.slice(0, 20)) {
        console.log(
          `  ${d.title}: stored(${d.storedCount}) vs actual(${d.actualCount})`,
        );
      }
      if (countResult.discrepancies.length > 20) {
        console.log(`  ... and ${countResult.discrepancies.length - 20} more`);
      }
    }

    // Summary
    console.log("\n=== Summary ===");
    console.log(`Tags with slugs populated: ${slugResult.updated}`);
    console.log(`Tags with post counts updated: ${countResult.updated}`);

    if (isDryRun) {
      console.log("\nRun without --dry-run to apply these changes.");
    }

    process.exit(0);
  } catch (error) {
    console.error("Error during population:", error);
    process.exit(1);
  }
}

main();
