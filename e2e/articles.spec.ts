import { test, expect } from "playwright/test";

test.describe("Articles", () => {
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
      await page.waitForTimeout(2500);
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
