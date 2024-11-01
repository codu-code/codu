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
  test('Username input field', async ({ page }) => {
    await page.goto('http://localhost:3000/settings', { timeout: 30000 });
  
    // Wait for the username input field to be visible
    await page.locator('input[id="username"]').waitFor();
  
    // Test that the input field is visible and has the correct attributes
    const inputField = page.locator('input[id="username"]');
    await expect(inputField).toBeVisible();
    await expect(inputField).toHaveAttribute('type', 'text');
    await expect(inputField).toHaveAttribute('autocomplete', 'username');
  
    // Test that the error message appears when the input field is invalid
    await inputField.fill('45&p^x#@!96%*()');
    await page.locator('button[type="submit"]').click(); 
    const errorMessage = page.locator('p:text-is("Username can only contain alphanumerics and dashes.")')
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toHaveText('Username can only contain alphanumerics and dashes.');
    // Reset the form 
    await page.locator('button:has-text("Reset")').click();
  
    // Test that the input field can be filled with a valid value and saves it
    await inputField.fill('codu-rules');
    await page.locator('button[type="submit"]').click(); 
    await expect(inputField).toHaveValue('codu-rules');
  });

  // Tests location input, autocomplete, and saved values 
  test('location input is visible', async ({page}) => {
    // Test to see if input is visible
    await page.locator('#location').isVisible();

    // Test to fill if value can be changed
    await page.locator('#location').fill('New York');
    await expect(page.locator('#location')).toHaveValue('New York');

    // Test to see if autocomplete is working
    await expect(page.locator('#location')).toHaveAttribute('autocomplete', 'country-name');
    
    // Test to see if change in location persits 
    await page.locator('#location').fill('A fun place to visit.');
    await page.locator('button[type="submit"]').click();
    await expect(page.locator('#location')).toHaveValue('A fun place to visit.');
  });
  
  
 
  
  
});
