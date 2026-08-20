import { test, expect } from "playwright/test";
import { createArticle, deletePostBySlug, loggedInAsUserOne } from "./utils";

// Run saved tests serially to prevent parallel bookmark toggling conflicts.
// These tests mutate the shared e2e user's bookmark state, so other specs
// running in parallel can race them — retries absorb that transient flake
// (CI already retries; this matches it locally).
test.describe.configure({ mode: "serial", retries: 2 });

// Post-relaunch: the feed is the homepage at "/". Feed rows are
// UnifiedContentCards whose bookmark control is the "Save" button
// (data-testid="bookmark-button"). Saved items live on the /saved page.
// Dedicated fixture (seeded by e2e/setup.ts) that no other spec mutates, so
// the save/unsave toggling here can't race parallel specs sharing the main
// published article.
const PUBLISHED_ARTICLE_URL =
  "http://localhost:3000/e2e-test-user-one-111/e2e-saved-target";

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

  test("Should show empty state or saved items", async ({ page }) => {
    await page.goto("http://localhost:3000/saved");

    // The bookmarks query resolves to either saved cards or the empty state.
    // Wait for whichever terminal state appears (skeletons resolve first).
    await expect(
      page
        .locator("article")
        .first()
        .or(page.getByText(/nothing saved yet/i)),
    ).toBeVisible({ timeout: 15000 });
  });

  test("Should bookmark from the article reader and appear in saved items", async ({
    page,
  }, testInfo) => {
    // Serial mode above only orders tests within one project; all four browser
    // projects run in parallel as the SAME e2e user, so a shared article still
    // races — one project saves it while another asserts it is unsaved. Each
    // project bookmarks its own article instead.
    const slug = `e2e-saved-target-${testInfo.project.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")}`;
    await createArticle({
      title: "E2E saved target",
      slug,
      excerpt: "Saved target",
      body: "Saved target body",
    });

    await page.goto(`http://localhost:3000/e2e-test-user-one-111/${slug}`);
    await page.waitForLoadState("domcontentloaded");

    // exact: true so "Save" doesn't also match "Saved".
    const saveButton = page.getByRole("button", { name: "Save", exact: true });
    const savedButton = page.getByRole("button", {
      name: "Saved",
      exact: true,
    });

    // Now bookmark it.
    await expect(saveButton).toBeVisible({ timeout: 15000 });
    await saveButton.scrollIntoViewIfNeeded();
    await Promise.all([
      page.waitForResponse(
        (resp) =>
          resp.url().includes("trpc") && resp.url().includes("bookmark"),
      ),
      saveButton.click(),
    ]);

    // The saved state confirms the bookmark mutation succeeded.
    await expect(savedButton).toBeVisible({ timeout: 15000 });

    // The /saved page should load with either the saved article or (if a
    // parallel test unbookmarked it) the empty state.
    // With a per-project fixture nothing else can unbookmark it, so the saved
    // page must actually list it — no "or the empty state" escape hatch.
    await page.goto("http://localhost:3000/saved");
    await expect(page.getByText("E2E saved target").first()).toBeVisible({
      timeout: 15000,
    });

    await deletePostBySlug(slug);
  });

  test("Should bookmark from the feed card Save action", async ({ page }) => {
    await page.goto("http://localhost:3000/?type=article");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForSelector("article");

    // Feed card bookmark control.
    const bookmark = page.getByTestId("bookmark-button").first();
    await expect(bookmark).toBeVisible({ timeout: 15000 });

    // Toggle the bookmark and confirm the mutation fires.
    await Promise.all([
      page.waitForResponse(
        (resp) =>
          resp.url().includes("trpc") && resp.url().includes("bookmark"),
      ),
      bookmark.click(),
    ]);

    // Control remains visible after the state update.
    await expect(page.getByTestId("bookmark-button").first()).toBeVisible();
  });

  test("Should navigate to content from saved items", async ({ page }) => {
    await page.goto("http://localhost:3000/saved");
    await page.waitForLoadState("domcontentloaded");

    // Click on a saved item to navigate to it (if any are present).
    const firstLink = page.locator("article").first().locator("a").first();
    if (await firstLink.isVisible().catch(() => false)) {
      await firstLink.click();
      // Should navigate away from the saved page.
      await expect(page).not.toHaveURL("http://localhost:3000/saved");
    }
  });
});
