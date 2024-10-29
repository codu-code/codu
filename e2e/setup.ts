import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { post, comment } from "@/server/db/schema";
import { E2E_USER_ONE_ID, E2E_USER_TWO_ID } from "./constants";

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

  try {
    console.log("creating articles");

    await addE2EArticleAndComment(E2E_USER_ONE_ID, E2E_USER_TWO_ID);
    console.log("DB setup successful");
  } catch (err) {
    console.log("Error while setting up DB before E2E test run", err);
  }
};

export default setup;
