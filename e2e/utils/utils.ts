import { post } from "@/server/db/schema";
import { expect } from "@playwright/test";
import type { Page } from "@playwright/test";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import {
  E2E_USER_ONE_SESSION_ID,
  E2E_USER_TWO_SESSION_ID,
  E2E_USER_ONE_ID,
} from "../constants";
import type { Article } from "@/types/types";

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

export async function createArticle({
  id,
  title,
  slug,
  excerpt,
  body,
  likes = 10,
  readTimeMins = 3,
  published = new Date().toISOString(),
  updatedAt = new Date().toISOString(),
  userId = E2E_USER_ONE_ID,
}: Partial<Article>) {
  const db = drizzle(
    postgres("postgresql://postgres:secret@127.0.0.1:5432/postgres"),
  );

  try {
    await db
      .insert(post)
      .values({
        id,
        title,
        slug,
        excerpt,
        body,
        likes,
        readTimeMins,
        published,
        updatedAt,
        userId,
      } as Article)
      .onConflictDoNothing()
      .returning();
  } catch (err) {
    throw Error("Error while creating E2E test article");
  }
}
