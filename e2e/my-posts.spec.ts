import type { Page } from "@playwright/test";
import test, { expect } from "@playwright/test";
import { loggedInAsUserOne, createArticle } from "./utils";
import { articleExcerpt } from "./constants";

type TabName = "Drafts" | "Scheduled" | "Published";

async function openTab(page: Page, tabName: TabName) {
  await page.goto("http://localhost:3000/my-posts");
  await page.getByRole("link", { name: tabName }).click();
  const slug = tabName.toLowerCase();
  await page.waitForURL(`http://localhost:3000/my-posts?tab=${slug}`);
  await expect(page).toHaveURL(new RegExp(`\\/my-posts\\?tab=${slug}`));
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
  }) => {
    await page.goto("http://localhost:3000/my-posts");

    await expect(page.getByRole("link", { name: "Drafts" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Scheduled" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Published" })).toBeVisible();
  });

  test("Different article tabs should correctly display articles matching that type", async ({
    page,
  }) => {
    await page.goto("http://localhost:3000/my-posts");

    await expect(page.getByRole("link", { name: "Drafts" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Scheduled" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Published" })).toBeVisible();

    await openTab(page, "Published");
    await expect(
      page.getByRole("heading", { name: "Published Article" }),
    ).toBeVisible();
    await expect(page.getByText(articleExcerpt)).toBeVisible();

    await openTab(page, "Scheduled");
    await expect(
      page.getByRole("heading", { name: "Scheduled Article" }),
    ).toBeVisible();
    await expect(
      page.getByText("This is an excerpt for a scheduled article."),
    ).toBeVisible();

    await openTab(page, "Drafts");
    await expect(
      page.getByRole("heading", { name: "Draft Article" }),
    ).toBeVisible();
    await expect(
      page.getByText("This is an excerpt for a draft article.", {
        exact: true,
      }),
    ).toBeVisible();
  });

  test("User should close delete modal with Cancel button", async ({
    page,
  }) => {
    const title = "Published Article";
    await page.goto("http://localhost:3000/my-posts");
    await openTab(page, "Published");
    await openDeleteModal(page, title);

    const closeButton = page.getByRole("button", { name: "Cancel" });
    await closeButton.click();

    await expect(
      page.locator("text=Are you sure you want to delete this article?"),
    ).toBeHidden();
  });

  test("User should close delete modal with Close button", async ({ page }) => {
    const title = "Published Article";
    await page.goto("http://localhost:3000/my-posts");
    await openTab(page, "Published");
    await openDeleteModal(page, title);

    const closeButton = page.getByRole("button", { name: "Close" });
    await closeButton.click();

    await expect(
      page.locator("text=Are you sure you want to delete this article?"),
    ).toBeHidden();
  });

  test("User should delete published article", async ({ page }) => {
    const article = {
      id: "test-id-for-deletion",
      title: "Article to be deleted",
      slug: "article-to-be-deleted",
      excerpt: "This is an excerpt for the article to be deleted.",
      body: "This is the body for the article to be deleted.",
    };
    await createArticle(article);
    await page.goto("http://localhost:3000/my-posts");
    await openTab(page, "Published");
    await expect(page.getByRole("link", { name: article.title })).toBeVisible();
    await openDeleteModal(page, article.title);

    await page.getByRole("button", { name: "Delete" }).click();
    await expect(page.getByRole("link", { name: article.slug })).toHaveCount(0);
  });
});
