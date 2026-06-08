import { test, expect } from "@playwright/test";
import { loggedInAsUserOne } from "./utils";

// The Discussions surface lists discussion/question posts and links into the
// redesigned discussion thread. Seed data (e2e/setup.ts) creates a published
// discussion by user one with a top-level comment + a nested reply.

const DISCUSSION_TITLE = "E2E Discussion: what's your testing setup?";
const QUESTION_TITLE = "E2E Question: how do you seed test data?";

test.describe("Discussions page", () => {
  test("lists community discussions with a Start CTA", async ({ page }) => {
    await page.goto("http://localhost:3000/discussions");

    await expect(
      page.getByRole("heading", { name: "Discussions", level: 1 }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Start a discussion/ }),
    ).toBeVisible();

    // Seeded discussion + question both surface here.
    await expect(page.getByText(DISCUSSION_TITLE)).toBeVisible({
      timeout: 20000,
    });
    await expect(page.getByText(QUESTION_TITLE)).toBeVisible();
  });
});

test.describe("Discussion thread", () => {
  test("renders the post and its seeded thread (comment + nested reply)", async ({
    page,
  }) => {
    await page.goto(
      "http://localhost:3000/e2e-test-user-one-111/e2e-discussion-published",
    );

    await expect(
      page.getByRole("heading", { name: /testing setup/ }),
    ).toBeVisible({ timeout: 30000 });

    // The seeded thread (top-level comment + the nested reply) is readable even
    // when signed out (the composer itself is gated to signed-in members).
    await expect(
      page.getByText("We run Playwright against a seeded Postgres", {
        exact: false,
      }),
    ).toBeVisible({ timeout: 20000 });
    await expect(
      page.getByText("the trick is cleaning up between runs", {
        exact: false,
      }),
    ).toBeVisible();
  });

  test("signed-in members can open the reply composer on a comment", async ({
    page,
  }) => {
    await loggedInAsUserOne(page);
    await page.goto(
      "http://localhost:3000/e2e-test-user-one-111/e2e-discussion-published",
    );

    const parent = page
      .locator("section.group\\/comment")
      .filter({ hasText: "We run Playwright against a seeded Postgres" })
      .first();
    await expect(parent).toBeVisible({ timeout: 30000 });

    await parent.getByRole("button", { name: "Reply" }).first().click();
    await expect(
      parent.getByRole("button", { name: "Reply" }).last(),
    ).toBeVisible();
  });
});
