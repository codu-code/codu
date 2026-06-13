import { test, expect } from "@playwright/test";
import {
  createArticle,
  banUserInDb,
  unbanUserInDb,
  clearBanForUser,
  deletePostBySlug,
  getPostStatusBySlug,
} from "./utils";
import { E2E_USER_ONE_ID } from "./constants";

// Phase 9.1 — Account-block regression.
//
// When an admin bans a user, every published post by that user must disappear
// from the public site: the detail page 404s and the post drops out of the
// feed. Unbanning restores it. This exercises admin.ban / admin.unban AND the
// `banned_users` join the feed query uses for defence-in-depth.
//
// State is set up directly in the DB (mirroring exactly what admin.ban does)
// so the test is deterministic and self-cleaning regardless of test order.

const SLUG = "e2e-account-block-post";
const TITLE = "Account Block Regression Post";
const AUTHOR_USERNAME = "e2e-test-user-one-111";
const DETAIL_URL = `http://localhost:3000/${AUTHOR_USERNAME}/${SLUG}`;

test.describe("Account-block regression", () => {
  test.beforeEach(async () => {
    // Clean slate: no lingering ban, no stale post.
    await clearBanForUser(E2E_USER_ONE_ID);
    await deletePostBySlug(SLUG);
    await createArticle({
      title: TITLE,
      slug: SLUG,
      excerpt: "A published post whose author gets banned.",
      body: "This post should vanish from the public site once its author is banned.",
      status: "published",
      authorId: E2E_USER_ONE_ID,
    });
  });

  test.afterEach(async () => {
    await clearBanForUser(E2E_USER_ONE_ID);
    await deletePostBySlug(SLUG);
  });

  test("banning the author hides the post; unbanning restores it", async ({
    page,
  }) => {
    // Pre-condition: the post is publicly visible at its detail URL.
    await page.goto(DETAIL_URL);
    await expect(page.getByRole("heading", { name: TITLE })).toBeVisible({
      timeout: 15000,
    });

    // Ban the author (admin.ban flips their published posts to draft).
    await banUserInDb(E2E_USER_ONE_ID);

    // The ban moved the post to `draft`, so the public detail query 404s.
    const banned = await getPostStatusBySlug(SLUG);
    expect(banned?.status).toBe("draft");

    const afterBan = await page.goto(DETAIL_URL);
    expect(afterBan?.status()).toBe(404);

    // And it is absent from the public feed.
    await page.goto("http://localhost:3000/");
    await page.waitForSelector("article");
    await expect(page.getByRole("heading", { name: TITLE })).toHaveCount(0);

    // Unban (admin.unban restores previously-published posts: draft +
    // publishedAt set → published).
    await unbanUserInDb(E2E_USER_ONE_ID);
    const restored = await getPostStatusBySlug(SLUG);
    expect(restored?.status).toBe("published");

    // The detail page is reachable again.
    const afterUnban = await page.goto(DETAIL_URL);
    expect(afterUnban?.status()).toBe(200);
    await expect(page.getByRole("heading", { name: TITLE })).toBeVisible({
      timeout: 15000,
    });
  });
});
