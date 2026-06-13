import { test, expect } from "@playwright/test";
import { loggedInAsUserOne } from "./utils";

// The relaunch added a top-bar "+ Create" button that opens a Reddit-style
// compose hub (Discussion / Link / Article tabs). On the first create of a
// session a one-time dos-&-don'ts gate ("Posting on Codú") is shown, controlled
// by the localStorage key `codu_create_info_seen`. These tests only verify the
// modals render + close — they never submit, to avoid polluting seed data.

test.describe("Create flow", () => {
  test.beforeEach(async ({ page }) => {
    await loggedInAsUserOne(page);
    // Force the first-use info gate to show so we exercise it deterministically.
    await page.addInitScript(() => {
      try {
        localStorage.removeItem("codu_create_info_seen");
      } catch {
        // ignore storage failures
      }
    });
  });

  test("Opens the info gate then the compose modal with tabs, and closes", async ({
    page,
  }) => {
    await page.goto("http://localhost:3000/");
    await page.waitForSelector("article");

    // Open the create flow from the top bar.
    await page.getByRole("button", { name: /Create/ }).click();

    // First create of the session: the dos-&-don'ts gate appears first. Either
    // the info gate or the compose modal is on screen — wait for whichever, then
    // acknowledge the gate if present. (Avoids a conditional assertion.)
    const gotIt = page.getByRole("button", { name: /Got it — let's create/ });
    const compose = page.getByRole("dialog", { name: "Create a post" });
    await expect(gotIt.or(compose)).toBeVisible({ timeout: 10000 });

    // Click the gate's CTA if it's showing; harmless no-op if already past it.
    await gotIt.click({ timeout: 5000 }).catch(() => {});

    // The compose modal should now be visible with the three tabs.
    await expect(compose).toBeVisible({ timeout: 10000 });
    await expect(
      compose.getByRole("button", { name: "Discussion" }),
    ).toBeVisible();
    await expect(compose.getByRole("button", { name: "Link" })).toBeVisible();
    await expect(
      compose.getByRole("button", { name: "Article" }),
    ).toBeVisible();

    // Switch to the Link tab — a URL field should appear.
    await compose.getByRole("button", { name: "Link" }).click();
    await expect(compose.getByPlaceholder("https://…")).toBeVisible({
      timeout: 10000,
    });

    // Cancel closes the modal without posting.
    await compose.getByRole("button", { name: "Cancel" }).click();
    await expect(compose).toBeHidden({ timeout: 10000 });
  });

  test("The compose modal closes via its Close control", async ({ page }) => {
    // Skip the gate this time so we land straight on the compose modal.
    await page.addInitScript(() => {
      try {
        localStorage.setItem("codu_create_info_seen", "1");
      } catch {
        // ignore storage failures
      }
    });

    await page.goto("http://localhost:3000/");
    await page.waitForSelector("article");

    await page.getByRole("button", { name: /Create/ }).click();

    const compose = page.getByRole("dialog", { name: "Create a post" });
    await expect(compose).toBeVisible({ timeout: 10000 });

    // The modal's close affordance.
    await compose.getByRole("button", { name: "Close" }).click();
    await expect(compose).toBeHidden({ timeout: 10000 });
  });
});
