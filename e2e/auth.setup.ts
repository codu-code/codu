import { test as setup, expect } from "@playwright/test";
import path from "path";
import dotenv from "dotenv";
import fs from "fs";

const authFolder = path.join(__dirname, "../playwright/.auth");
const authFile = path.join(__dirname, "../playwright/.auth/browser.json");

// checks if the files/folders are present to support an authenticated browser state
// we needed to add these files to the gitignore to prevent people sharing their GH creds in PRs by accident
if (!fs.existsSync(authFile)) {
  console.log(
    "Browser state file was not found. An example file is being created:",
  );
  if (!fs.existsSync(authFolder)) {
    console.log("Browser state directory was not found. Folder being created:");
    fs.mkdir(authFolder, { recursive: true }, (err) => {
      console.log("Error creating folder", err);
      console.log(err);
    });
    console.log("Browser state directory was created successfully");
  }
  console.log("Waiting for folder to be created");
  while (!fs.existsSync(authFolder)) {}
  console.log("Folder found");

  if (!fs.existsSync(authFile)) {
    console.log("Browser.json file was not found. File being created:");
    fs.writeFile(authFile, JSON.stringify({ cookies: [] }), (err) => {
      if (err) {
        console.log("Error creating browser.json file", err);
        console.log(err);
      }
    });
    console.log("Browser.json file was created successfully");
  }
}

const browserState = require(authFile);

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
    expect(process.env.E2E_USER_SESSION_ID).toBeDefined();

    await page.context().addCookies([
      {
        name: "next-auth.session-token",
        value: process.env.E2E_USER_SESSION_ID as string,
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
    await page.context().storageState({ path: authFile });
  } catch (err) {
    console.log("Error while authenticating E2E test user", err);
  }
});
