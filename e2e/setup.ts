import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { post, comment, session, user } from "@/server/db/schema";
import {
  articleContent,
  articleExcerpt,
  E2E_USER_ONE_EMAIL,
  E2E_USER_ONE_ID,
  E2E_USER_ONE_SESSION_ID,
  E2E_USER_TWO_EMAIL,
  E2E_USER_TWO_ID,
  E2E_USER_TWO_SESSION_ID,
} from "./constants";
import { eq } from "drizzle-orm";

export const setup = async () => {
  // Dynamically import nanoid
  const { nanoid } = await import("nanoid");

  const db = drizzle(
    postgres("postgresql://postgres:secret@127.0.0.1:5432/postgres"),
  );
  const addE2EArticleAndComment = async (
    authorId: string,
    commenterId: string,
  ) => {
    const publishedPostId = nanoid(8);
    const scheduledPostId = nanoid(8);
    const draftPostId = nanoid(8);
    const now = new Date().toISOString();

    const oneYearFromToday = new Date(now);
    oneYearFromToday.setFullYear(oneYearFromToday.getFullYear() + 1);

    await Promise.all([
      db
        .insert(post)
        .values({
          id: publishedPostId,
          published: now,
          excerpt: articleExcerpt,
          updatedAt: now,
          slug: "e2e-test-slug-published",
          likes: 10,
          readTimeMins: 3,
          title: "Published Article",
          body: articleContent,
          userId: authorId,
        })
        .onConflictDoNothing()
        .returning(),

      db
        .insert(post)
        .values({
          id: draftPostId,
          published: null,
          excerpt: articleExcerpt,
          updatedAt: now,
          slug: "e2e-test-slug-draft",
          likes: 10,
          readTimeMins: 3,
          title: "Draft Article",
          body: articleContent,
          userId: authorId,
        })
        .onConflictDoNothing()
        .returning(),

      db
        .insert(post)
        .values({
          id: scheduledPostId,
          published: oneYearFromToday.toISOString(),
          excerpt: articleExcerpt,
          updatedAt: now,
          slug: "e2e-test-slug-scheduled",
          likes: 10,
          readTimeMins: 3,
          title: "Scheduled Article",
          body: articleContent,
          userId: authorId,
        })
        .onConflictDoNothing()
        .returning(),
    ]);

    await db
      .insert(comment)
      .values({
        postId: publishedPostId,
        body: "What a great article! Thanks for sharing",
        userId: commenterId,
      })
      .onConflictDoNothing()
      .returning();
  };

  const seedE2EUser = async (
    email: string,
    id: string,
    name: string,
    username: string,
  ) => {
    const [existingE2EUser] = await db
      .selectDistinct()
      .from(user)
      .where(eq(user.id, id));

    if (existingE2EUser) {
      console.log("E2E Test user already exists. Skipping creation");
      return existingE2EUser;
    }

    const userData = {
      id: id,
      username,
      name,
      email,
      image: `https://robohash.org/${encodeURIComponent(name)}?bgset=bg1`,
      location: "Ireland",
      bio: "Hi I am an robot",
      websiteUrl: "codu.co",
    };
    const [createdUser] = await db.insert(user).values(userData).returning();
    return createdUser;
  };

  const seedE2EUserSession = async (userId: string, sessionToken: string) => {
    const [existingE2EUserSession] = await db
      .selectDistinct()
      .from(session)
      .where(eq(session.sessionToken, sessionToken));

    if (existingE2EUserSession) {
      console.log("E2E Test session already exists. Skipping creation");
      return existingE2EUserSession;
    }

    try {
      const currentDate = new Date();

      return await db
        .insert(session)
        .values({
          userId,
          sessionToken,
          // Set session to expire in 6 months.
          expires: new Date(currentDate.setMonth(currentDate.getMonth() + 6)),
        })
        .returning();
    } catch (err) {
      console.log(err);
    }
  };

  try {
    console.log("Creating users");
    const [userOne, userTwo] = await Promise.all([
      seedE2EUser(
        E2E_USER_ONE_EMAIL,
        E2E_USER_ONE_ID,
        "E2E Test User One",
        "e2e-test-user-one-111",
      ),
      seedE2EUser(
        E2E_USER_TWO_EMAIL,
        E2E_USER_TWO_ID,
        "E2E Test User Two",
        "e2e-test-user-two-222",
      ),
    ]);

    console.log("Creating sessions");
    await Promise.all([
      seedE2EUserSession(userOne.id, E2E_USER_ONE_SESSION_ID),
      seedE2EUserSession(userTwo.id, E2E_USER_TWO_SESSION_ID),
    ]);

    console.log("Creating articles");
    await addE2EArticleAndComment(E2E_USER_ONE_ID, E2E_USER_TWO_ID);

    console.log("DB setup successful");
  } catch (err) {
    console.log("Error while setting up DB before E2E test run", err);
  }
};

export default setup;
