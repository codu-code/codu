import { test, expect } from "@playwright/test";

test.describe("Confirm homepage content", () => {
  test("Shared content", async ({ page }) => {
    await page.goto("http://localhost:3000/");
    // Check headers

    await expect(page.locator("h1")).toContainText("A space for coders");
    await expect(page.locator("h1")).not.toContainText("Unwanted text");

    await expect(page.locator("h2")).toContainText(
      "Sign up today to become a writer and get a free invite to our Discord community",
    );

    await expect(page.locator("h3")).toContainText("Trending");

    await expect(page.locator("h3")).toContainText("Trending");
  });

  test.describe("Confirm image accessibiliy content", () => {
    test("Shared content", async ({ page }) => {
      // Accessibility
      const imagesWithoutAltText = await page.$$eval(
        "img:not([alt])",
        (images) => images.length,
      );
      expect(imagesWithoutAltText).toBe(0); // All images should have alt text
    });
  });
});
