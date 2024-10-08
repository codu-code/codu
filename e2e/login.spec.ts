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
    isMobile,
  }) => {
    expect(process.env.E2E_GITHUB_EMAIL).toBeDefined();
    expect(process.env.E2E_GITHUB_PASSWORD).toBeDefined();

    await page.goto("http://localhost:3000/get-started");
    await page.getByTestId("github-login-button").click();
    //await page.waitForURL("https://github.com/**");
    await page.waitForLoadState();

    if (await page.getByText("Authorize JohnAllenTech").isVisible()) {
      //  await page.getByText("Authorize JohnAllenTech").click();
      await page
        .getByRole("button", { name: "Authorize JohnAllenTech" })
        .click();

      await page.waitForLoadState();
    }

    await page.waitForURL("http://localhost:3000");
    if (!isMobile) {
      expect(page.getByText("New Post")).toBeVisible();
      expect(page.getByText("Your Posts")).toBeVisible();
    }
    await page.waitForLoadState();
  });

  test("should display the Gitlab login button", async ({ page }) => {
    await page.goto("http://localhost:3000/get-started");
    const loginButton = page.getByRole("button", {
      name: "Login with GitLab",
    });
    expect(loginButton).toBeTruthy();
  });
});
