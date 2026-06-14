/**
 * One-off scrub for image URLs that an upstream feed prefixed with its own
 * origin, leaving a doubled-up, 404ing URL — e.g. HackerNoon's media:thumbnail:
 *   https://hackernoon.com/https://cdn.hackernoon.com/images/x.png
 *
 * The card now unwraps these at render, so this only cleans the stored data
 * (used by server-side OG/SEO tags). Safe to re-run — it's idempotent.
 *
 * Usage: npx tsx scripts/fix-doubled-image-urls.ts
 */

import { db } from "../server/db";
import { posts, aggregated_article } from "../server/db/schema";
import { eq, like, or } from "drizzle-orm";
import { ensureHttps, unwrapDoubledUrl } from "../utils/url";

// Matches a scheme that appears AFTER the first character — i.e. a second
// embedded "http(s)://" further along the string. Cheap pre-filter; the real
// decision is made by unwrapDoubledUrl per row.
const DOUBLED = "%://http%://%";

async function fixPosts() {
  const rows = await db
    .select({ id: posts.id, coverImage: posts.coverImage })
    .from(posts)
    .where(like(posts.coverImage, DOUBLED));

  let fixed = 0;
  for (const row of rows) {
    const cleaned = ensureHttps(unwrapDoubledUrl(row.coverImage));
    if (cleaned !== row.coverImage) {
      await db
        .update(posts)
        .set({ coverImage: cleaned })
        .where(eq(posts.id, row.id));
      fixed++;
    }
  }
  console.log(`posts.coverImage: ${fixed}/${rows.length} fixed`);
}

async function fixAggregatedArticles() {
  const rows = await db
    .select({
      id: aggregated_article.id,
      imageUrl: aggregated_article.imageUrl,
      ogImageUrl: aggregated_article.ogImageUrl,
    })
    .from(aggregated_article)
    .where(
      or(
        like(aggregated_article.imageUrl, DOUBLED),
        like(aggregated_article.ogImageUrl, DOUBLED),
      ),
    );

  let fixed = 0;
  for (const row of rows) {
    const imageUrl = ensureHttps(unwrapDoubledUrl(row.imageUrl));
    const ogImageUrl = ensureHttps(unwrapDoubledUrl(row.ogImageUrl));
    if (imageUrl !== row.imageUrl || ogImageUrl !== row.ogImageUrl) {
      await db
        .update(aggregated_article)
        .set({ imageUrl, ogImageUrl })
        .where(eq(aggregated_article.id, row.id));
      fixed++;
    }
  }
  console.log(`aggregated_article: ${fixed}/${rows.length} fixed`);
}

async function main() {
  console.log("=== Scrubbing doubled image URLs ===");
  await fixPosts();
  await fixAggregatedArticles();
  console.log("Done.");
  process.exit(0);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
