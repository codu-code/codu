import { test, expect } from "@playwright/test";
import { loggedInAsUserOne } from "./utils";

test.describe("Authenticated homepage", () => {
  test.beforeEach(async ({ page }) => {
    await loggedInAsUserOne(page);
  });
  test("Homepage view", async ({ page, isMobile }) => {
    await page.goto("http://localhost:3000/");

    await expect(page.locator("h1")).not.toContainText("Unwanted text");

    const elementVisible = await page
      .locator('text="Popular topics"')
      .isVisible();

    if (isMobile) {
      expect(elementVisible).toBe(false);
    } else {
      await expect(
        page.getByRole("link", {
          name: "Your Posts",
        }),
      ).toBeVisible();
      expect(elementVisible).toBe(true);
    }
  });
});

test.describe("Unauthenticated homepage", () => {
  test("Homepage view", async ({ page }) => {
    await page.goto("http://localhost:3000/");

    await expect(page.locator("h1")).not.toContainText("Unwanted text");
    await expect(page.locator("h2")).toContainText(
      "Sign up today to become a writer and get a free invite to our Discord community",
    );
    await expect(page.locator("h1")).toContainText(
      "The free web developer community",
    );
  });
});
