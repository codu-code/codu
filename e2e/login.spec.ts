import { test, expect } from "playwright/test";
import "dotenv/config";
import { loggedInAsUserOne } from "./utils";

test.describe("Unauthenticated Login Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
    await page.goto("http://localhost:3000/get-started");
  });
  test("Sign up page contains sign up links", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: "Sign in or create your account" }),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: "return home" })).toBeVisible();
    // Check for OAuth provider buttons
    await expect(
      page.getByRole("button", { name: "Continue with GitHub" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Continue with GitLab" }),
    ).toBeVisible();
  });
  test("Login page contains GitHub button", async ({ page }) => {
    await expect(page.getByTestId("github-login-button")).toBeVisible();
  });

  test("Login page contains GitLab button", async ({ page }) => {
    await expect(page.getByTestId("gitlab-login-button")).toBeVisible();
  });
});

test.describe("Authenticated Login Page", () => {
  test.beforeEach(async ({ page }) => {
    await loggedInAsUserOne(page);
  });
  test("Sign up page contains sign up links", async ({ page }) => {
    // authenticated users are kicked back to the homepage if they try to go to /get-started
    await page.goto("http://localhost:3000/get-started");
    expect(page.url()).toEqual("http://localhost:3000/");
    await expect(
      page.getByRole("heading", { name: "Sign in or create your account" }),
    ).toBeHidden();
    await expect(page.getByRole("link", { name: "return home" })).toBeHidden();
    // OAuth provider buttons should be hidden on homepage
    await expect(
      page.getByRole("button", { name: "Continue with GitHub" }),
    ).toBeHidden();
    await expect(
      page.getByRole("button", { name: "Continue with GitLab" }),
    ).toBeHidden();
  });
  test("Login page contains GitHub button", async ({ page }) => {
    await expect(page.getByTestId("github-login-button")).toBeHidden();
  });

  test("Login page contains GitLab button", async ({ page }) => {
    await expect(page.getByTestId("gitlab-login-button")).toBeHidden();
  });
});
