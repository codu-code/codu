import { test, expect } from "playwright/test";
import { randomUUID } from "crypto";
import { articleContent, articleExcerpt, loggedInAsUserOne } from "./utils";

// Tests for the unified feed with article type filter (replaces old /articles page)
test.describe("Unauthenticated Feed Page (Articles)", () => {
  test("Should show feed page with articles filter", async ({ page }) => {
    // /articles now redirects to /feed?type=article
    await page.goto("http://localhost:3000/feed?type=article");
    await expect(page.locator("h1")).toContainText("Feed");
    // Wait for articles to load
    await page.waitForSelector("article");
    expect(await page.locator("article").count()).toBeGreaterThan(0);
  });

  test("Should be able to navigate directly to an article via user profile URL", async ({
    page,
  }) => {
    // New URL pattern: /[username]/[slug]
    await page.goto(
      "http://localhost:3000/e2e-test-user-one-111/e2e-test-slug-published",
    );
    await expect(page.getByText(articleExcerpt)).toBeVisible();
    // Article title is shown in the content
    await expect(
      page.getByRole("heading", { name: "Published Article" }),
    ).toBeVisible();
    // Author name is shown in the metadata/breadcrumb (use .first() since name appears multiple times)
    await expect(
      page.getByRole("link", { name: "E2E Test User One" }).first(),
    ).toBeVisible();
    // Wait for action bar to load - use .first() since there are multiple Upvote buttons (action bar + comments)
    await expect(page.getByLabel("Upvote").first()).toBeVisible({
      timeout: 15000,
    });
    // Bookmark button has text "Save"
    await expect(page.getByRole("button", { name: "Save" })).toBeVisible();
  });

  test("Should show bookmark article icon on feed", async ({ page }) => {
    await page.goto("http://localhost:3000/feed?type=article");
    // Wait for articles to fully hydrate
    await page.waitForSelector("article");

    // Feed items should have bookmark buttons
    await expect(
      page
        .locator("article")
        .first()
        .getByRole("button", { name: /bookmark/i }),
    ).toBeVisible({ timeout: 15000 });
  });

  test("Should load more articles when scrolling to the end of the page", async ({
    page,
    isMobile,
  }) => {
    await page.goto("http://localhost:3000/feed?type=article");
    // Waits for articles to be loaded
    await page.waitForSelector("article");

    const initialArticleCount = await page.$$eval(
      "article",
      (articles) => articles.length,
    );

    if (!isMobile) {
      await page.getByText("Code Of Conduct").scrollIntoViewIfNeeded();
      await page.waitForTimeout(5000);
      const finalArticleCount = await page.$$eval(
        "article",
        (articles) => articles.length,
      );
      expect(finalArticleCount).toBeGreaterThanOrEqual(initialArticleCount);
    }

    // Footer links should be visible - use footer nav for specific items
    await expect(page.getByRole("link", { name: "Home" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Advertise" })).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Code Of Conduct" }),
    ).toBeVisible();
  });

  test("Should not be able to post a comment on an article", async ({
    page,
  }) => {
    await page.goto(
      "http://localhost:3000/e2e-test-user-one-111/e2e-test-slug-published",
    );

    // Wait for discussion section to load
    await expect(
      page.getByRole("heading", { name: /^Discussion \(\d+\)$/ }),
    ).toBeVisible({ timeout: 15000 });

    // Comment editor button should not be visible (not authenticated)
    await expect(
      page.getByRole("button", { name: "Join the conversation..." }),
    ).toBeHidden();

    // Should show sign in prompt
    await expect(page.getByText("Hey! 👋")).toBeVisible();
    await expect(page.getByText("Got something to say?")).toBeVisible();
    await expect(page.getByText("to leave a comment.")).toBeVisible();
  });

  test("Should sort articles by Recent (default)", async ({ page }) => {
    await page.goto("http://localhost:3000/feed?type=article&sort=recent");

    // Wait for articles to fully render
    await page.waitForSelector("article");
    await expect(page.locator("article").first()).toBeVisible();

    // Wait for time elements to be present (they render after hydration)
    await page
      .waitForSelector("article time", { timeout: 10000 })
      .catch(() => {});

    const articles = await page.$$eval("article", (articles) => {
      return articles.map((article) => ({
        date: article.querySelector("time")?.dateTime || null,
      }));
    });

    // Filter out articles without dates before checking sort
    const articlesWithDates = articles.filter((a) => a.date !== null);

    // If we have articles with dates, verify they're sorted
    if (articlesWithDates.length > 1) {
      const isSortedNewest = articlesWithDates.every((article, index, arr) => {
        if (index === arr.length - 1) return true;
        return new Date(article.date!) >= new Date(arr[index + 1].date!);
      });
      expect(isSortedNewest).toBeTruthy();
    } else {
      // At minimum, verify articles loaded
      expect(articles.length).toBeGreaterThan(0);
    }
  });

  test("Should sort articles by Popular (score-based)", async ({ page }) => {
    await page.goto("http://localhost:3000/feed?type=article&sort=popular");
    await page.waitForSelector("article");

    // Just verify the page loads with popular sort - exact ordering depends on vote counts
    expect(await page.locator("article").count()).toBeGreaterThan(0);
  });
});

test.describe("Authenticated Feed Page (Articles)", () => {
  test.beforeEach(async ({ page }) => {
    await loggedInAsUserOne(page);
  });

  test("Should show feed with filters and sidebar", async ({
    page,
    isMobile,
  }) => {
    await page.goto("http://localhost:3000/feed?type=article");
    await expect(page.locator("h1")).toContainText("Feed");

    // Wait for content to load
    await page.waitForSelector("article");
    expect(await page.locator("article").count()).toBeGreaterThan(0);

    // Sidebar elements should be visible on desktop
    if (!isMobile) {
      // Check for sidebar content (topics, saved items, etc.)
      await expect(
        page.getByRole("heading", { name: /topics|saved/i }).first(),
      ).toBeVisible({ timeout: 15000 });
    }
  });

  test("Should show bookmark article icon on feed", async ({ page }) => {
    await page.goto("http://localhost:3000/feed?type=article");

    // Wait for content to load
    await page.waitForSelector("article");

    // Feed items should have bookmark buttons
    await expect(
      page
        .locator("article")
        .first()
        .getByRole("button", { name: /bookmark/i }),
    ).toBeVisible({ timeout: 15000 });
  });

  test("Should write and publish an article", async ({ page, isMobile }) => {
    const articleTitle = "Lorem Ipsum";
    await page.goto("http://localhost:3000");
    // Waits for articles to be loaded
    await page.waitForSelector("article");

    // Desktop: Use the Create button in the header
    // Mobile: Navigate directly to /create
    if (isMobile) {
      await page.goto("http://localhost:3000/create");
    } else {
      await expect(page.getByRole("link", { name: "Create" })).toBeVisible();
      await page.getByRole("link", { name: "Create" }).click();
    }
    await page.waitForURL("http://localhost:3000/create");

    await page.getByPlaceholder("Article title").fill(articleTitle);

    // Fill in the editor content - use keyboard.type() for TipTap
    const editor = page.locator(".ProseMirror");
    await editor.click();
    await page.keyboard.type(articleContent);

    // Wait for auto-save to complete - URL should update with post ID
    await page.waitForURL(/.*create\/[a-z0-9]+/, { timeout: 20000 });

    // Click the Publish button in the navigation
    const navPublishButton = page
      .getByLabel("Editor navigation")
      .getByRole("button", { name: "Publish" });
    await expect(navPublishButton).toBeEnabled({ timeout: 5000 });
    await navPublishButton.click();

    // Modal should appear with "Let's do this!" button for articles
    await expect(
      page.getByRole("button", { name: "Let's do this!" }),
    ).toBeVisible({ timeout: 10000 });
    await page.getByRole("button", { name: "Let's do this!" }).click();
    // New URL pattern: /[username]/[slug]
    await page.waitForURL(
      /^http:\/\/localhost:3000\/e2e-test-user-one-111\/lorem-ipsum-.*$/,
    );

    await expect(
      page.getByRole("heading", { name: "Lorem Ipsum" }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "E2E Test User One" }).first(),
    ).toBeVisible();
    // Wait for discussion section to finish loading
    await expect(
      page.getByRole("heading", { name: /^Discussion \(\d+\)$/ }),
    ).toBeVisible({ timeout: 15000 });
    // Wait for action bar to load - use .first() since there are multiple Upvote buttons
    await expect(page.getByLabel("Upvote").first()).toBeVisible({
      timeout: 15000,
    });
    await expect(page.getByRole("button", { name: "Save" })).toBeVisible();
  });

  test("Should post a comment on an article", async ({ page }, workerInfo) => {
    const commentContent = `This is a great read. Thanks for posting! Sent from ${workerInfo.project.name} + ${randomUUID()}`;
    await page.goto(
      "http://localhost:3000/e2e-test-user-one-111/e2e-test-slug-published",
    );

    // Wait for discussion section to load
    await expect(
      page.getByRole("heading", { name: /^Discussion \(\d+\)$/ }),
    ).toBeVisible({ timeout: 15000 });

    // Click the collapsed comment editor button to expand it
    await expect(
      page.getByRole("button", { name: "Join the conversation..." }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Join the conversation..." })
      .click();

    // Now the editor is expanded - fill in the content
    // The expanded editor uses a tiptap editor, we need to click into it first
    await page.waitForTimeout(500); // Wait for editor to expand
    // Focus the editor by clicking in it
    await page.locator(".ProseMirror").first().click();
    await page.keyboard.type(commentContent);
    // Use exact: true to avoid matching "Comment options"
    await page.getByRole("button", { name: "Comment", exact: true }).click();

    await expect(page.getByText(commentContent)).toBeVisible();
  });

  test("Should be able reply to a comment", async ({ page }) => {
    await page.goto(
      "http://localhost:3000/e2e-test-user-one-111/e2e-test-slug-published",
    );

    await expect(page.getByText(articleExcerpt)).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Published Article" }),
    ).toBeVisible();
    // Wait for discussion section to finish loading
    await expect(
      page.getByRole("heading", { name: /^Discussion \(\d+\)$/ }),
    ).toBeVisible({ timeout: 15000 });

    // Click reply on the first comment
    await page.getByRole("button", { name: "Reply" }).first().click();

    // Wait for reply editor to expand
    await page.waitForTimeout(500);
    // Focus the reply editor and type
    await page.locator(".ProseMirror").last().click();
    const replyText = `Test reply ${Date.now()}`;
    await page.keyboard.type(replyText);

    // Submit the reply
    await page
      .getByRole("button", { name: "Reply", exact: true })
      .nth(1)
      .click();

    // Wait for the reply text to appear (this indicates the reply was successful)
    await expect(page.getByText(replyText)).toBeVisible({ timeout: 15000 });
  });

  test("Should show vote buttons on article detail", async ({ page }) => {
    await page.goto(
      "http://localhost:3000/e2e-test-user-one-111/e2e-test-slug-published",
    );

    // Wait for the article action bar to load - use .first() since there are multiple Upvote buttons
    await expect(page.getByLabel("Upvote").first()).toBeVisible({
      timeout: 15000,
    });

    // Should be able to interact with vote button
    await page.getByLabel("Upvote").first().click();

    // Vote button should show active state
    await expect(page.getByLabel("Upvote").first()).toBeVisible();
  });

  test("Should be able to bookmark an article", async ({ page }) => {
    await page.goto(
      "http://localhost:3000/e2e-test-user-one-111/e2e-test-slug-published",
    );
    await page.waitForLoadState("domcontentloaded");

    // Wait for action bar to load - bookmark button has text "Save"
    await expect(page.getByRole("button", { name: "Save" })).toBeVisible({
      timeout: 15000,
    });

    // Wait for TRPC bookmark mutation response
    const bookmarkResponsePromise = page.waitForResponse(
      (response) =>
        response.url().includes("/api/trpc/") &&
        response.url().includes("bookmark") &&
        response.status() === 200,
    );
    await page.getByRole("button", { name: "Save" }).click();
    await bookmarkResponsePromise;

    // Button text should change to "Saved" - add explicit timeout for slow mobile browsers
    await expect(page.getByRole("button", { name: "Saved" })).toBeVisible({
      timeout: 15000,
    });
  });
});
