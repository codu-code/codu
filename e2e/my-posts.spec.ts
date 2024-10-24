import test from "@playwright/test";

test.describe("Unauthenticated my-posts Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
  });
  //
  // Replace with tests for unauthenticated users
});

test.describe("Authenticated my-posts Page", () => {
  //
  // Replace with tests for authenticated users
});
