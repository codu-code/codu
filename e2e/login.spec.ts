import { test, expect } from "playwright/test";

test.describe("Login Page", () => {
  test("should display the welcome message", async ({ page }) => {
    await page.goto("http://localhost:3000/get-started");
    const welcomeMessage = page.getByText("Sign in or create your accounttton");
    expect(welcomeMessage).toBeTruthy();
  });
  test("should display the Github login button", async ({ page }) => {
    await page.goto("http://localhost:3000/get-started");
    const loginButton = page.getByRole("button", {
      name: "Login with GitHub",
    });
    expect(loginButton).toBeTruthy();
  });

  test("should display the Gitlab login button", async ({ page }) => {
    await page.goto("http://localhost:3000/get-started");
    const loginButton = page.getByRole("button", {
      name: "Login with Gitlab",
    });
    expect(loginButton).toBeTruthy();
  });
});
