import { test, expect } from "playwright/test";

test.describe("Articles", () => {
  test("Should load more articles when scrolling to the end of the page", async ({
    page,
  }) => {
    await page.goto("http://localhost:3000/articles");
    // Waits for articles to be loaded
    await page.waitForSelector("article");

    const initialArticleCount = await page.$$eval(
      "article",
      (articles) => articles.length,
    );

    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });

    await expect(page.locator(".animate-pulse")).toBeVisible();
    await expect(page.locator(".animate-pulse")).toBeHidden();

    const finalArticleCount = await page.$$eval(
      "article",
      (articles) => articles.length,
    );

    expect(finalArticleCount).toBeGreaterThan(initialArticleCount);
  });
});
