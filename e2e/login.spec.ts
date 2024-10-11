import { test, expect } from "playwright/test";
import "dotenv/config";

test.use({ storageState: { cookies: [], origins: [] } });

test.describe("Login Page", () => {
  test("should display the welcome message", async ({ page }) => {
    await page.goto("http://localhost:3000/get-started");
    const welcomeMessage = page.getByText("Sign in or create your accounttton");
    expect(welcomeMessage).toBeTruthy();
  });
  test("should display the Github login button and complete Github SSO flow", async ({
    page,
  }) => {
    await page.goto("http://localhost:3000/get-started");
    expect(page.getByTestId("github-login-button")).toBeVisible();
    await page.waitForLoadState();
  });

  test("should display the Gitlab login button", async ({ page }) => {
    await page.goto("http://localhost:3000/get-started");
    expect(page.getByTestId("gitlab-login-button")).toBeVisible();
  });
});
