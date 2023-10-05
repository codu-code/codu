import { test, expect } from "@playwright/test";

test("should navigate to the sponsor page", async ({ page }) => {
  // Start from the index page (the baseURL is set via the webServer in the playwright.config.ts)
  await page.goto("http://localhost:3000/");
  // Find an element with the text 'Support us' and click on it
  await page.click("text=Support");
  // The new URL should be "/sponsorship" (baseURL is used there)
  await expect(page).toHaveURL("http://localhost:3000/sponsorship");
  // The new page should contain an h1 with "Sponsor Codú"
  await expect(page.locator("h3")).toContainText("Sponsor Codú");
});
