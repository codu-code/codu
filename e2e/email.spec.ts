import { test, expect } from "playwright/test";
import {
  isMailpitRunning,
  clearMailbox,
  waitForEmail,
  getMessage,
} from "./mailpit";

// End-to-end email delivery through the local Mailpit catcher. Requires:
//   - docker-compose `mailpit` service running (http://localhost:8025)
//   - the app server started with EMAIL_PROVIDER=local
// Skips itself cleanly when Mailpit isn't up so plain runs stay green.

const TEST_EMAIL = "e2e-magic-link@example.com";

test.describe("Email (Mailpit)", () => {
  test.beforeEach(async () => {
    test.skip(
      !(await isMailpitRunning()),
      "Mailpit not running — start docker-compose and set EMAIL_PROVIDER=local",
    );
    await clearMailbox();
  });

  test("magic-link sign-in email is delivered with a working callback link", async ({
    page,
  }) => {
    await page.goto("http://localhost:3000/get-started");

    const emailInput = page.getByPlaceholder("you@example.com");
    test.skip(
      !(await emailInput.isVisible().catch(() => false)),
      "Email auth not enabled on this server",
    );

    await emailInput.fill(TEST_EMAIL);
    await page.getByRole("button", { name: "Continue with email" }).click();

    // next-auth redirects to its verify-request page once the mail is handed off.
    await page.waitForURL(/verify-request|auth/, { timeout: 15_000 });

    const summary = await waitForEmail(TEST_EMAIL, {
      subjectContains: "your link",
    });
    expect(summary.Subject).toContain("Codú");

    // The captured email must carry a usable next-auth callback link.
    const message = await getMessage(summary.ID);
    const linkMatch = (message.HTML || message.Text).match(
      /https?:\/\/[^"'\s]+\/api\/auth\/callback\/[^"'\s]+/,
    );
    expect(linkMatch, "magic link present in email body").not.toBeNull();
  });
});
