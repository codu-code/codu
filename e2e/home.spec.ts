import { test, expect } from "@playwright/test";

test.describe("Confirm homepage content", () => {
  test("Shared content", async ({ page }) => {
    await page.goto("/");
    // Check headers

    await expect(page.locator("h1")).toContainText("A space for coders");

    await expect(page.locator("h2")).toContainText(
      "Sign up today to become a writer and get a free invite to our Discord community",
    );

    await expect(page.locator("h3")).toContainText("Trending");

    await expect(page.locator("h3")).toContainText("Trending");
  });

  test("Different devices", async ({ page, isMobile }) => {
    await page.goto("/");

    const elementVisible = await page
      .locator('text="Recommended topics"')
      .isVisible();

    if (isMobile) {
      expect(elementVisible).toBe(false);
    } else {
      expect(elementVisible).toBe(true);
    }
  });
});
