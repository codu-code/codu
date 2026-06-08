import { test, expect } from "@playwright/test";
import { loggedInAsUserOne } from "./utils";

// The relaunch made the feed the homepage: "/" renders the feed directly (no
// redirect). "/feed" 308-redirects to "/" for legacy links/bookmarks.

test.describe("Authenticated home → feed", () => {
  test.beforeEach(async ({ page }) => {
    await loggedInAsUserOne(page);
  });

  test("Root renders the feed", async ({ page }) => {
    await page.goto("http://localhost:3000/");
    await expect(page).toHaveURL("http://localhost:3000/");
    await expect(
      page.getByRole("heading", { name: "Feed", level: 1 }),
    ).toBeVisible();
  });

  test("Legacy /feed redirects to the homepage", async ({ page }) => {
    await page.goto("http://localhost:3000/feed");
    await expect(page).toHaveURL("http://localhost:3000/");
  });
});

test.describe("Unauthenticated home → feed", () => {
  test("Root renders the public feed with a join CTA", async ({ page }) => {
    await page.goto("http://localhost:3000/");
    await expect(
      page.getByRole("heading", { name: "Feed", level: 1 }),
    ).toBeVisible();
    // The shell offers a free account (top bar + sign-in bar).
    await expect(
      page.getByRole("button", { name: "Join free" }).first(),
    ).toBeVisible();
  });
});
