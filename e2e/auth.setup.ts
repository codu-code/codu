import { test as setup, expect } from "@playwright/test";
import path from "path";

const authFile = path.join(__dirname, "../playwright/.auth/user.json");

setup("authenticate", async ({ page }) => {
  // Perform authentication steps. Replace these actions with your own.
  try {
    expect(process.env.E2E_GITHUB_EMAIL).toBeDefined();
    expect(process.env.E2E_GITHUB_PASSWORD).toBeDefined();
    const email = process.env.E2E_GITHUB_EMAIL;
    const password = process.env.E2E_GITHUB_PASSWORD;

    if (!email || !password) {
      throw new Error(
        email || password
          ? "Missing both E2E test user credentials from environment"
          : email
            ? "Missing E2E_GITHUB_EMAIL from environment"
            : "Missing E2E_GITHUB_PASSWORD from environment",
      );
    }

    // Perform authentication steps. Replace these actions with your own.
    await page.goto("https://github.com/login");
    await page.getByLabel("Username or email address").fill(email);
    await page.getByLabel("Password").fill(password);
    await page.getByRole("button", { name: "Sign in" }).click();
    // Wait until the page receives the cookies.
    //
    // Sometimes login flow sets cookies in the process of several redirects.
    // Wait for the final URL to ensure that the cookies are actually set.
    await page.waitForURL("https://github.com/");

    // End of authentication steps.

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

    await page.context().storageState({ path: authFile });
  } catch (err) {
    console.log(err);
  }
});
