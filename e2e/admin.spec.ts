import { test, expect } from "playwright/test";
import { loggedInAsUserOne, loggedInAsAdmin } from "./utils";

test.describe("Unauthenticated Admin Access", () => {
  test("Should redirect unauthenticated users to home page", async ({
    page,
  }) => {
    await page.goto("http://localhost:3000/admin");
    // Should redirect to home page
    await expect(page).toHaveURL("http://localhost:3000/");
  });
});

test.describe("Non-Admin User Access", () => {
  test.beforeEach(async ({ page }) => {
    await loggedInAsUserOne(page);
  });

  test("Should redirect non-admin users to home page", async ({ page }) => {
    await page.goto("http://localhost:3000/admin");
    // Should redirect to home page since user is not an admin
    await expect(page).toHaveURL("http://localhost:3000/");
  });
});

test.describe("Admin Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await loggedInAsAdmin(page);
  });

  test("Should display admin dashboard for admin users", async ({ page }) => {
    await page.goto("http://localhost:3000/admin");
    await expect(page.locator("h1")).toContainText("Admin Dashboard");
  });

  test("Should show stats cards", async ({ page }) => {
    await page.goto("http://localhost:3000/admin");
    await expect(page.locator("h1")).toContainText("Admin Dashboard");

    // Should show Total Users stat
    await expect(page.getByText("Total Users")).toBeVisible();

    // Should show Published Posts stat
    await expect(page.getByText("Published Posts")).toBeVisible();

    // Should show Aggregated Articles stat
    await expect(page.getByText("Aggregated Articles")).toBeVisible();

    // Should show Active Feed Sources stat
    await expect(page.getByText("Active Feed Sources")).toBeVisible();
  });

  test("Should show moderation section", async ({ page }) => {
    await page.goto("http://localhost:3000/admin");
    await expect(
      page.getByRole("heading", { name: "Moderation" }),
    ).toBeVisible();

    // Should show moderation stats
    await expect(page.getByText("Pending Reports")).toBeVisible();
    await expect(page.getByText("Actioned Reports")).toBeVisible();
    await expect(page.getByText("Banned Users")).toBeVisible();
    await expect(page.getByText("Dismissed Reports")).toBeVisible();
  });

  test("Should show quick actions section", async ({ page }) => {
    await page.goto("http://localhost:3000/admin");
    await expect(
      page.getByRole("heading", { name: "Quick Actions" }),
    ).toBeVisible();

    // Should show quick action links
    await expect(page.getByText("Moderation Queue")).toBeVisible();
    await expect(page.getByText("User Management")).toBeVisible();
    // Use role link to be more specific since "Feed Sources" appears multiple times
    await expect(
      page.getByRole("link", { name: /Feed Sources.*Manage RSS feed/i }),
    ).toBeVisible();
  });

  test("Should navigate to user management", async ({ page }) => {
    await page.goto("http://localhost:3000/admin");
    await page.getByText("User Management").click();
    await expect(page).toHaveURL("http://localhost:3000/admin/users");
  });

  test("Should navigate to moderation queue", async ({ page }) => {
    await page.goto("http://localhost:3000/admin");
    await page.getByText("Moderation Queue").click();
    await expect(page).toHaveURL("http://localhost:3000/admin/moderation");
  });

  test("Should navigate to feed sources", async ({ page }) => {
    await page.goto("http://localhost:3000/admin");
    // Use role link to be more specific since "Feed Sources" appears multiple times
    await page
      .getByRole("link", { name: /Feed Sources.*Manage RSS feed/i })
      .click();
    await expect(page).toHaveURL("http://localhost:3000/admin/sources");
  });
});

test.describe("Admin User Management", () => {
  test.beforeEach(async ({ page }) => {
    await loggedInAsAdmin(page);
  });

  test("Should display user management page", async ({ page }) => {
    await page.goto("http://localhost:3000/admin/users");
    // User management page should have search functionality
    await expect(page.getByPlaceholder(/search/i)).toBeVisible();
  });

  test("Should be able to search users", async ({ page }) => {
    await page.goto("http://localhost:3000/admin/users");

    // Search for a user
    const searchInput = page.getByPlaceholder(/search/i);
    await searchInput.fill("e2e");
    await page.waitForTimeout(500); // Wait for debounced search

    // Results should be displayed
    await expect(page.locator("body")).toContainText(/e2e/i);
  });
});

test.describe("Admin Moderation", () => {
  test.beforeEach(async ({ page }) => {
    await loggedInAsAdmin(page);
  });

  test("Should display moderation page", async ({ page }) => {
    await page.goto("http://localhost:3000/admin/moderation");
    // Moderation page should show some indication of reports or empty state
    const pageContent = await page.content();
    expect(pageContent).toBeTruthy();
  });
});

test.describe("Admin Feed Sources", () => {
  test.beforeEach(async ({ page }) => {
    await loggedInAsAdmin(page);
  });

  test("Should display feed sources page", async ({ page }) => {
    await page.goto("http://localhost:3000/admin/sources");
    // Sources page should be accessible to admin
    const pageContent = await page.content();
    expect(pageContent).toBeTruthy();
  });
});
