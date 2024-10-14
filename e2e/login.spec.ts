import { test, expect } from "playwright/test";
import "dotenv/config";

test.describe("Login Page", () => {
  test("should display the welcome message", async ({ page }) => {
    await page.goto("http://localhost:3000/get-started");
    const welcomeMessage = page.getByText("Sign in or create your accounttton");
    expect(welcomeMessage).toBeTruthy();
  });
  test("should display the Github login button", async ({ page }) => {
    await page.context().clearCookies();
    await page.goto("http://localhost:3000/get-started");
    await page.waitForTimeout(3000);
    await expect(page.getByTestId("github-login-button")).toBeVisible();
  });

  test("should display the Gitlab login button", async ({ page }) => {
    await page.context().clearCookies();
    await page.goto("http://localhost:3000/get-started");
    await page.waitForLoadState();
    await expect(page.getByTestId("gitlab-login-button")).toBeVisible();
  });
});
