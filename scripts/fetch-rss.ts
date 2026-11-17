/**
 * Local script to fetch RSS feeds and populate the posts table directly.
 * Use this for testing without running the Lambda cron.
 *
 * Prerequisites: Run create-source-users.ts first to ensure all sources have linked users.
 *
 * Usage: npx tsx scripts/fetch-rss.ts
 */

import { db } from "../server/db";
import { ingestActiveSources } from "../server/lib/rssIngest";

async function main() {
  console.log("=== RSS Feed Fetcher (Direct to Posts) ===\n");

  const results = await ingestActiveSources(db);

  for (const result of results) {
    console.log(
      result.error
        ? `${result.sourceName}: failed (${result.error})`
        : `${result.sourceName}: added ${result.added}, skipped ${result.skipped}`,
    );
  }

  const failed = results.filter((result) => result.error);

  console.log("\n=== Summary ===");
  console.log(
    `Sources processed: ${results.length - failed.length}/${results.length}`,
  );
  console.log(`Failed: ${failed.length}`);
  console.log(
    `New articles added: ${results.reduce((sum, result) => sum + result.added, 0)}`,
  );

  process.exit(0);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
