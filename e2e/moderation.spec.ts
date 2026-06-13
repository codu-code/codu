import { test, expect } from "@playwright/test";
import {
  loggedInAsUserOne,
  loggedInAsUserTwo,
  loggedInAsAdmin,
  createArticle,
  createInReviewArticle,
  createPublishedLink,
  deletePostBySlug,
  getPostStatusBySlug,
} from "./utils";
import { E2E_USER_ONE_ID, E2E_USER_TWO_ID } from "./constants";

// Phases 10.1–10.3 — moderation gate, user flags, and link dedupe.
//
// IMPORTANT: these specs assume the E2E server runs with MODERATION_ENABLED
// (it is set to "true" in .env, which `next dev` / `dev:e2e` loads). Under ENV=E2E
// Bedrock is mocked (isBedrockMocked) so autoReview() falls back to the
// synchronous heuristic — no network call — and articles ALWAYS route to
// in_review regardless. Link dedupe (10.3) also only runs when moderation is
// enabled. If you run these against a server with moderation OFF they will
// (correctly) fail: see the spec header in articles.spec.ts and the report at
// the bottom of this PR for how to run them.

// --------------------------------------------------------------------------
// Phase 10.1 — Publish → in_review
// --------------------------------------------------------------------------
test.describe("Moderation gate: publish routes articles to in_review", () => {
  // Each test owns a distinct slug so the two can run in parallel workers
  // without one's cleanup deleting the other's seeded post.
  const FEED_SLUG = "e2e-in-review-feed";
  const FEED_TITLE = "E2E In-Review Feed Article";
  const BADGE_SLUG = "e2e-in-review-badge";
  const BADGE_TITLE = "E2E In-Review Badge Article";

  test("an in_review article is hidden from the public feed", async ({
    page,
  }) => {
    await deletePostBySlug(FEED_SLUG);
    await createInReviewArticle({
      title: FEED_TITLE,
      slug: FEED_SLUG,
      authorId: E2E_USER_ONE_ID,
    });
    try {
      await page.goto("http://localhost:3000/?type=article");
      await page.waitForSelector("article");
      // The post is in_review (not published) so it must never appear publicly.
      await expect(page.getByRole("heading", { name: FEED_TITLE })).toHaveCount(
        0,
      );
    } finally {
      await deletePostBySlug(FEED_SLUG);
    }
  });

  test("the author sees it in /my-posts Drafts with an In review badge", async ({
    page,
  }) => {
    await deletePostBySlug(BADGE_SLUG);
    await createInReviewArticle({
      title: BADGE_TITLE,
      slug: BADGE_SLUG,
      authorId: E2E_USER_ONE_ID,
    });
    try {
      await loggedInAsUserOne(page);
      // Drafts is the default tab; it surfaces draft + in_review + rejected.
      // Navigate straight to it so the assertion doesn't race a tab click.
      await page.goto("http://localhost:3000/my-posts?tab=drafts");
      await page.waitForLoadState("domcontentloaded");

      // Wait for the drafts query to finish loading (mirrors my-posts.spec.ts).
      await expect(page.getByText("Fetching your posts...")).toBeHidden({
        timeout: 25000,
      });

      // The in_review article is listed with its "In review" badge.
      const article = page.locator(`article:has-text("${BADGE_TITLE}")`);
      await expect(article).toBeVisible({ timeout: 25000 });
      await expect(article.getByText("In review")).toBeVisible();
    } finally {
      await deletePostBySlug(BADGE_SLUG);
    }
  });
});

// --------------------------------------------------------------------------
// Phase 10.2 — Flag → admin queue → decline (hide) → hidden from public
// --------------------------------------------------------------------------
test.describe("Moderation: flag a live post, hide it from the queue", () => {
  const SLUG = "e2e-reported-live-post";
  const TITLE = "E2E Reported Live Post";
  // Authored by user two so this spec stays isolated from account-block.spec
  // (which bans user one and would otherwise draft this post out of the queue).
  const AUTHOR_TWO_USERNAME = "e2e-test-user-two-222";
  const DETAIL_URL = `http://localhost:3000/${AUTHOR_TWO_USERNAME}/${SLUG}`;

  test.beforeEach(async () => {
    await deletePostBySlug(SLUG);
    await createArticle({
      title: TITLE,
      slug: SLUG,
      excerpt: "A live post that gets flagged.",
      body: "This published post will be reported by a user and then hidden by a moderator.",
      status: "published",
      authorId: E2E_USER_TWO_ID,
    });
  });

  test.afterEach(async () => {
    await deletePostBySlug(SLUG);
  });

  test("a flagged live post appears in the queue, hide removes it from public, author keeps owner view", async ({
    page,
  }) => {
    // User one flags user two's published post via the report modal URL.
    // The ReportModal reads ?report=post_<id> and the post flag is stored as a
    // PENDING content_report (report.create). We open the modal in the UI and
    // submit it to exercise the real flow.
    const seeded = await getPostStatusBySlug(SLUG);
    expect(seeded?.status).toBe("published");
    const postId = seeded!.id;

    await loggedInAsUserOne(page);
    await page.goto(`${DETAIL_URL}?report=post_${postId}`);

    // The report dialog opens from the URL param. Its title is "Report article".
    const reportDialog = page.getByRole("dialog");
    await expect(
      reportDialog.getByRole("heading", { name: /^Report / }),
    ).toBeVisible({ timeout: 15000 });
    await reportDialog
      .getByPlaceholder("Describe the issue...")
      .fill("E2E: spammy off-topic content");
    await reportDialog.getByRole("button", { name: "Submit Report" }).click();
    await expect(page.getByText("Report submitted successfully")).toBeVisible({
      timeout: 15000,
    });

    // Admin sees it in the moderation queue's "reported (live)" section.
    await loggedInAsAdmin(page);
    await page.goto("http://localhost:3000/admin/moderation");

    const reportedSection = page
      .locator("section")
      .filter({ hasText: "reported (live)" });
    await expect(reportedSection).toBeVisible({ timeout: 15000 });
    const card = reportedSection.locator("div").filter({ hasText: TITLE });
    await expect(card.first()).toBeVisible({ timeout: 15000 });

    // Admin hides the post (published → in_review, reports resolved).
    await reportedSection.getByRole("button", { name: "Hide" }).first().click();
    await expect(page.getByText("Post hidden and moved to review")).toBeVisible(
      { timeout: 15000 },
    );

    // The post is no longer public: detail page 404s for a signed-out viewer.
    const hidden = await getPostStatusBySlug(SLUG);
    expect(hidden?.status).toBe("in_review");

    await page.context().clearCookies();
    const publicView = await page.goto(DETAIL_URL);
    expect(publicView?.status()).toBe(404);

    // The author (user two) still sees it (owner bypass) with the "Awaiting
    // review" banner.
    await loggedInAsUserTwo(page);
    await page.goto(DETAIL_URL);
    await expect(page.getByText("Awaiting review")).toBeVisible({
      timeout: 15000,
    });
    await expect(page.getByRole("heading", { name: TITLE })).toBeVisible();
  });
});

// --------------------------------------------------------------------------
// Phase 10.3 — Link dedupe
// --------------------------------------------------------------------------
test.describe("Moderation: link dedupe rejects a fresh repost", () => {
  // A unique URL per worker run avoids colliding with the seeded e2e links.
  const FIRST_SLUG = "e2e-dedupe-first-link";
  const SHARED_URL = "https://example.com/e2e-dedupe-target-article";

  test.beforeEach(async () => {
    await deletePostBySlug(FIRST_SLUG);
    // Pre-condition: an already-published link with this normalized URL.
    await createPublishedLink({
      title: "E2E Dedupe First Link",
      slug: FIRST_SLUG,
      externalUrl: SHARED_URL,
      authorId: E2E_USER_TWO_ID,
    });
  });

  test.afterEach(async () => {
    await deletePostBySlug(FIRST_SLUG);
  });

  test("re-sharing the same link is rejected with the already-shared message", async ({
    page,
  }) => {
    await loggedInAsUserOne(page);
    await page.goto("http://localhost:3000/");
    await page.waitForSelector("article");

    // Open the compose modal → Link tab. (Desktop opens via the top-bar
    // "Create" button; mobile uses the same modal once Create is tapped.)
    await page.getByRole("button", { name: "Create" }).click();

    // First-use dos-&-don'ts gate (localStorage). Acknowledge if shown.
    const gateButton = page.getByRole("button", { name: /Got it/ });
    if (await gateButton.isVisible().catch(() => false)) {
      await gateButton.click();
    }

    const dialog = page.getByRole("dialog", { name: "Create a post" });
    await expect(dialog).toBeVisible({ timeout: 10000 });
    await dialog.getByRole("button", { name: "Link" }).click();

    // Title + the duplicate URL.
    await dialog
      .getByPlaceholder(/Title — what should people know/)
      .fill("Trying to repost the same link");
    await dialog.getByPlaceholder("https://…").fill(SHARED_URL);

    // Post → server runs runDedupeAndGate → findFreshDuplicateLink → CONFLICT.
    const postButton = dialog.getByRole("button", { name: "Post" });
    await expect(postButton).toBeEnabled({ timeout: 10000 });
    await postButton.click();

    // The CONFLICT message is surfaced via a toast (ComposeModal onError).
    await expect(
      page.getByText(/already shared on Codú recently/i),
    ).toBeVisible({ timeout: 15000 });
  });
});
