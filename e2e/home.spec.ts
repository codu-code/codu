import { test, expect } from "@playwright/test";

test.describe("Confirm homepage content", () => {
  test("Shared content", async ({ page }) => {
    await page.goto("http://localhost:3000/");
    // Check headers

    await expect(page.locator("h1")).toContainText(
      "The free web developer community",
    );

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
