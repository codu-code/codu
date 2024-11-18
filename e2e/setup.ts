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
import type { Article } from "@/types/types";

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
    const scheduled = new Date(
      new Date().setFullYear(new Date().getFullYear() + 1),
    ).toISOString();

    const articles: Article[] = [
      {
        id: publishedPostId,
        title: "Published Article",
        slug: "e2e-test-slug-published",
        excerpt: articleExcerpt,
        body: articleContent,
        likes: 0,
        readTimeMins: 2,
        published: now,
        updatedAt: now,
        userId: authorId,
      },
      {
        id: scheduledPostId,
        title: "Scheduled Article",
        slug: "e2e-test-slug-scheduled",
        excerpt: "This is an excerpt for a scheduled article.",
        body: "This is the body for a scheduled article.",
        likes: 0,
        readTimeMins: 2,
        published: scheduled,
        updatedAt: now,
        userId: authorId,
      },
      {
        id: draftPostId,
        title: "Draft Article",
        slug: "e2e-test-slug-draft",
        excerpt: "This is an excerpt for a draft article.",
        body: "This is the body for a draft article.",
        likes: 0,
        readTimeMins: 2,
        published: null,
        updatedAt: now,
        userId: authorId,
      },
      {
        id: nanoid(8),
        title: "Next.js Best Practices",
        slug: "e2e-nextjs-best-practices",
        excerpt:
          "Optimize your Next.js applications with these best practices.",
        body: "This guide explores how to structure your Next.js projects effectively, utilize Server-Side Rendering (SSR) and Static Site Generation (SSG) to enhance performance, and make the most of API routes to handle server-side logic.",
        likes: 20,
        readTimeMins: 4,
        published: now,
        updatedAt: now,
        userId: authorId,
      },
      {
        id: nanoid(8),
        title: "Understanding HTML5 Semantics",
        slug: "e2e-understanding-html5-semantics",
        excerpt: "Master the use of semantic tags in HTML5.",
        body: "Semantic HTML5 elements are foundational to web accessibility and search engine optimization.",
        likes: 15,
        readTimeMins: 3,
        published: now,
        updatedAt: now,
        userId: authorId,
      },
      {
        id: nanoid(8),
        title: "JavaScript ES6 Features",
        slug: "e2e-javascript-es6-features",
        excerpt: "Discover the powerful features of ES6.",
        body: "ECMAScript 6 introduces a wealth of new features to JavaScript, revolutionizing how developers write JS.",
        likes: 25,
        readTimeMins: 5,
        published: null,
        updatedAt: now,
        userId: authorId,
      },
      {
        id: nanoid(8),
        title: "CSS Grid vs. Flexbox",
        slug: "e2e-css-grid-vs-flexbox",
        excerpt: "Choosing between CSS Grid and Flexbox.",
        body: "CSS Grid and Flexbox are powerful tools for creating responsive layouts.",
        likes: 18,
        readTimeMins: 4,
        published: null,
        updatedAt: now,
        userId: authorId,
      },
      {
        id: nanoid(8),
        title: "React Hooks Explained",
        slug: "e2e-react-hooks-explained",
        excerpt: "Simplify your React code with Hooks.",
        body: "React Hooks provide a robust solution to use state and other React features without writing a class.",
        likes: 22,
        readTimeMins: 5,
        published: scheduled,
        updatedAt: now,
        userId: authorId,
      },
      {
        id: nanoid(8),
        title: "Web Accessibility Fundamentals",
        slug: "e2e-web-accessibility-fundamentals",
        excerpt: "Essential guidelines for web accessibility.",
        body: "Creating accessible websites is a critical aspect of modern web development.",
        likes: 20,
        readTimeMins: 3,
        published: scheduled,
        updatedAt: now,
        userId: authorId,
      },
    ];

    await Promise.all(
      articles.map(
        ({
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
        }) =>
          db
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
            })
            .onConflictDoNothing()
            .returning(),
      ),
    );

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
      bio: "Hi I am a robot",
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
