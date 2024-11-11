import { expect, Page } from "@playwright/test";
import { E2E_USER_ONE_SESSION_ID, E2E_USER_TWO_SESSION_ID } from "../constants";

export const loggedInAsUserOne = async (page: Page) => {
  try {
    await page.context().addCookies([
      {
        name: "next-auth.session-token",
        value: E2E_USER_ONE_SESSION_ID,
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
  } catch (err) {
    throw Error("Error while authenticating E2E test user one");
  }
};

export const loggedInAsUserTwo = async (page: Page) => {
  try {
    await page.context().clearCookies();

    await page.context().addCookies([
      {
        name: "next-auth.session-token",
        value: E2E_USER_TWO_SESSION_ID,
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
  } catch (err) {
    throw Error("Error while authenticating E2E test user two");
  }
};
