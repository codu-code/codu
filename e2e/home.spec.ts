import { test, expect } from "@playwright/test";
import { loggedInAsUserOne } from "./utils";

test.describe("Authenticated homepage", () => {
  test.beforeEach(async ({ page }) => {
    await loggedInAsUserOne(page);
  });
  test("Homepage view", async ({ page, isMobile }) => {
    await page.goto("http://localhost:3000/");

    await expect(page.locator("h1")).not.toContainText("Unwanted text");

    // Check for "Topics" section on sidebar (desktop only)
    const topicsVisible = await page.locator('text="Topics"').first().isVisible();

    if (isMobile) {
      // Topics sidebar not visible on mobile
      expect(topicsVisible).toBe(false);
    } else {
      // Desktop should show "Your Posts" link in header
      await expect(
        page.getByRole("link", {
          name: "Your Posts",
        }),
      ).toBeVisible();
    }
  });
});

test.describe("Unauthenticated homepage", () => {
  test("Homepage view", async ({ page }) => {
    await page.goto("http://localhost:3000/");

    await expect(page.locator("h1")).not.toContainText("Unwanted text");

    // Check for the main heading on homepage
    await expect(page.locator("h1")).toContainText(
      "The free web developer community",
    );

    // Check for sign up CTA (updated text from the new homepage)
    await expect(
      page.getByRole("heading", { name: /Sign up today/i }),
    ).toBeVisible();
  });
});
