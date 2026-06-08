import { test, expect } from "@playwright/test";

// Seed (e2e/setup.ts): user one has topics ["AI","Testing","DevOps"] and a few
// point events (post_published + daily_active). The relaunch profile drops the
// banner + About tab — it shows interests + Posts/Achievements only.

test.describe("Profile", () => {
  test("shows name, interests, and Posts/Achievements tabs (no About)", async ({
    page,
  }) => {
    await page.goto("http://localhost:3000/e2e-test-user-one-111");

    await expect(
      page.getByRole("heading", { name: "E2E Test User One", exact: true }),
    ).toBeVisible({ timeout: 30000 });

    // Seeded topics render as interest tags.
    await expect(page.getByText("Testing").first()).toBeVisible();

    // Tabs are buttons (the stat labels are non-interactive), and crucially the
    // old About tab is gone.
    await expect(page.getByRole("button", { name: "Posts" })).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Achievements" }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "About" })).toHaveCount(0);
  });

  test("Achievements tab surfaces points / streak", async ({ page }) => {
    await page.goto("http://localhost:3000/e2e-test-user-one-111");
    await expect(
      page.getByRole("heading", { name: "E2E Test User One", exact: true }),
    ).toBeVisible({ timeout: 30000 });

    await page.getByRole("button", { name: "Achievements" }).click();
    await expect(page.getByText(/points/i).first()).toBeVisible({
      timeout: 20000,
    });
  });
});
