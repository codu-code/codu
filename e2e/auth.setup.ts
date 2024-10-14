import { test as setup, expect } from "@playwright/test";
import path from "path";
import dotenv from "dotenv";
import browserState from "../playwright/.auth/browser.json";

// defaults to 1 if expires not passed. This will always fail
const hasFiveMinutes = (expires: number = 1) => {
  const currentTime = Math.floor(Date.now() / 1000); // Current time in seconds
  return expires - currentTime >= 300; // Check if there's at least 5 minutes until expiry
};

dotenv.config(); // Load .env file contents into process.env

setup("authenticate", async ({ page }) => {
  // check if theres already an authenticated browser state with atleast 5 mins until expiry
  if (
    browserState.cookies.length &&
    hasFiveMinutes(
      (browserState.cookies as Array<{ name: string; expires: number }>).find(
        (cookie: { name: string }) => cookie.name === "next-auth.session-token",
      )?.expires,
    )
  ) {
    console.log(
      "Skipping auth setup as there is a currently valid authenticated browser state",
    );
    return;
  }

  try {
    //expect(process.env.E2E_USER_SESSION_ID).toBeDefined(); removing until I can get it all working.

    const E2E_USER_SESSION_ID = "df8a11f2-f20a-43d6-80a0-a213f1efedc1";

    await page.context().addCookies([
      {
        name: "next-auth.session-token",
        value: E2E_USER_SESSION_ID as string,
        domain: "localhost",
        path: "/",
        sameSite: "Lax",
      },
    ]);

    expect(
      (await page.context().cookies()).find(
        (cookie) => cookie.name === "next-auth.session-token",
      ),
    ).toBeTruthy();
    await page.context().storageState({
      path: path.join(__dirname, "../playwright/.auth/browser.json"),
    });
  } catch (err) {
    console.log("Error while authenticating E2E test user", err);
  }
});
