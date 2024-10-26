import { expect, Page } from "@playwright/test";

export const loggedInAsUserOne = async (page: Page) => {
  try {
    expect(process.env.E2E_USER_ONE_SESSION_ID).toBeDefined();

    await page.context().addCookies([
      {
        name: "next-auth.session-token",
        value: process.env.E2E_USER_ONE_SESSION_ID as string,
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
    expect(process.env.E2E_USER_TWO_SESSION_ID).toBeDefined();

    await page.context().clearCookies();

    await page.context().addCookies([
      {
        name: "next-auth.session-token",
        value: process.env.E2E_USER_TWO_SESSION_ID as string,
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
