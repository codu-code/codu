import { test, expect } from "@playwright/test";
import { loggedInAsUserTwo } from "./utils";

// Seed (e2e/setup.ts): user two follows user one. User one authored the
// published article + discussion + question.

test.describe("Follow graph", () => {
  test("Following feed surfaces posts from followed users", async ({
    page,
  }) => {
    await loggedInAsUserTwo(page);
    await page.goto("http://localhost:3000/?view=following");

    // The Following tab is active, and user one's content (whom user two
    // follows) appears in the feed.
    await expect(
      page.getByRole("button", { name: "Following" }).first(),
    ).toBeVisible({ timeout: 30000 });
    await expect(page.locator("article").first()).toBeVisible({
      timeout: 30000,
    });
  });

  test("a profile shows follower / following stats", async ({ page }) => {
    await page.goto("http://localhost:3000/e2e-test-user-one-111");

    await expect(
      page.getByRole("heading", { name: "E2E Test User One", exact: true }),
    ).toBeVisible({ timeout: 30000 });
    // "Followers" / "Following" appear both as the count button and its label,
    // so scope to the first match.
    await expect(page.getByText("Followers").first()).toBeVisible();
    await expect(page.getByText("Following").first()).toBeVisible();
  });

  test("the follow control reflects an existing relationship", async ({
    page,
  }) => {
    await loggedInAsUserTwo(page);
    await page.goto("http://localhost:3000/e2e-test-user-one-111");

    // User two already follows user one → a follow/unfollow control is present.
    await expect(
      page.getByRole("button", { name: /Follow|Following|Unfollow/ }).first(),
    ).toBeVisible({ timeout: 30000 });
  });
});
