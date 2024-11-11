import test, { expect } from "@playwright/test";
import { articleExcerpt, loggedInAsUserOne } from "./utils";

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

    await page.getByRole("link", { name: "Drafts" }).click();
    await expect(
      page.getByRole("heading", { name: "Draft Article" }),
    ).toBeVisible();
    await expect(page.getByText(articleExcerpt)).toBeVisible();

    await page.getByRole("link", { name: "Scheduled" }).click();
    await expect(
      page.getByRole("heading", { name: "Scheduled Article" }),
    ).toBeVisible();
    await expect(page.getByText(articleExcerpt)).toBeVisible();

    await page.getByRole("link", { name: "Published" }).click();
    await expect(
      page.getByRole("heading", { name: "Published Article" }),
    ).toBeVisible();
    await expect(page.getByText(articleExcerpt, { exact: true })).toBeVisible();
  });
});
