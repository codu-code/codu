import { test, expect } from "playwright/test";

test.afterEach(async ({ page }) => {
  // Sign out the user after all tests are done
  await page.goto("http://localhost:3000/api/auth/signout");
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page.locator("#submitButton")).toBeHidden();
});

test.beforeEach(async ({ page }) => {
  await page.goto("http://localhost:3000/get-started");
});

test.describe("Login Page", () => {
  test("should display the login button", async ({ page }) => {
    const loginButton = page.getByRole("button", {
      name: "Continue with GitHub",
    });
    expect(loginButton).toBeTruthy();
  });

  test("should navigate to GitHub login page when clicking the login button", async ({
    page,
  }) => {
    const button = page.getByRole("button", {
      name: "Continue with GitHub",
    });

    await button.click();
    await page.waitForURL("https://github.com/**");

    const loginField = page.locator("#login_field");
    await loginField.isVisible();

    expect(page.getByLabel("Username or email address")).toBeTruthy();
    expect(page.getByLabel("Password")).toBeTruthy();
  });
});
