import { test, expect } from "@playwright/test";
import { loggedInAsUserOne } from "./utils";

test.describe("Authenticated homepage", () => {
  test.beforeEach(async ({ page }) => {
    await loggedInAsUserOne(page);
  });
  test("Homepage view", async ({ page, isMobile }) => {
    await page.goto("http://localhost:3000/");

    // For authenticated users, check for "Trending" heading (h3) instead of h1
    // h1 only exists for unauthenticated users in the Hero section
    await expect(page.getByRole("heading", { name: "Trending" })).toBeVisible();

    if (!isMobile) {
      // Desktop should show "Your Posts" link in header/sidebar
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
