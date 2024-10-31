import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { post, comment, session, user } from "@/server/db/schema";
import {
  E2E_USER_ONE_EMAIL,
  E2E_USER_ONE_ID,
  E2E_USER_ONE_SESSION_ID,
  E2E_USER_TWO_EMAIL,
  E2E_USER_TWO_ID,
  E2E_USER_TWO_SESSION_ID,
} from "./constants";
import { eq } from "drizzle-orm";

export const setup = async () => {
  const db = drizzle(
    postgres("postgresql://postgres:secret@127.0.0.1:5432/postgres"),
  );

  const addE2EArticleAndComment = async (
    authorId: string,
    commenterId: string,
  ) => {
    const postId = "1nFnMmN5";
    const now = new Date().toISOString();
    await db
      .insert(post)
      .values({
        id: postId,
        published: now,
        excerpt: "Lorem ipsum dolor sit amet",
        updatedAt: now,
        slug: "e2e-test-slug-eqj0ozor",
        likes: 10,
        readTimeMins: 3,
        title: "Test Article",
        body: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas vitae ipsum id metus vestibulum rutrum eget a diam. Integer eget vulputate risus, ac convallis nulla. Mauris sed augue nunc. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos. Nam congue posuere tempor. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Ut ac augue non libero ullamcorper ornare. Ut commodo ligula vitae malesuada maximus. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Etiam sagittis justo non justo placerat, a dapibus sapien volutpat. Nullam ullamcorper sodales justo sed.",
        userId: authorId,
      })
      .onConflictDoNothing()
      .returning();

    await db
      .insert(comment)
      .values({
        postId,
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
