import dotenv from "dotenv";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { post, comment } from "@/server/db/schema";
import { articleContent, articleExcerpt } from "./utils";

dotenv.config(); // Load .env file contents into process.env

export const setup = async () => {
  // Dynamically import nanoid
  const { nanoid } = await import("nanoid");

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
