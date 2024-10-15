import { test, expect } from "playwright/test";

test.describe("Unauthenticated Articles Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
  });

  test("Should show popular tags", async ({ page, isMobile }) => {
    await page.goto("http://localhost:3000/articles");
    await expect(
      page.getByRole("heading", { name: "Popular topics" }),
    ).toBeVisible({ visible: !isMobile });

    await expect(
      page.getByRole("link", { name: '"Codú Writing Challenge" text' }),
    ).toBeVisible({ visible: !isMobile });
  });

  test("Should not show bookmark article icon", async ({ page }) => {
    await page.goto("http://localhost:3000/articles");

    await expect(
      page.getByRole("heading", { name: "Recent bookmarks" }),
    ).toBeHidden();

    await expect(
      page.locator("article").first().getByLabel("Bookmark this post"),
    ).toBeHidden();
  });
  test("Should load more articles when scrolling to the end of the page", async ({
    page,
    isMobile,
  }) => {
    await page.goto("http://localhost:3000/articles");
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
      expect(finalArticleCount).toBeGreaterThan(initialArticleCount);
    }

    await expect(page.getByText("Home")).toBeVisible();
    await expect(
      page.getByLabel("Footer").getByRole("link", { name: "Events" }),
    ).toBeVisible();
    await expect(page.getByText("Sponsorship")).toBeVisible();
    await expect(page.getByText("Code Of Conduct")).toBeVisible();
  });
});

test.describe("Authenticated Articles Page", () => {
  test("Should show recent bookmarks", async ({ page, isMobile }) => {
    await page.goto("http://localhost:3000/articles");
    await expect(
      page.getByRole("heading", { name: "Popular topics" }),
    ).toBeVisible({ visible: !isMobile });

    await expect(
      page.getByRole("link", { name: '"Codú Writing Challenge" text' }),
    ).toBeVisible({ visible: !isMobile });

    await expect(
      page.getByRole("heading", { name: "Recent bookmarks" }),
    ).toBeVisible({ visible: !isMobile });
  });

  test("Should show bookmark article icon", async ({ page, isMobile }) => {
    await page.goto("http://localhost:3000/articles");
    await expect(
      page.getByRole("heading", { name: "Popular topics" }),
    ).toBeVisible({ visible: !isMobile });

    await expect(
      page.getByRole("link", { name: '"Codú Writing Challenge" text' }),
    ).toBeVisible({ visible: !isMobile });

    await expect(
      page.getByRole("heading", { name: "Recent bookmarks" }),
    ).toBeVisible({ visible: !isMobile });

    await expect(
      page.locator("article").first().getByLabel("Bookmark this post"),
    ).toBeVisible();
  });

  test("Should load more articles when scrolling to the end of the page", async ({
    page,
    isMobile,
  }) => {
    await page.goto("http://localhost:3000/articles");
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
      expect(finalArticleCount).toBeGreaterThan(initialArticleCount);
    }

    await expect(page.getByText("Home")).toBeVisible();
    await expect(
      page.getByLabel("Footer").getByRole("link", { name: "Events" }),
    ).toBeVisible();
    await expect(page.getByText("Sponsorship")).toBeVisible();
    await expect(page.getByText("Code Of Conduct")).toBeVisible();
  });
});
