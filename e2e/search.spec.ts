import { test, expect } from "@playwright/test";

// The ⌘K command palette is public — it works logged-out — so these tests run
// without auth. The top bar exposes a search button (styled like an input) that
// opens a role="dialog" labelled "Search Codú"; typing runs a debounced live
// search against api.search.everything.

test.describe("Command palette search", () => {
  test("Opens from the top-bar search button and shows the search dialog", async ({
    page,
  }) => {
    await page.goto("http://localhost:3000/feed");
    await page.waitForSelector("article");

    // The top-bar trigger renders the placeholder text "Search…" + a ⌘K kbd.
    await page.getByRole("button").filter({ hasText: "Search" }).click();

    // The palette dialog should appear.
    await expect(page.getByRole("dialog", { name: "Search Codú" })).toBeVisible(
      { timeout: 10000 },
    );
  });

  test("Typing a query surfaces results (or a no-matches message)", async ({
    page,
  }) => {
    await page.goto("http://localhost:3000/feed");
    await page.waitForSelector("article");

    await page.getByRole("button").filter({ hasText: "Search" }).click();
    await expect(page.getByRole("dialog", { name: "Search Codú" })).toBeVisible(
      { timeout: 10000 },
    );

    // The search input is a combobox labelled "Search".
    const input = page.getByRole("combobox", { name: "Search" });
    await input.fill("react");

    // Wait out the ~300ms debounce plus the network round-trip.
    await page.waitForTimeout(1500);

    // Resilient: either at least one result option, or the "no matches" fallback.
    const anyOption = page.getByRole("dialog").getByRole("option").first();
    const noMatches = page.getByText(/no matches for/i);
    await expect(anyOption.or(noMatches)).toBeVisible({ timeout: 10000 });
  });

  test("Escape closes the search dialog", async ({ page }) => {
    await page.goto("http://localhost:3000/feed");
    await page.waitForSelector("article");

    await page.getByRole("button").filter({ hasText: "Search" }).click();
    const dialog = page.getByRole("dialog", { name: "Search Codú" });
    await expect(dialog).toBeVisible({ timeout: 10000 });

    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden({ timeout: 10000 });
  });
});
