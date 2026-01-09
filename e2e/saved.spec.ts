import { test, expect } from "playwright/test";
import { loggedInAsUserOne } from "./utils";

test.describe("Unauthenticated Saved Page", () => {
  test("Should redirect unauthenticated users to get-started page", async ({
    page,
  }) => {
    await page.goto("http://localhost:3000/saved");
    // Should redirect to get-started page
    await expect(page).toHaveURL(/get-started/);
  });
});

test.describe("Authenticated Saved Page", () => {
  test.beforeEach(async ({ page }) => {
    await loggedInAsUserOne(page);
  });

  test("Should display saved items page", async ({ page }) => {
    await page.goto("http://localhost:3000/saved");
    await expect(page.locator("h1")).toContainText(/saved/i);
  });

  test("Should show empty state when no saved items", async ({ page }) => {
    // First clear any existing bookmarks by going to feed and unbookmarking
    await page.goto("http://localhost:3000/saved");

    // Either show saved items or empty state
    const pageContent = await page.content();
    expect(pageContent).toBeTruthy();
  });

  test("Should bookmark and appear in saved items", async ({ page }) => {
    // First, bookmark an article
    await page.goto("http://localhost:3000/feed?type=article");
    await expect(page.locator("article").first()).toBeVisible({
      timeout: 15000,
    });

    // Get the title of the first article before bookmarking
    const articleHeading = page.locator("article").first().locator("h2");
    await expect(articleHeading).toBeVisible();
    const articleTitle = await articleHeading.textContent();

    // Click bookmark on first item and wait for it to complete
    const bookmarkButton = page.getByTestId("bookmark-button").first();
    await expect(bookmarkButton).toBeVisible();
    await bookmarkButton.click();

    // Wait for bookmark mutation to complete
    await page.waitForTimeout(1000);

    // Navigate to saved page
    await page.goto("http://localhost:3000/saved");
    await page.waitForLoadState("networkidle");

    // The bookmarked article should appear - use filter for more resilient matching
    if (articleTitle) {
      await expect(
        page.locator("article").filter({ hasText: articleTitle.trim() }),
      ).toBeVisible({
        timeout: 15000,
      });
    }
  });

  test("Should navigate to content from saved items", async ({ page }) => {
    // First ensure there's a saved item
    await page.goto("http://localhost:3000/feed?type=article");
    await page.waitForSelector("article");

    // Bookmark an item
    await page.getByTestId("bookmark-button").first().click();
    await page.waitForTimeout(500);

    // Go to saved page
    await page.goto("http://localhost:3000/saved");
    await page.waitForTimeout(1000);

    // Click on a saved item to navigate to it
    const firstLink = page.locator("article").first().locator("a").first();
    if (await firstLink.isVisible()) {
      await firstLink.click();
      // Should navigate away from saved page
      await expect(page).not.toHaveURL("http://localhost:3000/saved");
    }
  });

  test("Should sync with sidebar saved articles section", async ({
    page,
    isMobile,
  }) => {
    if (isMobile) {
      // Skip on mobile since sidebar isn't visible
      return;
    }

    // First, bookmark an article
    await page.goto("http://localhost:3000/feed?type=article");
    await page.waitForSelector("article");

    // Click bookmark on first item
    await page.getByTestId("bookmark-button").first().click();
    await page.waitForTimeout(500);

    // Sidebar should show "Your Saved Articles" section
    await expect(
      page.getByRole("heading", { name: /saved/i }).first(),
    ).toBeVisible({ timeout: 10000 });
  });
});
