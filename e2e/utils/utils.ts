import { posts } from "@/server/db/schema";
import { expect } from "@playwright/test";
import type { Page } from "@playwright/test";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import {
  E2E_USER_ONE_SESSION_ID,
  E2E_USER_TWO_SESSION_ID,
  E2E_ADMIN_SESSION_ID,
  E2E_USER_ONE_ID,
} from "../constants";

export const loggedInAsUserOne = async (page: Page) => {
  try {
    await page.context().addCookies([
      {
        name: "authjs.session-token",
        value: E2E_USER_ONE_SESSION_ID,
        domain: "localhost",
        path: "/",
        sameSite: "Lax",
      },
    ]);

    expect(
      (await page.context().cookies()).find(
        (cookie) => cookie.name === "authjs.session-token",
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
        name: "authjs.session-token",
        value: E2E_USER_TWO_SESSION_ID,
        domain: "localhost",
        path: "/",
        sameSite: "Lax",
      },
    ]);

    expect(
      (await page.context().cookies()).find(
        (cookie) => cookie.name === "authjs.session-token",
      ),
    ).toBeTruthy();
  } catch (err) {
    throw Error("Error while authenticating E2E test user two");
  }
};

export const loggedInAsAdmin = async (page: Page) => {
  try {
    await page.context().addCookies([
      {
        name: "authjs.session-token",
        value: E2E_ADMIN_SESSION_ID,
        domain: "localhost",
        path: "/",
        sameSite: "Lax",
      },
    ]);

    expect(
      (await page.context().cookies()).find(
        (cookie) => cookie.name === "authjs.session-token",
      ),
    ).toBeTruthy();
  } catch (err) {
    throw Error("Error while authenticating E2E admin user");
  }
};

// Interface for creating articles using new posts table
interface CreateArticleInput {
  title: string;
  slug: string;
  excerpt?: string;
  body?: string;
  upvotesCount?: number;
  downvotesCount?: number;
  readingTime?: number;
  status?: "draft" | "published" | "scheduled" | "unlisted";
  publishedAt?: string | null;
  authorId?: string;
}

export async function createArticle({
  title,
  slug,
  excerpt = "",
  body = "",
  upvotesCount = 10,
  downvotesCount = 0,
  readingTime = 3,
  status = "published",
  publishedAt = new Date().toISOString(),
  authorId = E2E_USER_ONE_ID,
}: CreateArticleInput) {
  const db = drizzle(
    postgres("postgresql://postgres:secret@127.0.0.1:5432/postgres"),
  );

  try {
    const result = await db
      .insert(posts)
      .values({
        type: "article",
        title,
        slug,
        excerpt,
        body,
        upvotesCount,
        downvotesCount,
        readingTime,
        status,
        publishedAt,
        authorId,
        showComments: true,
      })
      .onConflictDoNothing()
      .returning();
    return result[0];
  } catch (err) {
    throw Error(`Error while creating E2E test article: ${err}`);
  }
}
