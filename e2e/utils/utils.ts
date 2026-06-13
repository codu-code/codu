import {
  posts,
  notification,
  banned_users,
  content_report,
} from "@/server/db/schema";
import { expect } from "@playwright/test";
import type { Page } from "@playwright/test";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq, and, isNotNull } from "drizzle-orm";
import { normalizeUrl } from "@/server/lib/normalizeUrl";
import {
  E2E_USER_ONE_SESSION_ID,
  E2E_USER_TWO_SESSION_ID,
  E2E_ADMIN_SESSION_ID,
  E2E_USER_ONE_ID,
  E2E_ADMIN_ID,
} from "../constants";

// All E2E DB helpers talk to the same local Postgres the global setup seeds
// (see e2e/setup.ts). Centralised here so individual helpers don't re-declare
// the connection string.
const E2E_DB_URL = "postgresql://postgres:secret@127.0.0.1:5432/postgres";
const e2eDb = () => drizzle(postgres(E2E_DB_URL));

/**
 * Signed-in users can legitimately earn a badge mid-test (commenting, voting…),
 * which pops the full-screen BadgeCelebration dialog and blocks pointer events.
 * Auto-dismiss it whenever it appears so tests exercise the flow under it.
 */
const dismissBadgeCelebration = async (page: Page) => {
  const keepBrowsing = page.getByRole("button", { name: "Keep browsing" });
  await page.addLocatorHandler(keepBrowsing, async () => {
    await keepBrowsing.click();
  });
};

export const loggedInAsUserOne = async (page: Page) => {
  try {
    // Clear cookies to ensure fresh session (prevents stale React Query cache when switching users)
    await page.context().clearCookies();

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

    await dismissBadgeCelebration(page);
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

    await dismissBadgeCelebration(page);
  } catch (err) {
    throw Error("Error while authenticating E2E test user two");
  }
};

export const loggedInAsAdmin = async (page: Page) => {
  try {
    // Clear cookies to ensure fresh session (prevents stale React Query cache when switching users)
    await page.context().clearCookies();

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

    await dismissBadgeCelebration(page);
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

// Interface for creating link posts
interface CreateLinkPostInput {
  title: string;
  slug: string;
  externalUrl: string;
  excerpt?: string;
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

export async function createLinkPost({
  title,
  slug,
  externalUrl,
  excerpt = "",
  upvotesCount = 0,
  downvotesCount = 0,
  readingTime = 1,
  status = "draft",
  publishedAt = null,
  authorId = E2E_USER_ONE_ID,
}: CreateLinkPostInput) {
  const db = drizzle(
    postgres("postgresql://postgres:secret@127.0.0.1:5432/postgres"),
  );

  try {
    const result = await db
      .insert(posts)
      .values({
        type: "link",
        title,
        slug,
        excerpt,
        body: "", // Link posts don't have body content
        externalUrl,
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
    throw Error(`Error while creating E2E test link post: ${err}`);
  }
}

// Interface for creating notifications
interface CreateNotificationInput {
  userId: string;
  notifierId: string;
  type: number; // 0 = NEW_COMMENT_ON_YOUR_POST, 1 = NEW_REPLY_TO_YOUR_COMMENT
  postId?: string;
  commentId?: string; // UUID
}

export async function createNotification({
  userId,
  notifierId,
  type,
  postId,
  commentId,
}: CreateNotificationInput) {
  const db = drizzle(
    postgres("postgresql://postgres:secret@127.0.0.1:5432/postgres"),
  );

  try {
    // If no postId provided, get a published post to use
    let actualPostId = postId;
    if (!actualPostId) {
      const [publishedPost] = await db
        .select({ id: posts.id })
        .from(posts)
        .where(eq(posts.slug, "e2e-test-slug-published"))
        .limit(1);

      if (publishedPost) {
        actualPostId = publishedPost.id;
      }
    }

    const result = await db
      .insert(notification)
      .values({
        userId,
        notifierId,
        type,
        postId: actualPostId,
        commentId,
      })
      .returning();
    return result[0];
  } catch (err) {
    throw Error(`Error while creating E2E test notification: ${err}`);
  }
}

export async function clearNotifications(userId: string) {
  const db = drizzle(
    postgres("postgresql://postgres:secret@127.0.0.1:5432/postgres"),
  );

  try {
    await db.delete(notification).where(eq(notification.userId, userId));
  } catch (err) {
    throw Error(`Error while clearing E2E test notifications: ${err}`);
  }
}

// ---------------------------------------------------------------------------
// Moderation helpers (Phases 9 & 10). These mirror the createArticle / report
// flows the real app performs, but seed/clean state directly against the same
// local Postgres so the moderation specs stay deterministic.
// ---------------------------------------------------------------------------

/** Delete a post (and its open reports) by exact slug, so a spec can re-run. */
export async function deletePostBySlug(slug: string) {
  const db = e2eDb();
  try {
    const rows = await db
      .select({ id: posts.id })
      .from(posts)
      .where(eq(posts.slug, slug));
    for (const row of rows) {
      await db.delete(content_report).where(eq(content_report.postId, row.id));
    }
    await db.delete(posts).where(eq(posts.slug, slug));
  } catch (err) {
    throw Error(`Error while deleting E2E post by slug: ${err}`);
  }
}

/** Read back a post's status by slug (used to assert ban/hide transitions). */
export async function getPostStatusBySlug(slug: string) {
  const db = e2eDb();
  const [row] = await db
    .select({ id: posts.id, status: posts.status })
    .from(posts)
    .where(eq(posts.slug, slug))
    .limit(1);
  return row ?? null;
}

/**
 * Publish a link post directly, populating `externalUrlNormalized` exactly as
 * the real publish path does. This is the precondition for the link-dedupe
 * spec: a fresh, published link with the same normalized URL must make the
 * second attempt CONFLICT.
 */
export async function createPublishedLink({
  title,
  slug,
  externalUrl,
  authorId = E2E_USER_ONE_ID,
}: {
  title: string;
  slug: string;
  externalUrl: string;
  authorId?: string;
}) {
  const db = e2eDb();
  try {
    const [row] = await db
      .insert(posts)
      .values({
        type: "link",
        title,
        slug,
        excerpt: "",
        body: "",
        externalUrl,
        externalUrlNormalized: normalizeUrl(externalUrl),
        upvotesCount: 0,
        downvotesCount: 0,
        readingTime: 1,
        status: "published",
        publishedAt: new Date().toISOString(),
        authorId,
        showComments: true,
      })
      .onConflictDoNothing()
      .returning();
    return row;
  } catch (err) {
    throw Error(`Error while creating E2E published link: ${err}`);
  }
}

/**
 * Seed an article in `in_review` — the state gatePublish puts an article into
 * when MODERATION_ENABLED=true. Used to assert feed-exclusion + the my-posts
 * "In review" badge deterministically (without depending on the slow full
 * editor publish flow, which articles.spec.ts already covers).
 */
export async function createInReviewArticle({
  title,
  slug,
  body = "An article awaiting moderator review.",
  excerpt = "Awaiting review excerpt.",
  authorId = E2E_USER_ONE_ID,
}: {
  title: string;
  slug: string;
  body?: string;
  excerpt?: string;
  authorId?: string;
}) {
  const db = e2eDb();
  try {
    const [row] = await db
      .insert(posts)
      .values({
        type: "article",
        title,
        slug,
        excerpt,
        body,
        upvotesCount: 0,
        downvotesCount: 0,
        readingTime: 2,
        status: "in_review",
        // in_review posts have no publishedAt yet.
        publishedAt: null,
        authorId,
        showComments: true,
      })
      .onConflictDoNothing()
      .returning();
    return row;
  } catch (err) {
    throw Error(`Error while creating E2E in_review article: ${err}`);
  }
}

/** Ban a user (admin action equivalent): insert a ban + hide their live posts. */
export async function banUserInDb(
  userId: string,
  bannedById: string = E2E_ADMIN_ID,
) {
  const db = e2eDb();
  try {
    await db
      .insert(banned_users)
      .values({
        userId,
        bannedById,
        note: "E2E test ban",
        createdAt: new Date().toISOString(),
      })
      .onConflictDoNothing();
    // Mirror admin.ban: published posts by the banned user become drafts so the
    // feed's banned-users join + status filter both hide them.
    await db
      .update(posts)
      .set({ status: "draft" })
      .where(and(eq(posts.authorId, userId), eq(posts.status, "published")));
  } catch (err) {
    throw Error(`Error while banning E2E user: ${err}`);
  }
}

/** Remove any ban for a user, so banned-state specs can re-run cleanly. */
export async function clearBanForUser(userId: string) {
  const db = e2eDb();
  try {
    await db.delete(banned_users).where(eq(banned_users.userId, userId));
  } catch (err) {
    throw Error(`Error while clearing E2E ban: ${err}`);
  }
}

/**
 * Unban a user (admin action equivalent): remove the ban AND restore posts the
 * ban had drafted (status draft + a publishedAt set → published), mirroring
 * admin.unban.
 */
export async function unbanUserInDb(userId: string) {
  const db = e2eDb();
  try {
    await db.delete(banned_users).where(eq(banned_users.userId, userId));
    await db
      .update(posts)
      .set({ status: "published" })
      .where(
        and(
          eq(posts.authorId, userId),
          eq(posts.status, "draft"),
          isNotNull(posts.publishedAt),
        ),
      );
  } catch (err) {
    throw Error(`Error while unbanning E2E user: ${err}`);
  }
}
