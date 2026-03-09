import type { Page } from "@playwright/test";
import test, { expect } from "@playwright/test";
import { loggedInAsUserOne, createArticle } from "./utils";
import { articleExcerpt } from "./constants";

type TabName = "Drafts" | "Scheduled" | "Published";

async function openTab(
  page: Page,
  tabName: TabName,
  isMobile: boolean = false,
) {
  await page.goto("http://localhost:3000/my-posts");
  await page.waitForLoadState("domcontentloaded");

  // Mobile renders tabs as a select dropdown, desktop uses links
  if (isMobile) {
    const tabSelect = page.locator("select#tabs");
    await expect(tabSelect).toBeVisible({ timeout: 15000 });
    await expect(tabSelect).toBeEnabled({ timeout: 5000 });
    await tabSelect.selectOption({ label: tabName });
    // Wait for mobile navigation to settle
    await page.waitForLoadState("domcontentloaded");
  } else {
    await page.getByRole("link", { name: tabName }).click();
  }

  const slug = tabName.toLowerCase();
  await page.waitForURL(`http://localhost:3000/my-posts?tab=${slug}`, {
    timeout: 20000,
  });
  await expect(page).toHaveURL(new RegExp(`\\/my-posts\\?tab=${slug}`));

  // Wait for loading state to complete
  await expect(page.getByText("Fetching your posts...")).toBeHidden({
    timeout: 25000,
  });

  // Wait for network to settle and content to load
  await page.waitForLoadState("domcontentloaded");

  // Wait for at least one article to be visible with increased timeout for mobile
  await expect(page.locator("article").first()).toBeVisible({
    timeout: 25000,
  });
}

async function openDeleteModal(page: Page, title: string) {
  const article = page.locator(`article:has-text("${title}")`);
  await expect(article).toBeVisible();
  await article.locator("button.dropdown-button").click();
  await article.locator('text="Delete"').click();
  await expect(
    page.getByText("Are you sure you want to delete this article?"),
  ).toBeVisible();
}

test.describe("Unauthenticated my-posts Page", () => {
  test("Unauthenticated users should be redirected to get-started page if they access my-posts directly", async ({
    page,
  }) => {
    await page.goto("http://localhost:3000/my-posts");
    await page.waitForURL("http://localhost:3000/get-started");
    expect(page.url()).toEqual("http://localhost:3000/get-started");
  });
});

test.describe("Authenticated my-posts Page", () => {
  test.beforeEach(async ({ page }) => {
    await loggedInAsUserOne(page);
  });

  test("Tabs for different type of posts should be visible", async ({
    page,
    isMobile,
  }) => {
    await page.goto("http://localhost:3000/my-posts");

    // Mobile renders tabs as a select dropdown, desktop uses links
    if (isMobile) {
      const tabSelect = page.locator("select#tabs");
      await expect(tabSelect).toBeVisible({ timeout: 10000 });
      // Verify the select has the correct options
      await expect(
        tabSelect.locator('option:has-text("Drafts")'),
      ).toBeVisible();
      await expect(
        tabSelect.locator('option:has-text("Scheduled")'),
      ).toBeVisible();
      await expect(
        tabSelect.locator('option:has-text("Published")'),
      ).toBeVisible();
    } else {
      await expect(page.getByRole("link", { name: "Drafts" })).toBeVisible();
      await expect(page.getByRole("link", { name: "Scheduled" })).toBeVisible();
      await expect(page.getByRole("link", { name: "Published" })).toBeVisible();
    }
  });

  test("Different article tabs should correctly display articles matching that type", async ({
    page,
    isMobile,
  }) => {
    await page.goto("http://localhost:3000/my-posts");

    // Check tab visibility - on mobile these are in a select dropdown
    if (!isMobile) {
      await expect(page.getByRole("link", { name: "Drafts" })).toBeVisible();
      await expect(page.getByRole("link", { name: "Scheduled" })).toBeVisible();
      await expect(page.getByRole("link", { name: "Published" })).toBeVisible();
    }

    await openTab(page, "Published", isMobile);
    await expect(
      page.getByRole("heading", { name: "Published Article" }),
    ).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(articleExcerpt)).toBeVisible();

    await openTab(page, "Scheduled", isMobile);
    await expect(
      page.getByRole("heading", { name: "Scheduled Article" }),
    ).toBeVisible({ timeout: 15000 });
    await expect(
      page.getByText("This is an excerpt for a scheduled article."),
    ).toBeVisible();

    await openTab(page, "Drafts", isMobile);
    // Verify at least one draft article is visible (seeded data or from other tests)
    // The exact article may vary due to test parallelism creating additional drafts
    await expect(page.locator("article").first()).toBeVisible({
      timeout: 15000,
    });
    // Verify the article has a heading (h2)
    await expect(page.locator("article").first().locator("h2")).toBeVisible({
      timeout: 10000,
    });
  });

  test("User should close delete modal with Cancel button", async ({
    page,
    isMobile,
  }) => {
    const title = "Published Article";
    await page.goto("http://localhost:3000/my-posts");
    await openTab(page, "Published", isMobile);
    await openDeleteModal(page, title);

    const closeButton = page.getByRole("button", { name: "Cancel" });
    await closeButton.click();

    await expect(
      page.locator("text=Are you sure you want to delete this article?"),
    ).toBeHidden();
  });

  test("User should close delete modal with Close button", async ({
    page,
    isMobile,
  }) => {
    const title = "Published Article";
    await page.goto("http://localhost:3000/my-posts");
    await openTab(page, "Published", isMobile);
    await openDeleteModal(page, title);

    const closeButton = page.getByRole("button", { name: "Close" });
    await closeButton.click();

    await expect(
      page.locator("text=Are you sure you want to delete this article?"),
    ).toBeHidden();
  });

  test("User should delete published article", async ({ page, isMobile }) => {
    const article = {
      id: "test-id-for-deletion",
      title: "Article to be deleted",
      slug: "article-to-be-deleted",
      excerpt: "This is an excerpt for the article to be deleted.",
      body: "This is the body for the article to be deleted.",
    };
    await createArticle(article);
    await page.goto("http://localhost:3000/my-posts");
    await openTab(page, "Published", isMobile);
    await expect(page.getByRole("link", { name: article.title })).toBeVisible();
    await openDeleteModal(page, article.title);

    await page.getByRole("button", { name: "Delete" }).click();
    await expect(page.getByRole("link", { name: article.slug })).toHaveCount(0);
  });
});
