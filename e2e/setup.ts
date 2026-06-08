import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import {
  posts,
  comments,
  session,
  user,
  follow,
  point_event,
} from "@/server/db/schema";
import {
  articleContent,
  articleExcerpt,
  E2E_USER_ONE_EMAIL,
  E2E_USER_ONE_ID,
  E2E_USER_ONE_SESSION_ID,
  E2E_USER_TWO_EMAIL,
  E2E_USER_TWO_ID,
  E2E_USER_TWO_SESSION_ID,
  E2E_ADMIN_EMAIL,
  E2E_ADMIN_ID,
  E2E_ADMIN_SESSION_ID,
} from "./constants";
import { eq } from "drizzle-orm";

export const setup = async () => {
  const db = drizzle(
    postgres("postgresql://postgres:secret@127.0.0.1:5432/postgres"),
  );

  // Helper to generate short ID for slugs
  const generateShortId = () => {
    const chars = "0123456789abcdefghijklmnopqrstuvwxyz";
    let result = "";
    for (let i = 0; i < 7; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const addE2EArticleAndComment = async (
    authorId: string,
    commenterId: string,
  ) => {
    // Clean up any old E2E test posts by slug pattern
    const e2eSlugs = [
      "e2e-test-slug-published",
      "e2e-test-slug-scheduled",
      "e2e-test-slug-draft",
      "e2e-nextjs-best-practices",
      "e2e-understanding-html5-semantics",
      "e2e-javascript-es6-features",
      "e2e-css-grid-vs-flexbox",
      "e2e-react-hooks-explained",
      "e2e-web-accessibility-fundamentals",
      // Link post slugs
      "e2e-link-published",
      "e2e-link-draft",
      // Discussion / question slugs (relaunch post kinds)
      "e2e-discussion-published",
      "e2e-question-published",
    ];

    for (const slugPattern of e2eSlugs) {
      // Find posts with slugs starting with this pattern
      const postsToDelete = await db
        .select({ id: posts.id })
        .from(posts)
        .where(eq(posts.slug, slugPattern));

      for (const p of postsToDelete) {
        await db.delete(comments).where(eq(comments.postId, p.id));
      }

      // Delete posts with exact slug match (they might have shortId suffix)
      await db.delete(posts).where(eq(posts.slug, slugPattern));
    }

    const now = new Date().toISOString();
    const scheduledDate = new Date();
    scheduledDate.setFullYear(scheduledDate.getFullYear() + 1);
    const scheduled = scheduledDate.toISOString();

    // New posts table schema uses different column names
    const articlesToCreate = [
      {
        type: "article" as const,
        title: "Published Article",
        slug: "e2e-test-slug-published",
        excerpt: articleExcerpt,
        body: articleContent,
        upvotesCount: 10,
        downvotesCount: 0,
        readingTime: 2,
        status: "published" as const,
        publishedAt: now,
        authorId: authorId,
        showComments: true,
      },
      {
        type: "article" as const,
        title: "Scheduled Article",
        slug: "e2e-test-slug-scheduled",
        excerpt: "This is an excerpt for a scheduled article.",
        body: "This is the body for a scheduled article.",
        upvotesCount: 0,
        downvotesCount: 0,
        readingTime: 2,
        status: "scheduled" as const,
        publishedAt: scheduled,
        authorId: authorId,
        showComments: true,
      },
      {
        type: "article" as const,
        title: "Draft Article",
        slug: "e2e-test-slug-draft",
        excerpt: "This is an excerpt for a draft article.",
        body: "This is the body for a draft article.",
        upvotesCount: 0,
        downvotesCount: 0,
        readingTime: 2,
        status: "draft" as const,
        publishedAt: null,
        authorId: authorId,
        showComments: true,
      },
      {
        type: "article" as const,
        title: "Next.js Best Practices",
        slug: "e2e-nextjs-best-practices",
        excerpt:
          "Optimize your Next.js applications with these best practices.",
        body: "This guide explores how to structure your Next.js projects effectively, utilize Server-Side Rendering (SSR) and Static Site Generation (SSG) to enhance performance, and make the most of API routes to handle server-side logic.",
        upvotesCount: 20,
        downvotesCount: 2,
        readingTime: 4,
        status: "published" as const,
        publishedAt: now,
        authorId: authorId,
        showComments: true,
      },
      {
        type: "article" as const,
        title: "Understanding HTML5 Semantics",
        slug: "e2e-understanding-html5-semantics",
        excerpt: "Master the use of semantic tags in HTML5.",
        body: "Semantic HTML5 elements are foundational to web accessibility and search engine optimization.",
        upvotesCount: 15,
        downvotesCount: 1,
        readingTime: 3,
        status: "published" as const,
        publishedAt: now,
        authorId: authorId,
        showComments: true,
      },
      {
        type: "article" as const,
        title: "JavaScript ES6 Features",
        slug: "e2e-javascript-es6-features",
        excerpt: "Discover the powerful features of ES6.",
        body: "ECMAScript 6 introduces a wealth of new features to JavaScript, revolutionizing how developers write JS.",
        upvotesCount: 25,
        downvotesCount: 0,
        readingTime: 5,
        status: "draft" as const,
        publishedAt: null,
        authorId: authorId,
        showComments: true,
      },
      {
        type: "article" as const,
        title: "CSS Grid vs. Flexbox",
        slug: "e2e-css-grid-vs-flexbox",
        excerpt: "Choosing between CSS Grid and Flexbox.",
        body: "CSS Grid and Flexbox are powerful tools for creating responsive layouts.",
        upvotesCount: 18,
        downvotesCount: 0,
        readingTime: 4,
        status: "draft" as const,
        publishedAt: null,
        authorId: authorId,
        showComments: true,
      },
      {
        type: "article" as const,
        title: "React Hooks Explained",
        slug: "e2e-react-hooks-explained",
        excerpt: "Simplify your React code with Hooks.",
        body: "React Hooks provide a robust solution to use state and other React features without writing a class.",
        upvotesCount: 22,
        downvotesCount: 1,
        readingTime: 5,
        status: "scheduled" as const,
        publishedAt: scheduled,
        authorId: authorId,
        showComments: true,
      },
      {
        type: "article" as const,
        title: "Web Accessibility Fundamentals",
        slug: "e2e-web-accessibility-fundamentals",
        excerpt: "Essential guidelines for web accessibility.",
        body: "Creating accessible websites is a critical aspect of modern web development.",
        upvotesCount: 20,
        downvotesCount: 0,
        readingTime: 3,
        status: "scheduled" as const,
        publishedAt: scheduled,
        authorId: authorId,
        showComments: true,
      },
      // Link posts for testing
      {
        type: "link" as const,
        title: "Codú GitHub Repository",
        slug: "e2e-link-published",
        excerpt: "The open-source repository for Codú - a space for coders.",
        body: "", // Link posts don't have body content
        externalUrl: "https://github.com/codu-code/codu",
        upvotesCount: 15,
        downvotesCount: 0,
        readingTime: 1,
        status: "published" as const,
        publishedAt: now,
        authorId: authorId,
        showComments: true,
      },
      {
        type: "link" as const,
        title: "Draft Link Post for Testing",
        slug: "e2e-link-draft",
        excerpt: "A draft link post used for E2E testing.",
        body: "",
        externalUrl: "https://www.codu.co",
        upvotesCount: 0,
        downvotesCount: 0,
        readingTime: 1,
        status: "draft" as const,
        publishedAt: null,
        authorId: authorId,
        showComments: true,
      },
      // Discussion + question posts (relaunch kinds) so the Discussions surface
      // and discussion threads have real content to test against.
      {
        type: "discussion" as const,
        title: "E2E Discussion: what's your testing setup?",
        slug: "e2e-discussion-published",
        excerpt: "Share how you test your apps end to end.",
        body: "What does your end-to-end testing setup look like in 2026?",
        upvotesCount: 8,
        downvotesCount: 0,
        readingTime: 1,
        status: "published" as const,
        publishedAt: now,
        authorId: authorId,
        showComments: true,
      },
      {
        type: "question" as const,
        title: "E2E Question: how do you seed test data?",
        slug: "e2e-question-published",
        excerpt: "Looking for patterns to seed Playwright fixtures.",
        body: "How do you keep e2e seed data realistic without it going stale?",
        upvotesCount: 5,
        downvotesCount: 0,
        readingTime: 1,
        status: "published" as const,
        publishedAt: now,
        authorId: authorId,
        showComments: true,
      },
    ];

    // Insert articles into new posts table
    const insertedPosts = await db
      .insert(posts)
      .values(articlesToCreate)
      .onConflictDoNothing()
      .returning();

    console.log(
      `Created ${insertedPosts.length} E2E test posts (articles + links)`,
    );

    // Find the published article to add a comment
    const publishedPost = insertedPosts.find(
      (p) => p.slug === "e2e-test-slug-published",
    );

    if (publishedPost) {
      // Generate a unique path for the comment (ltree format)
      const pathId = generateShortId().replace(/[^a-zA-Z0-9]/g, "");

      await db
        .insert(comments)
        .values({
          postId: publishedPost.id,
          body: "What a great article! Thanks for sharing",
          authorId: commenterId,
          path: pathId,
          depth: 0,
        })
        .onConflictDoNothing()
        .returning();

      console.log("Created E2E test comment");
    }

    // Seed a threaded conversation on the discussion post (top-level comment +
    // a nested reply) so the redesigned discussion thread has real data.
    const discussionPost = insertedPosts.find(
      (p) => p.slug === "e2e-discussion-published",
    );
    if (discussionPost) {
      const parentPath = generateShortId().replace(/[^a-zA-Z0-9]/g, "");
      const [parent] = await db
        .insert(comments)
        .values({
          postId: discussionPost.id,
          body: "We run Playwright against a seeded Postgres — works great.",
          authorId: commenterId,
          path: parentPath,
          depth: 0,
        })
        .onConflictDoNothing()
        .returning();

      if (parent) {
        const childPath = `${parentPath}.${generateShortId().replace(/[^a-zA-Z0-9]/g, "")}`;
        await db
          .insert(comments)
          .values({
            postId: discussionPost.id,
            body: "Same here — the trick is cleaning up between runs.",
            authorId: authorId,
            parentId: parent.id,
            path: childPath,
            depth: 1,
          })
          .onConflictDoNothing();
      }
      console.log("Created E2E discussion thread");
    }
  };

  // Follow graph: user two follows user one, so Following feed + followers/
  // following lists have data. Cleaned up via the user-delete cascade.
  const seedE2EFollow = async (followerId: string, followingId: string) => {
    await db
      .insert(follow)
      .values({ followerId, followingId })
      .onConflictDoNothing();
  };

  // Profile extras: topics (drives onboarding "pick topics" win + interests),
  // a referral code, and a few point events (drives the progress card + the
  // Achievements tab). Cleaned up via the user-delete cascade.
  const seedE2EProfile = async (userId: string) => {
    await db
      .update(user)
      .set({
        topics: ["AI", "Testing", "DevOps"],
        experienceLevel: "intermediate",
        onboardedAt: new Date().toISOString(),
        referralCode: "e2eref01",
      })
      .where(eq(user.id, userId));

    await db
      .insert(point_event)
      .values([
        {
          userId,
          action: "post_published" as const,
          points: 10,
          sourceType: "post",
          sourceId: "e2e-seed-1",
        },
        {
          userId,
          action: "daily_active" as const,
          points: 1,
          sourceType: "day",
          sourceId: "e2e-seed-day",
        },
      ])
      .onConflictDoNothing();
  };

  const seedE2EUser = async (
    email: string,
    id: string,
    name: string,
    username: string,
    role: "USER" | "ADMIN" | "MODERATOR" = "USER",
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
      role,
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
    const [userOne, userTwo, adminUser] = await Promise.all([
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
      seedE2EUser(
        E2E_ADMIN_EMAIL,
        E2E_ADMIN_ID,
        "E2E Admin User",
        "e2e-admin-user",
        "ADMIN",
      ),
    ]);

    console.log("Creating sessions");
    await Promise.all([
      seedE2EUserSession(userOne.id, E2E_USER_ONE_SESSION_ID),
      seedE2EUserSession(userTwo.id, E2E_USER_TWO_SESSION_ID),
      seedE2EUserSession(adminUser.id, E2E_ADMIN_SESSION_ID),
    ]);

    console.log("Creating articles");
    await addE2EArticleAndComment(E2E_USER_ONE_ID, E2E_USER_TWO_ID);

    console.log("Creating follow graph + profile data");
    await seedE2EFollow(E2E_USER_TWO_ID, E2E_USER_ONE_ID);
    await seedE2EProfile(E2E_USER_ONE_ID);

    console.log("DB setup successful");
  } catch (err) {
    console.log("Error while setting up DB before E2E test run", err);
  }
};

export default setup;
