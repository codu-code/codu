import { test, expect } from "@playwright/test";
import { loggedInAsUserOne } from "./utils";

// The relaunch removed the marketing homepage: "/" 308-redirects to the feed,
// which is the landing surface for everyone (reading is free).

test.describe("Authenticated home → feed", () => {
  test.beforeEach(async ({ page }) => {
    await loggedInAsUserOne(page);
  });
  test("Root redirects to the feed", async ({ page }) => {
    await page.goto("http://localhost:3000/");
    await expect(page).toHaveURL(/\/feed/);
    await expect(page.locator("h1")).toContainText("Feed");
  });
});

test.describe("Unauthenticated home → feed", () => {
  test("Root redirects to the public feed with a join CTA", async ({
    page,
  }) => {
    await page.goto("http://localhost:3000/");
    await expect(page).toHaveURL(/\/feed/);
    await expect(page.locator("h1")).toContainText("Feed");
    // The shell offers a free account (top bar + sign-in bar).
    await expect(
      page.getByRole("button", { name: "Join free" }).first(),
    ).toBeVisible();
  });
});
