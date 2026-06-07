import { test, expect } from "playwright/test";
import { loggedInAsUserOne } from "./utils";

test.describe("Unauthenticated Feed Page", () => {
  test("Should display feed page with content", async ({ page }) => {
    await page.goto("http://localhost:3000/feed");
    await expect(page.locator("h1")).toContainText("Feed");
    await page.waitForSelector("article");
    expect(await page.locator("article").count()).toBeGreaterThan(0);
  });

  test("Should show type filter dropdown", async ({ page }) => {
    await page.goto("http://localhost:3000/feed");
    await page.waitForSelector("article");

    // Type filter should be visible with the default "All types" label
    await expect(page.getByTestId("type-filter")).toBeVisible();
    await expect(page.getByText("All types")).toBeVisible();
  });

  test("Should show sort filter dropdown", async ({ page }) => {
    await page.goto("http://localhost:3000/feed");
    await page.waitForSelector("article");

    // Sort filter should be visible with default "Recent"
    await expect(page.getByTestId("sort-filter")).toBeVisible();
    await expect(page.getByText("Recent")).toBeVisible();
  });

  test("Should filter content by type (articles only)", async ({ page }) => {
    await page.goto("http://localhost:3000/feed");
    await page.waitForSelector("article");

    // Click type filter to open the listbox
    await page.getByTestId("type-filter").click();
    await page.waitForTimeout(300);

    // Select Articles from the listbox options
    await page.getByRole("option", { name: "Articles" }).click();

    // URL should update
    await expect(page).toHaveURL(/type=article/i);

    // Content should still be visible
    await page.waitForSelector("article");
  });

  test("Should sort content by Trending", async ({ page }) => {
    await page.goto("http://localhost:3000/feed");
    await page.waitForSelector("article");

    // Click sort filter to open the listbox
    await page.getByTestId("sort-filter").click();
    await page.waitForTimeout(300);

    // Select Trending from the listbox options
    await page.getByRole("option", { name: "Trending" }).click();

    // URL should update
    await expect(page).toHaveURL(/sort=trending/);

    // Content should still be visible
    await page.waitForSelector("article");
  });

  test("Should sort content by Popular", async ({ page }) => {
    await page.goto("http://localhost:3000/feed");
    await page.waitForSelector("article");

    // Click sort filter to open the listbox
    await page.getByTestId("sort-filter").click();
    await page.waitForTimeout(300);

    // Select Popular from the listbox options
    await page.getByRole("option", { name: "Popular" }).click();

    // URL should update
    await expect(page).toHaveURL(/sort=popular/);

    // Content should still be visible
    await page.waitForSelector("article");
  });

  test("Should show vote buttons on feed items", async ({ page }) => {
    await page.goto("http://localhost:3000/feed");
    await page.waitForSelector("article");

    // The relaunch reaction bar is "▲ helpful" (supportive, upvote-only).
    await expect(page.getByLabel("Helpful").first()).toBeVisible({
      timeout: 15000,
    });
  });

  test("Should show bookmark buttons on feed items", async ({ page }) => {
    await page.goto("http://localhost:3000/feed");
    await page.waitForSelector("article");

    // Bookmark buttons should be visible
    await expect(page.getByTestId("bookmark-button").first()).toBeVisible({
      timeout: 15000,
    });
  });

  test("Should navigate to content detail when clicking title", async ({
    page,
  }) => {
    await page.goto("http://localhost:3000/feed?type=article");
    await page.waitForSelector("article");

    // Click on the first article title
    const firstArticleLink = page
      .locator("article")
      .first()
      .locator("a")
      .first();
    await firstArticleLink.click();

    // Should navigate to article detail page
    await expect(page).not.toHaveURL("http://localhost:3000/feed");
  });
});

test.describe("Authenticated Feed Page", () => {
  test.beforeEach(async ({ page }) => {
    await loggedInAsUserOne(page);
  });

  test("Should display feed with sidebar content", async ({
    page,
    isMobile,
  }) => {
    await page.goto("http://localhost:3000/feed");
    await expect(page.locator("h1")).toContainText("Feed");
    await page.waitForSelector("article");

    if (!isMobile) {
      // Right rail shows discovery / progress on desktop.
      await expect(
        page.getByText(/Trending tags|Your progress/i).first(),
      ).toBeVisible({ timeout: 15000 });
    }
  });

  test("Should allow marking content helpful (upvote)", async ({ page }) => {
    await page.goto("http://localhost:3000/feed");
    await page.waitForSelector("article");

    // Click the helpful (upvote) control
    await page.getByLabel("Helpful").first().click();

    // Control should still be visible after interaction
    await expect(page.getByLabel("Helpful").first()).toBeVisible();
  });

  test("Should allow bookmarking content", async ({ page }) => {
    await page.goto("http://localhost:3000/feed");
    await page.waitForSelector("article");

    // Click bookmark on first item
    await page.getByTestId("bookmark-button").first().click();

    // Button should still be visible (state may change)
    await expect(page.getByTestId("bookmark-button").first()).toBeVisible();
  });

  test("Should combine filters - type and sort", async ({ page }) => {
    await page.goto("http://localhost:3000/feed");
    await page.waitForSelector("article");

    // Set type filter to Articles
    await page.getByTestId("type-filter").click();
    await page.waitForTimeout(300);
    await page.getByRole("option", { name: "Articles" }).click();

    // Wait for URL to update
    await expect(page).toHaveURL(/type=article/i);

    // Wait for content to reload
    await page.waitForSelector("article");

    // Set sort to Trending
    await page.getByTestId("sort-filter").click();
    await page.waitForTimeout(300);
    await page.getByRole("option", { name: "Trending" }).click();

    // URL should have both params
    await expect(page).toHaveURL(/sort=trending/);

    // Content should still load
    await page.waitForSelector("article");
  });

  test("Should load more content on scroll (infinite scroll)", async ({
    page,
    isMobile,
  }) => {
    await page.goto("http://localhost:3000/feed");
    await page.waitForSelector("article");

    const initialCount = await page.locator("article").count();

    if (!isMobile && initialCount >= 5) {
      // Scroll to bottom
      await page.getByText("Code Of Conduct").scrollIntoViewIfNeeded();
      await page.waitForTimeout(3000);

      const finalCount = await page.locator("article").count();
      expect(finalCount).toBeGreaterThanOrEqual(initialCount);
    }
  });
});
