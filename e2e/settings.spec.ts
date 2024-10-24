import test from "@playwright/test";

test.describe("Unauthenticated setttings Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
  });
  //
  // Replace with tests for unauthenticated users
});

test.describe("Authenticated settings Page", () => {
  //
  // Replace with tests for authenticated users
});
