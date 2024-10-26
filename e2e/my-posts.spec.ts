import test from "@playwright/test";
import { loggedInAsUserOne } from "./utils";

test.describe("Unauthenticated my-posts Page", () => {
  //
  // Replace with tests for unauthenticated users
});

test.describe("Authenticated my-posts Page", () => {
  test.beforeEach(async ({ page }) => {
    await loggedInAsUserOne(page);
  });
  //
  // Replace with tests for authenticated users
});
