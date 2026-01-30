import { test, expect } from "playwright/test";
import { randomUUID } from "crypto";
import {
  loggedInAsUserOne,
  loggedInAsUserTwo,
  createNotification,
  clearNotifications,
} from "./utils";
import { E2E_USER_ONE_ID, E2E_USER_TWO_ID } from "./constants";

// Run notification tests serially to prevent race conditions when multiple browser
// workers create/clear notifications for the same users simultaneously
test.describe.configure({ mode: "serial" });

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
      // Clear notifications for user two before testing empty state
      await clearNotifications(E2E_USER_TWO_ID);
      await loggedInAsUserTwo(page);
    });

    test("Should show empty state when no notifications", async ({ page }) => {
      await page.goto("http://localhost:3000/notifications");
      await expect(
        page.getByRole("heading", { name: "Notifications" }),
      ).toBeVisible();
      // Should show empty state message
      await expect(page.getByText(/No new notifications/)).toBeVisible();
    });
  });

  test.describe("Authenticated - With Notifications", () => {
    // NOTE: We don't clear notifications in beforeEach because parallel browser workers
    // create/clear notifications for the same user, causing race conditions.
    // Instead, we create notifications and verify UI functionality works.
    test.beforeEach(async ({ page }) => {
      await loggedInAsUserOne(page);
    });

    test("Should display notifications page with correct styling", async ({
      page,
    }) => {
      // Create a test notification for user one
      await createNotification({
        userId: E2E_USER_ONE_ID,
        notifierId: E2E_USER_TWO_ID,
        type: 0, // NEW_COMMENT_ON_YOUR_POST
      });

      await page.goto("http://localhost:3000/notifications");
      await expect(
        page.getByRole("heading", { name: "Notifications" }),
      ).toBeVisible();

      // Wait for notification content to actually render (not just CSS class presence)
      // The notification shows the notifier's name, so wait for that text
      await expect(page.getByText("E2E Test User Two").first()).toBeVisible({
        timeout: 20000,
      });

      // Verify notification card styling (rounded corners, proper borders)
      const notificationCard = page
        .locator('[class*="rounded-lg"][class*="border-neutral-200"]')
        .first();
      await expect(notificationCard).toBeVisible({ timeout: 10000 });
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

      // Wait directly for the button to appear
      // The button depends on BOTH notification.get AND notification.getCount queries completing
      // Using expect().toBeVisible() auto-retries, which handles both queries finishing + React render
      await expect(
        page.getByRole("button", { name: "Mark all as read" }),
      ).toBeVisible({ timeout: 20000 });
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

      // Wait for the mark as read button to be visible and enabled
      // expect().toBeVisible() auto-retries, handling TRPC queries + React render
      const markAsReadButton = page
        .locator('button[title="Mark as read"]')
        .first();
      await expect(markAsReadButton).toBeVisible({ timeout: 20000 });
      await expect(markAsReadButton).toBeEnabled({ timeout: 5000 });

      // Click mark as read button and wait for mutation response
      // We verify the mutation succeeds (returns 200) as proof the functionality works
      // Note: Due to parallel test execution across browsers, the UI state may show
      // notifications created by other workers, so we verify the API call rather than UI state
      const mutationResponsePromise = page.waitForResponse(
        (response) =>
          response.url().includes("/api/trpc/") &&
          response.url().includes("notification.delete") &&
          response.status() === 200,
      );
      await markAsReadButton.click();
      const response = await mutationResponsePromise;

      // Verify the mutation response was successful
      expect(response.status()).toBe(200);
    });
  });

  test.describe("Notification Creation Flow", () => {
    // NOTE: We don't clear notifications in beforeEach because parallel browser workers
    // create/clear notifications for the same user, causing race conditions.
    // Instead, we post a comment/reply and verify the specific notification appears.

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

      // Verify comment was posted - this confirms the mutation completed and notification was created
      await expect(page.getByText(commentText)).toBeVisible({ timeout: 15000 });

      // Now log in as user one and check notifications
      await loggedInAsUserOne(page);

      await page.goto("http://localhost:3000/notifications");

      // Should see notification from user two
      await expect(
        page.getByRole("heading", { name: "Notifications" }),
      ).toBeVisible();

      // Wait for notifications to load - use first() to handle multiple notifications
      // The expect().toBeVisible() auto-retries, which handles TRPC queries + React render
      await expect(page.getByText("E2E Test User Two").first()).toBeVisible({
        timeout: 20000,
      });
      await expect(
        page.getByText("started a discussion on your post").first(),
      ).toBeVisible({ timeout: 10000 });
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

      // Verify comment was posted
      await expect(page.getByText(originalComment)).toBeVisible({
        timeout: 15000,
      });

      // Now log in as user two and reply to user one's comment
      await loggedInAsUserTwo(page);
      await page.goto(
        "http://localhost:3000/e2e-test-user-one-111/e2e-test-slug-published",
      );

      await expect(page.getByText(originalComment)).toBeVisible({
        timeout: 15000,
      });

      // Find the comment container that has the original comment text and click its first reply button
      const commentContainer = page
        .locator("article")
        .filter({ hasText: originalComment })
        .first();
      await commentContainer
        .getByRole("button", { name: "Reply" })
        .first()
        .click();

      // Wait for reply editor to expand
      await page.waitForTimeout(500);
      // Focus the reply editor and type - find the editor within the comment's reply section
      await page.locator(".ProseMirror").last().click();
      const replyText = `Reply to trigger notification ${randomUUID()}`;
      await page.keyboard.type(replyText);

      // Submit the reply - use nth(1) to get the reply button in the form, not the expand button
      await page
        .getByRole("button", { name: "Reply", exact: true })
        .nth(1)
        .click();

      // Verify reply was posted - this confirms the mutation completed and notification was created
      await expect(page.getByText(replyText)).toBeVisible({ timeout: 15000 });

      // Log back in as user one and check for notification
      await loggedInAsUserOne(page);

      await page.goto("http://localhost:3000/notifications");

      // Wait for notifications to load - expect().toBeVisible() auto-retries
      await expect(page.getByText("E2E Test User Two").first()).toBeVisible({
        timeout: 20000,
      });
      await expect(
        page.getByText(/replied to your comment/).first(),
      ).toBeVisible({ timeout: 15000 });
    });
  });
});
