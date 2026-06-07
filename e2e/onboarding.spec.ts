import { test, expect } from "@playwright/test";
import { loggedInAsUserOne } from "./utils";

// The relaunch added a /welcome onboarding flow. Logged-out visitors are sent
// to /get-started; logged-in visitors either see step 1 ("What are you into?")
// or, if already onboarded, get redirected to /feed.

test.describe("Onboarding — logged out", () => {
  test("Visiting /welcome redirects to /get-started", async ({ page }) => {
    await page.context().clearCookies();
    await page.goto("http://localhost:3000/welcome");
    await expect(page).toHaveURL(/\/get-started/);
  });
});

test.describe("Onboarding — logged in", () => {
  test.beforeEach(async ({ page }) => {
    await loggedInAsUserOne(page);
  });

  test("Visiting /welcome shows step 1, or redirects to the feed if onboarded", async ({
    page,
  }) => {
    await page.goto("http://localhost:3000/welcome");

    // Either we're still on /welcome with the step-1 heading, or we've been
    // bounced to /feed because the user is already onboarded. Both are valid.
    const onboardingHeading = page.getByRole("heading", {
      name: "What are you into?",
    });
    const feedHeading = page.locator("h1", { hasText: "Feed" });

    await expect(onboardingHeading.or(feedHeading)).toBeVisible({
      timeout: 15000,
    });

    // And the URL is one of the two expected states.
    await expect(page).toHaveURL(/\/welcome|\/feed/);
  });
});
