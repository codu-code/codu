import postgres from "postgres";
import {
  E2E_USER_ONE_ID,
  E2E_USER_TWO_ID,
  E2E_ROUTING_SOURCE_SLUG,
} from "./constants";

export const teardown = async () => {
  try {
    const db = postgres("postgresql://postgres:secret@127.0.0.1:5432/postgres");

    // Relaunch content lives in the new `posts` / `comments` tables (author_id),
    // not the legacy "Post" / "Comment" tables (userId). Clean both so reruns
    // start fresh. Comments first (FK to posts), then posts.
    await db`
      DELETE FROM "comments" WHERE "author_id" IN(${E2E_USER_ONE_ID}, ${E2E_USER_TWO_ID})
    `;
    await db`
      DELETE FROM "posts" WHERE "author_id" IN(${E2E_USER_ONE_ID}, ${E2E_USER_TWO_ID})
    `;

    // The routing fixtures (e2e/setup.ts) create a deterministic feed source.
    // feed_sources.userId is ON DELETE SET NULL, so it survives the user delete
    // below — remove it (and any aggregated post still pointing at it) by slug.
    await db`
      DELETE FROM "posts" WHERE "source_id" IN (
        SELECT "id" FROM "feed_sources" WHERE "slug" = ${E2E_ROUTING_SOURCE_SLUG}
      )
    `;
    await db`
      DELETE FROM "feed_sources" WHERE "slug" = ${E2E_ROUTING_SOURCE_SLUG}
    `;

    await Promise.all([
      // Legacy tables — older suites seeded here; keep cleaning them.
      db`
    DELETE FROM "Post" WHERE "userId" IN(${E2E_USER_ONE_ID}, ${E2E_USER_TWO_ID})
  `,
      db`
    DELETE FROM "Comment" WHERE "userId" IN(${E2E_USER_ONE_ID}, ${E2E_USER_TWO_ID})
  `,
    ]);

    // Users last so any remaining cascade-on-delete rows go with them.
    await db`
    DELETE FROM "user" WHERE "id" IN(${E2E_USER_ONE_ID}, ${E2E_USER_TWO_ID})`;

    console.log("DB clean up successful");
  } catch (err) {
    console.log("Error while cleaning up DB after E2E test run", err);
  }
};

export default teardown;
