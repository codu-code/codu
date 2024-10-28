import dotenv from "dotenv";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { post, comment } from "@/server/db/schema";

dotenv.config(); // Load .env file contents into process.env

export const setup = async () => {
  if (
    !process.env.DATABASE_URL ||
    !process.env.E2E_USER_ONE_ID ||
    !process.env.E2E_USER_TWO_ID
  ) {
    throw new Error("Missing env variables for DB clean up script");
  }
  const db = drizzle(postgres(process.env.DATABASE_URL as string));

  const addE2EArticleAndComment = async (
    authorId: string,
    commenterId: string,
  ) => {
    const publishedPostId = "1nFnMmN1";
    const scheduledPostId = "1nFnMmN2";
    const draftPostId = "1nFnMmN3";
    const now = new Date().toISOString();

    const oneYearFromToday = new Date(now);
    oneYearFromToday.setFullYear(oneYearFromToday.getFullYear() + 1);

    await db
      .insert(post)
      .values({
        id: publishedPostId,
        published: now,
        excerpt: "Lorem ipsum dolor sit amet",
        updatedAt: now,
        slug: "e2e-test-slug-published",
        likes: 10,
        readTimeMins: 3,
        title: "Published Article",
        body: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas vitae ipsum id metus vestibulum rutrum eget a diam. Integer eget vulputate risus, ac convallis nulla. Mauris sed augue nunc. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos. Nam congue posuere tempor. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Ut ac augue non libero ullamcorper ornare. Ut commodo ligula vitae malesuada maximus. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Etiam sagittis justo non justo placerat, a dapibus sapien volutpat. Nullam ullamcorper sodales justo sed.",
        userId: authorId,
      })
      .onConflictDoNothing()
      .returning();

    await db
      .insert(post)
      .values({
        id: scheduledPostId,
        published: null,
        excerpt: "Lorem ipsum dolor sit amet",
        updatedAt: now,
        slug: "e2e-test-slug-draft",
        likes: 10,
        readTimeMins: 3,
        title: "Draft Article",
        body: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas vitae ipsum id metus vestibulum rutrum eget a diam. Integer eget vulputate risus, ac convallis nulla. Mauris sed augue nunc. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos. Nam congue posuere tempor. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Ut ac augue non libero ullamcorper ornare. Ut commodo ligula vitae malesuada maximus. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Etiam sagittis justo non justo placerat, a dapibus sapien volutpat. Nullam ullamcorper sodales justo sed.",
        userId: authorId,
      })
      .onConflictDoNothing()
      .returning();

    await db
      .insert(post)
      .values({
        id: draftPostId,
        published: oneYearFromToday.toISOString(),
        excerpt: "Lorem ipsum dolor sit amet",
        updatedAt: now,
        slug: "e2e-test-slug-scheduled",
        likes: 10,
        readTimeMins: 3,
        title: "Scheduled Article",
        body: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas vitae ipsum id metus vestibulum rutrum eget a diam. Integer eget vulputate risus, ac convallis nulla. Mauris sed augue nunc. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos. Nam congue posuere tempor. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Ut ac augue non libero ullamcorper ornare. Ut commodo ligula vitae malesuada maximus. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Etiam sagittis justo non justo placerat, a dapibus sapien volutpat. Nullam ullamcorper sodales justo sed.",
        userId: authorId,
      })
      .onConflictDoNothing()
      .returning();

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

  try {
    console.log("creating articles");

    await addE2EArticleAndComment(
      process.env.E2E_USER_ONE_ID as string,
      process.env.E2E_USER_TWO_ID as string,
    );
    console.log("DB setup successful");
  } catch (err) {
    console.log("Error while setting up DB before E2E test run", err);
  }
};

export default setup;
