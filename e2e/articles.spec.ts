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

    await expect(page.getByRole("link", { name: "Find out more" })).toBeVisible(
      { visible: !isMobile },
    );
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

    await expect(page.getByRole("link", { name: "Find out more" })).toBeVisible(
      { visible: !isMobile },
    );

    await expect(
      page.getByRole("heading", { name: "Recent bookmarks" }),
    ).toBeVisible({ visible: !isMobile });
  });

  test("Should show bookmark article icon", async ({ page, isMobile }) => {
    await page.goto("http://localhost:3000/articles");
    await expect(
      page.getByRole("heading", { name: "Popular topics" }),
    ).toBeVisible({ visible: !isMobile });

    await expect(page.getByRole("link", { name: "Find out more" })).toBeVisible(
      { visible: !isMobile },
    );

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

  test("Should write and publish an article", async ({ page, isMobile }) => {
    const articleContent =
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas vitae ipsum id metus vestibulum rutrum eget a diam. Integer eget vulputate risus, ac convallis nulla. Mauris sed augue nunc. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos. Nam congue posuere tempor. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Ut ac augue non libero ullamcorper ornare. Ut commodo ligula vitae malesuada maximus. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Etiam sagittis justo non justo placerat, a dapibus sapien volutpat. Nullam ullamcorper sodales justo sed.";
    const articleTitle = "Lorem Ipsum";
    await page.goto("http://localhost:3000");
    // Waits for articles to be loaded
    await page.waitForSelector("article");

    // Mobile and Desktop have different ways to start writing an article
    if (isMobile) {
      await expect(
        page.getByRole("button", { name: "Open main menu" }),
      ).toBeVisible();
      page.getByRole("button", { name: "Open main menu" }).tap();
      await expect(page.getByRole("link", { name: "New Post" })).toBeVisible();
      await page.getByRole("link", { name: "New Post" }).tap();
    } else {
      await expect(page.getByRole("link", { name: "New Post" })).toBeVisible();
      await page.getByRole("link", { name: "New Post" }).click();
    }
    await page.waitForURL("http:/localhost:3000/create");

    await page.getByPlaceholder("Article title").fill(articleTitle);

    await page
      .getByPlaceholder("Enter your content here 💖")
      .fill(articleContent);

    await expect(page.getByRole("button", { name: "Next" })).toBeVisible();
    await page.getByRole("button", { name: "Next" }).click();
    await expect(
      page.getByRole("button", { name: "Publish now" }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Publish now" }).click();
    await page.waitForURL(
      /^http:\/\/localhost:3000\/articles\/lorem-ipsum-.*$/,
    );

    await expect(page.getByText("Lorem ipsum dolor sit amet,")).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Lorem Ipsum" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Written by E2E Test User" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Discussion (0)" }),
    ).toBeVisible();
    await expect(page.getByLabel("like-trigger")).toBeVisible();
    await expect(page.getByLabel("bookmark-trigger")).toBeVisible();
  });
});
