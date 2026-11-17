/**
 * Create Users for Feed Sources Script
 *
 * This script creates user profiles for RSS feed sources that don't have one yet.
 * Each feed source needs a linked user to serve as the author for aggregated articles.
 *
 * Run with: npx tsx scripts/create-source-users.ts
 * Dry run:  npx tsx scripts/create-source-users.ts --dry-run
 */

import { db } from "@/server/db";
import { feed_sources } from "@/server/db/schema";
import { isNull } from "drizzle-orm";
import { buildSourceUsername, createSourceUser } from "@/server/lib/sourceUser";

const isDryRun = process.argv.includes("--dry-run");

interface SourceWithoutUser {
  id: number;
  name: string;
  slug: string | null;
  logoUrl: string | null;
  websiteUrl: string | null;
  description: string | null;
}

async function createSourceUsers(): Promise<{
  checked: number;
  created: number;
  sources: SourceWithoutUser[];
}> {
  console.log("Finding feed sources without user profiles...");

  // Get all feed sources without a linked user
  const sourcesWithoutUsers = await db
    .select({
      id: feed_sources.id,
      name: feed_sources.name,
      slug: feed_sources.slug,
      logoUrl: feed_sources.logoUrl,
      websiteUrl: feed_sources.websiteUrl,
      description: feed_sources.description,
    })
    .from(feed_sources)
    .where(isNull(feed_sources.userId));

  console.log(
    `Found ${sourcesWithoutUsers.length} sources without user profiles`,
  );

  let created = 0;

  for (const source of sourcesWithoutUsers) {
    const username = buildSourceUsername(source);

    console.log(`  Creating user for: ${source.name} (${username})`);

    if (!isDryRun) {
      try {
        const userId = await createSourceUser(db, source);

        created++;
        console.log(`    ✓ Created user ${userId} for source ${source.id}`);
      } catch (error) {
        console.error(`    ✗ Error creating user for ${source.name}:`, error);
      }
    } else {
      console.log(`    [DRY RUN] Would create user: ${username}`);
    }
  }

  return {
    checked: sourcesWithoutUsers.length,
    created,
    sources: sourcesWithoutUsers,
  };
}

async function main() {
  console.log("=".repeat(60));
  console.log("Feed Source User Creation Script");
  console.log(
    isDryRun ? "[DRY RUN MODE - No changes will be made]" : "[LIVE MODE]",
  );
  console.log("=".repeat(60));
  console.log();

  try {
    const result = await createSourceUsers();

    console.log();
    console.log("=".repeat(60));
    console.log("Summary:");
    console.log(`  Sources checked: ${result.checked}`);
    console.log(`  Users created: ${result.created}`);

    if (result.sources.length > 0) {
      console.log();
      console.log("Sources processed:");
      for (const source of result.sources) {
        console.log(`  - ${source.name} (ID: ${source.id})`);
      }
    }

    if (isDryRun && result.sources.length > 0) {
      console.log();
      console.log("Run without --dry-run to create these users.");
    }

    console.log("=".repeat(60));
  } catch (error) {
    console.error("Fatal error:", error);
    process.exit(1);
  }
}

main();
