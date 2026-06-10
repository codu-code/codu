import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import { isNull, eq } from "drizzle-orm";
import postgres from "postgres";
import { posts } from "../server/db/schema";
import { mintUrlId } from "../server/lib/url-id";

/**
 * Derive a candidate urlId from an existing slug. Our slugs end in a short
 * hex segment minted by `crypto.randomBytes(3).toString("hex")`
 * (e.g. "why-rag-a1b2c3"). Returns the trailing hex token, or null when the
 * slug has no such suffix.
 */
export function deriveUrlIdFromSlug(slug: string): string | null {
  const match = slug.match(/-([0-9a-f]{4,})$/);
  return match ? match[1] : null;
}

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

const main = async () => {
  const client = postgres(DATABASE_URL, { max: 1 });
  const db = drizzle(client);

  console.log("Backfilling posts.url_id...");

  // Track url_ids already in use so we never mint/derive a collision.
  const used = new Set<string>();
  const existing = await db.select({ urlId: posts.urlId }).from(posts);
  for (const row of existing) {
    if (row.urlId) used.add(row.urlId);
  }

  const rows = await db
    .select({ id: posts.id, slug: posts.slug })
    .from(posts)
    .where(isNull(posts.urlId));

  let updated = 0;
  for (const row of rows) {
    const derived = deriveUrlIdFromSlug(row.slug);
    let urlId = derived && !used.has(derived) ? derived : mintUrlId();
    while (used.has(urlId)) {
      urlId = mintUrlId();
    }
    used.add(urlId);

    await db.update(posts).set({ urlId }).where(eq(posts.id, row.id));
    updated += 1;
  }

  console.log(`Backfill complete. Updated ${updated} row(s).`);
  await client.end();
};

// Only run when executed directly, not when imported by tests.
if (process.argv[1] && process.argv[1].endsWith("backfill-url-id.ts")) {
  main();
}
