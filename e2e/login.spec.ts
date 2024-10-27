import { test, expect } from "playwright/test";
import "dotenv/config";
import { loggedInAsUserOne } from "./utils";

test.describe("Unauthenticated Login Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
    await page.goto("http://localhost:3000/get-started");
  });
  test("Sign up page contains sign up links", async ({ page, isMobile }) => {
    await expect(page.getByText("CodúBetaSign in or create")).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Sign in or create your account" }),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: "return home" })).toBeVisible();
    if (!isMobile) {
      await expect(
        page.getByRole("button", { name: "Sign up for free" }),
      ).toBeVisible();
      await expect(
        page.getByRole("button", { name: "Sign in", exact: true }),
      ).toBeVisible();
    }
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
  test("Sign up page contains sign up links", async ({ page, isMobile }) => {
    // authenticated users are kicked back to the homepage if they try to go to /get-started
    await page.goto("http://localhost:3000/get-started");
    expect(page.url()).toEqual("http://localhost:3000/");
    await expect(page.getByText("CodúBetaSign in or create")).toBeHidden();
    await expect(
      page.getByRole("heading", { name: "Sign in or create your account" }),
    ).toBeHidden();
    await expect(page.getByRole("link", { name: "return home" })).toBeHidden();
    if (!isMobile) {
      await expect(
        page.getByRole("button", { name: "Sign up for free" }),
      ).toBeHidden();
      await expect(
        page.getByRole("button", { name: "Sign in", exact: true }),
      ).toBeHidden();
    }
  });
  test("Login page contains GitHub button", async ({ page }) => {
    await expect(page.getByTestId("github-login-button")).toBeHidden();
  });

  test("Login page contains GitLab button", async ({ page }) => {
    await expect(page.getByTestId("gitlab-login-button")).toBeHidden();
  });
});
