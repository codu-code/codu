import { test, expect } from "playwright/test";
import { randomUUID } from "crypto";
import { articleContent, articleExcerpt, loggedInAsUserOne } from "./utils";

test.describe("Unauthenticated Articles Page", () => {
  test("Should show popular tags", async ({ page, isMobile }) => {
    await page.goto("http://localhost:3000/articles");
    await expect(
      page.getByRole("heading", { name: "Popular topics" }),
    ).toBeVisible({ visible: !isMobile });

    await expect(page.getByRole("link", { name: "Find out more" })).toBeVisible(
      { visible: !isMobile },
    );
  });

  test("Should be able to navigate directly to an article", async ({
    page,
  }) => {
    await page.goto("http://localhost:3000/articles/e2e-test-slug-published");
    await expect(page.getByText(articleExcerpt)).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Published Article" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Written by E2E Test User One" }),
    ).toBeVisible();
    await expect(page.getByLabel("like-trigger")).toBeVisible();
    await expect(page.getByLabel("bookmark-trigger")).toBeVisible();
  });

  test("Should show bookmark article icon", async ({ page }) => {
    await page.goto("http://localhost:3000/articles");

    await expect(
      page.getByRole("heading", { name: "Recent bookmarks" }),
    ).toBeHidden();

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

  test("Should not be able to post a comment on an article", async ({
    page,
  }) => {
    await page.goto("http://localhost:3000");
    // Waits for articles to be loaded
    await expect(page.getByText("Read Full Article").first()).toBeVisible();
    await page.getByText("Read Full Article").first().click();
    await page.waitForURL(/^http:\/\/localhost:3000\/articles\/.*$/);

    await expect(page.getByPlaceholder("What do you think?")).toBeHidden();

    await expect(page.getByText("Hey! 👋")).toBeVisible();
    await expect(page.getByText("Got something to say?")).toBeVisible();
    await expect(
      page.getByText("Sign in or sign up to leave a comment"),
    ).toBeVisible();
  });

  test("Should sort articles by Newest", async ({ page }) => {
    await page.goto("http://localhost:3000/articles");
    await page.waitForSelector("article");

    const articles = await page.$$eval("article", (articles) => {
      return articles.map((article) => ({
        date: article.querySelector("time")?.dateTime,
      }));
    });
    const isSortedNewest = articles.every((article, index, arr) => {
      if (index === arr.length - 1) return true;
      if (!article.date || !arr[index + 1].date) return false;
      return new Date(article.date) >= new Date(arr[index + 1].date!);
    });
    expect(isSortedNewest).toBeTruthy();
  });

  test("Should sort articles by Oldest", async ({ page }) => {
    await page.goto("http://localhost:3000/articles?filter=oldest");
    await page.waitForSelector("article");
    const articles = await page.$$eval("article", (articles) => {
      return articles.map((article) => ({
        date: article.querySelector("time")?.dateTime,
      }));
    });
    const isSortedOldest = articles.every((article, index, arr) => {
      if (index === arr.length - 1) return true;
      if (!article.date || !arr[index + 1].date) return false;
      return new Date(article.date) <= new Date(arr[index + 1].date!);
    });
    expect(isSortedOldest).toBeTruthy();
  });

  test("Should sort articles by Top - likes", async ({ page }) => {
    await page.goto("http://localhost:3000/articles?filter=top");
    await page.waitForSelector("article");

    const articles = await page.$$eval("article", (articles) => {
      return articles.map((article) => ({
        likes: parseInt(
          article.querySelector("[data-likes]")?.getAttribute("data-likes") ||
            "0",
          10,
        ),
      }));
    });

    const isSortedTop = articles.every((article, index, arr) => {
      if (index === arr.length - 1) return true;
      return article.likes >= arr[index + 1].likes;
    });
    expect(isSortedTop).toBeTruthy();
  });
});

test.describe("Authenticated Articles Page", () => {
  test.beforeEach(async ({ page }) => {
    await loggedInAsUserOne(page);
  });
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

    // This delays the requests by 100ms.
    // This is needed as the load more article request was resolving too fast
    await page.route("**/*", async (route) => {
      await new Promise((f) => setTimeout(f, 100));
      await route.continue();
    });

    if (!isMobile) {
      const articleLocator = page.locator("article");
      const initialArticleCount = await articleLocator.count();

      await page
        .getByRole("link", { name: "Code Of Conduct" })
        .scrollIntoViewIfNeeded();

      // We expect to see the loading indicator become visible why loading and then hidden when more articles are loaded
      await expect(page.getByTestId("article-loading-indicator")).toBeVisible();
      await expect(page.getByTestId("article-loading-indicator")).toBeHidden();

      expect(await articleLocator.count()).toBeGreaterThan(initialArticleCount);
    }

    await expect(page.getByRole("link", { name: "Home" })).toBeVisible();
    await expect(
      page.getByLabel("Footer").getByRole("link", { name: "Events" }),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: "Sponsorship" })).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Code Of Conduct" }),
    ).toBeVisible();
  });

  test("Should write and publish an article", async ({ page, isMobile }) => {
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

    await expect(page.getByRole("button", { name: "Publish" })).toBeVisible();
    await page.getByRole("button", { name: "Publish" }).click();

    await expect(
      page.getByRole("button", { name: "Publish now" }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Publish now" }).click();
    await page.waitForURL(
      /^http:\/\/localhost:3000\/articles\/lorem-ipsum-.*$/,
    );

    await expect(page.getByText(articleExcerpt)).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Lorem Ipsum" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Written by E2E Test User One" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Discussion (0)" }),
    ).toBeVisible();
    await expect(page.getByLabel("like-trigger")).toBeVisible();
    await expect(page.getByLabel("bookmark-trigger")).toBeVisible();
  });

  test("Should post a comment on an article", async ({ page }, workerInfo) => {
    const commentContent = `This is a great read. Thanks for posting! Sent from ${workerInfo.project.name} + ${randomUUID()}`;
    await page.goto("http://localhost:3000");
    // Waits for articles to be loaded
    await expect(page.getByText("Read Full Article").first()).toBeVisible();
    await page.getByText("Read Full Article").first().click();
    await page.waitForURL(/^http:\/\/localhost:3000\/articles\/.*$/);

    await expect(page.getByPlaceholder("What do you think?")).toBeVisible();
    await page.getByPlaceholder("What do you think?").fill(commentContent);
    await page.getByRole("button", { name: "Submit" }).click();

    await expect(page.getByText(commentContent)).toBeVisible();
  });

  test("Should be able reply to a comment", async ({ page }) => {
    await page.goto("http://localhost:3000/articles/e2e-test-slug-published");
    const numberOfCommentsIntially = await page
      .locator("div")
      .filter({ hasText: /^Thanks for the positive feedback!$/ })
      .count();
    await expect(page.getByText(articleExcerpt)).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Published Article" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Written by E2E Test User One" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Discussion (0)" }),
    ).toBeVisible();
    await expect(page.getByLabel("like-trigger")).toBeVisible();
    await expect(page.getByLabel("bookmark-trigger")).toBeVisible();

    await page.getByRole("button", { name: "Reply" }).first().click();

    await page.locator("#reply").fill("Thanks for the positive feedback!");
    await page.getByRole("button", { name: "Submit" }).nth(1).click();
    await page.waitForTimeout(250);

    await expect(
      page.getByText("AUTHOR", { exact: true }).first(),
    ).toBeVisible();
    const numberOfCommentsAfteringCommenting = await page
      .locator("div")
      .filter({ hasText: /^Thanks for the positive feedback!$/ })
      .count();
    expect(numberOfCommentsAfteringCommenting).toBeGreaterThan(
      numberOfCommentsIntially,
    );
    await expect(
      page
        .getByRole("link", { name: "E2E Test User One", exact: true })
        .nth(numberOfCommentsIntially + 1),
    ).toBeVisible();
  });
});
