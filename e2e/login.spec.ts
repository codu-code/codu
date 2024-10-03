import { test, expect } from "playwright/test";

test.describe("Login Page", () => {
  test("should display the login button", async ({ page }) => {
    await page.goto("http://localhost:3000/get-started");
    const loginButton = page.getByRole("button", {
      name: "Login with GitHub",
    });
    expect(loginButton).toBeTruthy();
    await page.goto("http://localhost:3000/api/auth/signout");
    await page.getByRole("button", { name: "Sign out" }).click();
    await expect(page.locator("#submitButton")).toBeHidden();
  });

  test("should navigate to GitHub login page when clicking the login button", async ({
    page,
  }) => {
    await page.goto("http://localhost:3000/get-started");

    const button = page.getByRole("button", {
      name: "Continue with GitHub",
    });

    await button.click();
    await page.waitForURL("https://github.com/**");

    const loginField = page.locator("#login_field");
    await loginField.isVisible();

    expect(page.getByLabel("Username or email address")).toBeTruthy();
    expect(page.getByLabel("Password")).toBeTruthy();
    await page.goto("http://localhost:3000/api/auth/signout");
    await page.getByRole("button", { name: "Sign out" }).click();
    await expect(page.locator("#submitButton")).toBeHidden();
  });
});
