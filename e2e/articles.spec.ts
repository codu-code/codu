import { test, expect } from "playwright/test";
import { randomUUID } from "crypto";
import { articleContent, articleExcerpt, loggedInAsUserOne } from "./utils";

// Post-relaunch: the feed is the homepage at "/". The old /articles and
// /feed?type=article routes 308-redirect to "/?type=article". Basic feed
// display / filtering / sorting / bookmark-button presence is covered by
// e2e/feed.spec.ts, so the tests here focus on what's unique to articles:
// article-detail navigation, commenting, and the write+publish flow.
const PUBLISHED_ARTICLE_URL =
  "http://localhost:3000/e2e-test-user-one-111/e2e-test-slug-published";

test.describe("Unauthenticated Article Detail", () => {
  test("Should be able to navigate directly to an article via user profile URL", async ({
    page,
  }) => {
    // URL pattern: /[username]/[slug]
    await page.goto(PUBLISHED_ARTICLE_URL);
    await expect(page.getByText(articleExcerpt)).toBeVisible();
    // Article title is shown in the content
    await expect(
      page.getByRole("heading", { name: "Published Article" }),
    ).toBeVisible();
    // Author name is shown in the metadata/breadcrumb (appears multiple times)
    await expect(
      page.getByRole("link", { name: "E2E Test User One" }).first(),
    ).toBeVisible();
    // Action bar Upvote control (multiple on page: reader + comments)
    await expect(page.getByLabel("Upvote").first()).toBeVisible({
      timeout: 15000,
    });
    // Bookmark button reads "Save" (or "Saved") in the reader action bar.
    // exact: true so "Save" doesn't also match "Saved".
    await expect(
      page
        .getByRole("button", { name: "Save", exact: true })
        .or(page.getByRole("button", { name: "Saved", exact: true })),
    ).toBeVisible();
  });

  test("Should not be able to post a comment on an article", async ({
    page,
  }) => {
    await page.goto(PUBLISHED_ARTICLE_URL);

    // The reader has no "Discussion N" heading. Wait for the discussion area
    // to hydrate via the signed-out sign-in prompt.
    await expect(page.getByText("Got something to say?")).toBeVisible({
      timeout: 15000,
    });

    // The composer trigger button is not shown when signed out
    await expect(
      page.getByRole("button", { name: "Add to the discussion…" }),
    ).toBeHidden();

    await expect(page.getByText("to join the conversation.")).toBeVisible();
  });
});

test.describe("Authenticated Article Flows", () => {
  test.beforeEach(async ({ page }) => {
    await loggedInAsUserOne(page);
  });

  test("Should write and publish an article", async ({ page, isMobile }) => {
    test.slow();
    const articleTitle = "Lorem Ipsum";
    await page.goto("http://localhost:3000");
    // Waits for the feed to load
    await page.waitForSelector("article");

    // Desktop: Create is a top-bar button that opens the compose modal. The
    // Article tab hands off to the full editor at /create. Mobile: the modal
    // path is awkward, so navigate to the editor directly.
    if (isMobile) {
      await page.goto("http://localhost:3000/create");
    } else {
      await page.getByRole("button", { name: "Create" }).click();

      // First-use dos-&-don'ts gate (localStorage). Acknowledge if shown.
      const gateButton = page.getByRole("button", {
        name: /Got it/,
      });
      if (await gateButton.isVisible().catch(() => false)) {
        await gateButton.click();
      }

      // Compose dialog → Article tab → open the editor.
      const dialog = page.getByRole("dialog", { name: "Create a post" });
      await expect(dialog).toBeVisible({ timeout: 10000 });
      await dialog.getByRole("button", { name: "Article" }).click();
      await dialog.getByRole("button", { name: "Open the editor" }).click();
    }
    await page.waitForURL("http://localhost:3000/create");

    await page.getByPlaceholder("Article title").fill(articleTitle);

    // Fill in the editor content - use keyboard.type() for TipTap
    const editor = page.locator(".ProseMirror");
    await editor.click();
    await page.keyboard.type(articleContent);

    // Wait for auto-save to complete - URL should update with post ID
    await page.waitForURL(/.*create\/[a-z0-9]+/, { timeout: 20000 });

    // Click the Publish button in the editor navigation
    const navPublishButton = page
      .getByLabel("Editor navigation")
      .getByRole("button", { name: "Publish" });
    await expect(navPublishButton).toBeEnabled({ timeout: 5000 });
    await navPublishButton.click();

    // Confirm in the modal ("Let's do this!" for articles)
    await expect(
      page.getByRole("button", { name: "Let's do this!" }),
    ).toBeVisible({ timeout: 10000 });
    await page.getByRole("button", { name: "Let's do this!" }).click();

    // The e2e env runs with the auto-moderation gate ON
    // (MODERATION_ENABLED=true), so a freshly published draft is routed to
    // `in_review` and the author is sent to their drafts. When the gate is
    // OFF the post goes live at /[username]/[slug]. Accept either terminal
    // state so the flow is exercised end-to-end regardless of env.
    await page.waitForURL(
      (url) =>
        /^\/e2e-test-user-one-111\/lorem-ipsum-/.test(url.pathname) ||
        url.pathname.startsWith("/my-posts"),
      { timeout: 20000 },
    );

    if (page.url().includes("/my-posts")) {
      // Moderation gate ON — post went to review.
      await expect(page).toHaveURL(/my-posts/);
    } else {
      // Moderation gate OFF — published article is shown.
      await expect(
        page.getByRole("heading", { name: "Lorem Ipsum" }),
      ).toBeVisible();
      await expect(
        page.getByRole("link", { name: "E2E Test User One" }).first(),
      ).toBeVisible();
      await expect(page.getByLabel("Upvote").first()).toBeVisible({
        timeout: 15000,
      });
      await expect(
        page.getByRole("button", { name: "Save", exact: true }),
      ).toBeVisible();
    }
  });

  test("Should post a comment on an article", async ({ page }, workerInfo) => {
    const commentContent = `This is a great read. Thanks for posting! Sent from ${workerInfo.project.name} + ${randomUUID()}`;
    await page.goto(PUBLISHED_ARTICLE_URL);

    // Wait for the discussion section to hydrate (no heading on this reader) —
    // the collapsed composer trigger is our anchor.
    await expect(
      page.getByRole("button", { name: "Add to the discussion…" }),
    ).toBeVisible({ timeout: 15000 });
    await page
      .getByRole("button", { name: "Add to the discussion…" })
      .click();

    // The expanded editor is a TipTap editor - click into it then type
    await page.waitForTimeout(500); // Wait for editor to expand
    await page.locator(".ProseMirror").first().click();
    await page.keyboard.type(commentContent);
    // exact: true to avoid matching "Comment options"
    await page.getByRole("button", { name: "Comment", exact: true }).click();

    await expect(page.getByText(commentContent)).toBeVisible();
  });

  test("Should be able reply to a comment", async ({ page }) => {
    await page.goto(PUBLISHED_ARTICLE_URL);

    await expect(page.getByText(articleExcerpt)).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Published Article" }),
    ).toBeVisible();
    // Wait for the discussion to hydrate — the seed comment's Reply button
    // is our anchor.
    await expect(
      page.getByRole("button", { name: "Reply" }).first(),
    ).toBeVisible({ timeout: 15000 });

    // Click reply on the first comment
    await page.getByRole("button", { name: "Reply" }).first().click();

    // Wait for the reply editor to expand
    await page.waitForTimeout(500);
    await page.locator(".ProseMirror").last().click();
    const replyText = `Test reply ${Date.now()}`;
    await page.keyboard.type(replyText);

    // Submit the reply
    await page
      .getByRole("button", { name: "Reply", exact: true })
      .nth(1)
      .click();

    // Reply text should appear
    await expect(page.getByText(replyText)).toBeVisible({ timeout: 15000 });
  });

  test("Should show vote buttons on article detail", async ({ page }) => {
    await page.goto(PUBLISHED_ARTICLE_URL);

    // Wait for the article action bar to load (multiple Upvote controls)
    await expect(page.getByLabel("Upvote").first()).toBeVisible({
      timeout: 15000,
    });

    // Should be able to interact with the vote button
    await page.getByLabel("Upvote").first().click();
    await expect(page.getByLabel("Upvote").first()).toBeVisible();
  });

  test("Should be able to bookmark an article", async ({ page }) => {
    await page.goto(PUBLISHED_ARTICLE_URL);
    await page.waitForLoadState("domcontentloaded");

    // Reader action bar bookmark button toggles between "Save" and "Saved".
    // Another parallel test may have already saved it, so handle both states.
    const saveButton = page.getByRole("button", { name: "Save", exact: true });
    const savedButton = page.getByRole("button", {
      name: "Saved",
      exact: true,
    });

    const isSaved = await savedButton.isVisible().catch(() => false);

    if (isSaved) {
      // Already bookmarked - unbookmark then rebookmark to test the flow
      await savedButton.scrollIntoViewIfNeeded();
      await Promise.all([
        page.waitForResponse(
          (resp) =>
            resp.url().includes("trpc") && resp.url().includes("bookmark"),
        ),
        savedButton.click(),
      ]);
      await expect(saveButton).toBeVisible({ timeout: 15000 });
    }

    // Now bookmark the article
    await expect(saveButton).toBeVisible({ timeout: 15000 });
    await expect(saveButton).toBeEnabled({ timeout: 5000 });
    await saveButton.scrollIntoViewIfNeeded();
    await Promise.all([
      page.waitForResponse(
        (resp) =>
          resp.url().includes("trpc") && resp.url().includes("bookmark"),
      ),
      saveButton.click(),
    ]);

    // Button text should change to "Saved"
    await expect(savedButton).toBeVisible({ timeout: 30000 });
  });
});
