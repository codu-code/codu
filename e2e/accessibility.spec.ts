import { test, expect } from "@playwright/test";

test.describe("Accessibility Tests", () => {
  test.describe("Confirm all images on homepage have alt text", () => {
    test("Shared content", async ({ page }) => {
      const imagesWithoutAltText = await page.$$eval(
        "img:not([alt])",
        (images) => images.length,
      );
      expect(imagesWithoutAltText).toBe(0); // All images should have alt text
    });
  });
});
