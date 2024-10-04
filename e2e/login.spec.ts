import { test, expect } from "playwright/test";
import "dotenv/config";

test.describe("Login Page", () => {
  test("should display the welcome message", async ({ page }) => {
    await page.goto("http://localhost:3000/get-started");
    const welcomeMessage = page.getByText("Sign in or create your accounttton");
    expect(welcomeMessage).toBeTruthy();
  });
  test("should display the Github login button and complete Github SSO flow", async ({
    page,
  }) => {
    expect(process.env.E2E_GITHUB_EMAIL).toBeDefined();
    expect(process.env.E2E_GITHUB_PASSWORD).toBeDefined();

    await page.goto("http://localhost:3000/get-started");
    await page.getByTestId("github-login-button").click();
    await page.waitForURL("https://github.com/**");

    await page
      .getByLabel("Username or email address")
      .fill(process.env.E2E_GITHUB_EMAIL as string);
    await page
      .getByLabel("Password")
      .fill(process.env.E2E_GITHUB_PASSWORD as string);
    await page.getByRole("button", { name: "Sign in" }).first().click();
    await page.waitForURL("http://localhost:3000/articles");
  });

  test("should display the Gitlab login button", async ({ page }) => {
    await page.goto("http://localhost:3000/get-started");
    const loginButton = page.getByRole("button", {
      name: "Login with GitLab",
    });
    expect(loginButton).toBeTruthy();
  });
});
