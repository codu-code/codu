import { test, expect } from "playwright/test";
import { randomUUID } from "crypto";
import {
  loggedInAsUserOne,
  loggedInAsUserTwo,
  createNotification,
  clearNotifications,
} from "./utils";
import { E2E_USER_ONE_ID, E2E_USER_TWO_ID } from "./constants";

test.describe("Notifications Page", () => {
  test.describe("Unauthenticated", () => {
    test("Should redirect to login when not authenticated", async ({
      page,
    }) => {
      await page.goto("http://localhost:3000/notifications");
      // Should redirect to sign in
      await expect(page).toHaveURL(/.*get-started.*/);
    });
  });

  test.describe("Authenticated - No Notifications", () => {
    test.beforeEach(async ({ page }) => {
      await loggedInAsUserTwo(page);
    });

    test("Should show empty state when no notifications", async ({ page }) => {
      await page.goto("http://localhost:3000/notifications");
      await expect(
        page.getByRole("heading", { name: "Notifications" }),
      ).toBeVisible();
      // Should show empty state message
      await expect(page.getByText("No new notifications")).toBeVisible();
    });
  });

  test.describe("Authenticated - With Notifications", () => {
    test.beforeEach(async ({ page }) => {
      await loggedInAsUserOne(page);
    });

    test("Should display notifications page with correct styling", async ({
      page,
    }) => {
      // First create a test notification for user one
      await createNotification({
        userId: E2E_USER_ONE_ID,
        notifierId: E2E_USER_TWO_ID,
        type: 0, // NEW_COMMENT_ON_YOUR_POST
      });

      await page.goto("http://localhost:3000/notifications");
      await expect(
        page.getByRole("heading", { name: "Notifications" }),
      ).toBeVisible();

      // Wait for notifications to load
      await page.waitForSelector('[class*="rounded-lg"]', { timeout: 10000 });

      // Verify notification card styling (rounded corners, proper borders)
      const notificationCard = page
        .locator('[class*="rounded-lg"][class*="border-neutral-200"]')
        .first();
      await expect(notificationCard).toBeVisible();
    });

    test("Should show 'Mark all as read' button when notifications exist", async ({
      page,
    }) => {
      // Create a notification first
      await createNotification({
        userId: E2E_USER_ONE_ID,
        notifierId: E2E_USER_TWO_ID,
        type: 0,
      });

      await page.goto("http://localhost:3000/notifications");
      await expect(
        page.getByRole("button", { name: "Mark all as read" }),
      ).toBeVisible();
    });

    test("Should be able to mark individual notification as read", async ({
      page,
    }) => {
      // Create a notification
      await createNotification({
        userId: E2E_USER_ONE_ID,
        notifierId: E2E_USER_TWO_ID,
        type: 0,
      });

      await page.goto("http://localhost:3000/notifications");

      // Wait for notification to appear
      await page.waitForSelector('button[title="Mark as read"]', {
        timeout: 10000,
      });

      // Click mark as read button
      await page.locator('button[title="Mark as read"]').first().click();

      // Wait for the notification to disappear or the count to decrease
      await page.waitForTimeout(1000);
    });
  });

  test.describe("Notification Creation Flow", () => {
    test.beforeEach(async () => {
      // Clear notifications before each test to avoid strict mode violations
      await clearNotifications(E2E_USER_ONE_ID);
    });

    test("Should create notification when user comments on another user's post", async ({
      page,
    }) => {
      // Log in as user two
      await loggedInAsUserTwo(page);

      // Go to user one's published article
      await page.goto(
        "http://localhost:3000/e2e-test-user-one-111/e2e-test-slug-published",
      );

      // Wait for discussion section to load
      await expect(
        page.getByRole("heading", { name: /^Discussion \(\d+\)$/ }),
      ).toBeVisible({ timeout: 15000 });

      // Post a comment
      await page
        .getByRole("button", { name: "Join the conversation..." })
        .click();

      await page.waitForTimeout(500);
      await page.locator(".ProseMirror").first().click();
      const commentText = `E2E notification test comment ${randomUUID()}`;
      await page.keyboard.type(commentText);
      await page.getByRole("button", { name: "Comment", exact: true }).click();

      // Verify comment was posted
      await expect(page.getByText(commentText)).toBeVisible({ timeout: 10000 });

      // Now log in as user one and check notifications
      await loggedInAsUserOne(page);
      await page.goto("http://localhost:3000/notifications");

      // Should see notification from user two
      await expect(
        page.getByRole("heading", { name: "Notifications" }),
      ).toBeVisible();

      // Wait for notifications to load - use first() to handle multiple notifications
      await expect(page.getByText("E2E Test User Two").first()).toBeVisible({
        timeout: 15000,
      });
      await expect(
        page.getByText("started a discussion on your post").first(),
      ).toBeVisible();
    });

    test("Should create notification when user replies to another user's comment", async ({
      page,
    }) => {
      // First, user one comments on their own post
      await loggedInAsUserOne(page);
      await page.goto(
        "http://localhost:3000/e2e-test-user-one-111/e2e-test-slug-published",
      );

      await expect(
        page.getByRole("heading", { name: /^Discussion \(\d+\)$/ }),
      ).toBeVisible({ timeout: 15000 });

      // Post a comment as user one
      await page
        .getByRole("button", { name: "Join the conversation..." })
        .click();
      await page.waitForTimeout(500);
      await page.locator(".ProseMirror").first().click();
      const originalComment = `Original comment for reply test ${randomUUID()}`;
      await page.keyboard.type(originalComment);
      await page.getByRole("button", { name: "Comment", exact: true }).click();
      await expect(page.getByText(originalComment)).toBeVisible({
        timeout: 10000,
      });

      // Now log in as user two and reply to user one's comment
      await loggedInAsUserTwo(page);
      await page.goto(
        "http://localhost:3000/e2e-test-user-one-111/e2e-test-slug-published",
      );

      await expect(page.getByText(originalComment)).toBeVisible({
        timeout: 15000,
      });

      // Click reply on the first comment
      await page.getByRole("button", { name: "Reply" }).first().click();

      // Wait for reply editor to expand
      await page.waitForTimeout(500);
      // Focus the reply editor and type
      await page.locator(".ProseMirror").last().click();
      const replyText = `Reply to trigger notification ${randomUUID()}`;
      await page.keyboard.type(replyText);

      // Submit the reply - use nth(1) to get the reply button in the form, not the expand button
      await page
        .getByRole("button", { name: "Reply", exact: true })
        .nth(1)
        .click();

      await expect(page.getByText(replyText)).toBeVisible({ timeout: 15000 });

      // Log back in as user one and check for notification
      await loggedInAsUserOne(page);
      await page.goto("http://localhost:3000/notifications");

      await expect(page.getByText("E2E Test User Two").first()).toBeVisible({
        timeout: 15000,
      });
      await expect(
        page.getByText("replied to your comment").first(),
      ).toBeVisible();
    });
  });
});
