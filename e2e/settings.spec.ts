import { test, expect } from "@playwright/test";
import { loggedInAsUserOne } from "./utils";

test.describe("Unauthenticated setttings Page", () => {
  //
  // Replace with tests for unauthenticated users
});

test.describe("Authenticated settings Page", () => {
  test.beforeEach(async ({ page }) => {
    await loggedInAsUserOne(page);
  });

  // Test for changing username
  test("Username input field", async ({ page }) => {
    await page.goto("http://localhost:3000/settings", { timeout: 30000 });

    const inputField = page.locator('input[id="username"]');
    const submitButton = page.locator('button[type="submit"]');

    // Test that the input field is visible and has the correct attributes
    await expect(inputField).toBeVisible();
    await expect(inputField).toHaveAttribute("type", "text");
    await expect(inputField).toHaveAttribute("autocomplete", "username");

    // Test that the error message appears when the input field is invalid
    await inputField.fill("45&p^x#@!96%*()");
    await submitButton.click();
    const errorMessage = page.locator(
      'p:text-is("Username can only contain alphanumerics and dashes.")',
    );
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toHaveText(
      "Username can only contain alphanumerics and dashes.",
    );

    // Test minimum length
    await inputField.fill("ab");
    await submitButton.click();
    await expect(
      page.locator('p:text-is("String must contain at least 3 character(s)")'),
    ).toBeVisible();

    // Test maximum length
    await inputField.fill("a".repeat(51));
    await submitButton.click();
    await expect(
      page.locator('p:text-is("Max username length is 40 characters.")'),
    ).toBeVisible();

    // Reset the form
    await page.locator('button:has-text("Reset")').click();

    // Test that the input field can be filled with a valid value and saves it
    await inputField.fill("codu-rules");
    await page.locator('button[type="submit"]').click();
    const toastError = page.locator(".toast-success");
    await expect(toastError).toBeVisible();
    await expect(toastError).toBeHidden();

    // Reload the page and check that the input field has the correct value
    await page.reload();
    await expect(inputField).toHaveValue("codu-rules");
  });
});
