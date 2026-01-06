import { nanoid, customAlphabet } from "nanoid";
import { Chance } from "chance";
import {
  posts,
  user,
  tag,
  post_tags,
  session,
  feed_sources,
  comments,
} from "../server/db/schema";
import { sql, eq } from "drizzle-orm";

// Generate Reddit-style short IDs: lowercase + numbers, 7 characters
const generateShortId = customAlphabet(
  "0123456789abcdefghijklmnopqrstuvwxyz",
  7,
);

// Generate slug from name
const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
};

import "dotenv/config";

import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const DATABASE_URL = process.env.DATABASE_URL || "";

if (!DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}
const client = postgres(DATABASE_URL, { max: 1 });
const db: PostgresJsDatabase = drizzle(client);

// By passing a number we get a repeatable source of random generation.
const main = async () => {
  const chance = new Chance(1);

  const sampleTags = [
    "JAVASCRIPT",
    "WEB DEVELOPMENT",
    "TUTORIAL",
    "PRODUCTIVITY",
    "CSS",
    "TERMINAL",
    "DJANGO",
    "PYTHON",
    "TIPS",
    "BACKEND",
  ];

  // Generate posts for the new posts table
  const randomPosts = (count = 10) => {
    return Array(count)
      .fill(null)
      .map(() => {
        const title = chance.sentence({
          words: chance.integer({ min: 4, max: 8 }),
        });
        const shortId = generateShortId();
        const isPublished = chance.bool({ likelihood: 70 });
        const publishedDate = isPublished
          ? new Date(chance.date({ year: 2024 })).toISOString()
          : null;

        return {
          type: "article" as const,
          title: title,
          slug: `${title
            .toLowerCase()
            .replace(/ /g, "-")
            .replace(/[^\w-]+/g, "")
            .substring(0, 100)}-${shortId}`,
          excerpt: chance.sentence({
            words: chance.integer({ min: 10, max: 20 }),
          }),
          readingTime: chance.integer({ min: 1, max: 10 }),
          status: isPublished ? ("published" as const) : ("draft" as const),
          publishedAt: publishedDate,
          upvotesCount: isPublished ? chance.integer({ min: 0, max: 50 }) : 0,
          downvotesCount: isPublished ? chance.integer({ min: 0, max: 5 }) : 0,
          showComments: true,
          body: `Hello world -
${chance.paragraph()}
## ${chance.sentence({ words: 6 })}

- ${chance.sentence({ words: 3 })}
- ${chance.sentence({ words: 2 })}
- ${chance.sentence({ words: 3 })}
- ${chance.sentence({ words: 4 })}

${chance.paragraph()} If you want to try a link click this [test link](https://www.codu.co/). ${chance.paragraph()}

${"```"}

function test() {
   console.log("notice the blank line before this function?");
}
${"```"}

${chance.paragraph()}
        `,
        };
      });
  };

  const generateUserData = (count = 100) => {
    const users = Array(count)
      .fill(null)
      .map(() => {
        const name = chance.name();
        return {
          username: `${name.split(" ").join("-").toLowerCase()}-${chance.integer(
            {
              min: 0,
              max: 999,
            },
          )}`,
          name,
          email: chance.email(),
          image: `https://robohash.org/${encodeURIComponent(name)}?bgset=bg1`,
          location: chance.country({ full: true }),
          bio: chance.sentence({ words: 10 }),
          websiteUrl: chance.url(),
        };
      });

    return users;
  };

  const userData = generateUserData();

  const addUserData = async () => {
    const tagsData = sampleTags.map((title) => ({ title }));

    const tagResponse = await db
      .insert(tag)
      .values(tagsData)
      .onConflictDoNothing()
      .returning({ id: tag.id, title: tag.title });

    const usersResponse = await db.insert(user).values(userData).returning();

    const postsData = randomPosts(60);
    const postsToInsert = postsData.map((p, index) => ({
      ...p,
      authorId: usersResponse[index % usersResponse.length].id,
    }));

    const postResponse = await db
      .insert(posts)
      .values(postsToInsert)
      .onConflictDoNothing()
      .returning();

    console.log(
      `Added ${usersResponse.length} users and ${postResponse.length} posts`,
    );

    return { users: usersResponse, posts: postResponse, tags: tagResponse };
  };

  // Initial RSS feed sources for content aggregator
  // Each source gets a slug auto-generated from the name
  const feedSourcesRaw = [
    // ============================================
    // Individual Developer Blogs
    // ============================================
    {
      name: "Josh W Comeau",
      url: "https://www.joshwcomeau.com/rss.xml",
      websiteUrl: "https://www.joshwcomeau.com",
      category: "frontend",
      description:
        "Frontend developer sharing CSS tricks, React patterns, and web development insights through interactive tutorials.",
    },
    {
      name: "Kent C. Dodds",
      url: "https://kentcdodds.com/blog/rss.xml",
      websiteUrl: "https://kentcdodds.com",
      category: "react",
      description:
        "Full stack JavaScript engineer teaching React and testing best practices through EpicReact and Testing JavaScript.",
    },
    {
      name: "Dan Abramov (Overreacted)",
      url: "https://overreacted.io/rss.xml",
      websiteUrl: "https://overreacted.io",
      category: "react",
      description:
        "React core team member exploring JavaScript fundamentals and React internals with deep technical insights.",
    },
    {
      name: "Robin Wieruch",
      url: "https://www.robinwieruch.de/index.xml",
      websiteUrl: "https://www.robinwieruch.de",
      category: "react",
    },
    {
      name: "Lee Robinson",
      url: "https://leerob.io/feed.xml",
      websiteUrl: "https://leerob.io",
      category: "nextjs",
    },
    {
      name: "Tania Rascia",
      url: "https://www.taniarascia.com/rss.xml",
      websiteUrl: "https://www.taniarascia.com",
      category: "webdev",
    },
    {
      name: "Flavio Copes",
      url: "https://flaviocopes.com/index.xml",
      websiteUrl: "https://flaviocopes.com",
      category: "javascript",
    },
    {
      name: "Wes Bos",
      url: "https://wesbos.com/rss.xml",
      websiteUrl: "https://wesbos.com",
      category: "javascript",
    },
    {
      name: "Sara Soueidan",
      url: "https://sarasoueidan.com/blog/index.xml",
      websiteUrl: "https://sarasoueidan.com",
      category: "css",
    },
    {
      name: "Addy Osmani",
      url: "https://addyosmani.com/rss.xml",
      websiteUrl: "https://addyosmani.com",
      category: "webperf",
    },
    {
      name: "Una Kravets",
      url: "https://una.im/feed.xml",
      websiteUrl: "https://una.im",
      category: "css",
    },
    {
      name: "Cassidy Williams",
      url: "https://cassidoo.co/rss.xml",
      websiteUrl: "https://cassidoo.co",
      category: "webdev",
    },
    {
      name: "Swyx",
      url: "https://www.swyx.io/rss.xml",
      websiteUrl: "https://www.swyx.io",
      category: "career",
    },
    {
      name: "Julia Evans",
      url: "https://jvns.ca/atom.xml",
      websiteUrl: "https://jvns.ca",
      category: "backend",
    },
    {
      name: "Monica Dinculescu",
      url: "https://meowni.ca/atom.xml",
      websiteUrl: "https://meowni.ca",
      category: "webdev",
    },
    {
      name: "Lea Verou",
      url: "https://lea.verou.me/feed.xml",
      websiteUrl: "https://lea.verou.me",
      category: "css",
    },
    {
      name: "Ahmad Shadeed",
      url: "https://ishadeed.com/feed.xml",
      websiteUrl: "https://ishadeed.com",
      category: "css",
    },
    {
      name: "Stefan Judis",
      url: "https://www.stefanjudis.com/rss.xml",
      websiteUrl: "https://www.stefanjudis.com",
      category: "webdev",
    },
    {
      name: "Zach Leatherman",
      url: "https://www.zachleat.com/web/feed/",
      websiteUrl: "https://www.zachleat.com",
      category: "jamstack",
    },
    {
      name: "Jake Archibald",
      url: "https://jakearchibald.com/posts.rss",
      websiteUrl: "https://jakearchibald.com",
      category: "webdev",
    },
    // ============================================
    // Publications & Aggregators
    // ============================================
    {
      name: "CSS-Tricks",
      url: "https://css-tricks.com/feed/",
      websiteUrl: "https://css-tricks.com",
      category: "css",
    },
    {
      name: "Smashing Magazine",
      url: "https://www.smashingmagazine.com/feed/",
      websiteUrl: "https://www.smashingmagazine.com",
      category: "webdev",
    },
    {
      name: "freeCodeCamp",
      url: "https://www.freecodecamp.org/news/rss/",
      websiteUrl: "https://www.freecodecamp.org/news",
      category: "tutorial",
    },
    // A List Apart removed - poor quality RSS feed data
    {
      name: "LogRocket Blog",
      url: "https://blog.logrocket.com/feed/",
      websiteUrl: "https://blog.logrocket.com",
      category: "frontend",
    },
    {
      name: "The New Stack",
      url: "https://thenewstack.io/feed/",
      websiteUrl: "https://thenewstack.io",
      category: "devops",
    },
    {
      name: "InfoQ",
      url: "https://feed.infoq.com/",
      websiteUrl: "https://www.infoq.com",
      category: "enterprise",
    },
    {
      name: "Hacker Noon",
      url: "https://hackernoon.com/feed",
      websiteUrl: "https://hackernoon.com",
      category: "tech",
    },
    {
      name: "SitePoint",
      url: "https://www.sitepoint.com/feed/",
      websiteUrl: "https://www.sitepoint.com",
      category: "webdev",
    },
    {
      name: "Codrops",
      url: "https://tympanus.net/codrops/feed/",
      websiteUrl: "https://tympanus.net/codrops",
      category: "frontend",
    },
    {
      name: "web.dev",
      url: "https://web.dev/feed.xml",
      websiteUrl: "https://web.dev",
      category: "webdev",
    },
    // ============================================
    // Company Engineering Blogs
    // ============================================
    {
      name: "Vercel Blog",
      url: "https://vercel.com/blog/rss.xml",
      websiteUrl: "https://vercel.com/blog",
      category: "nextjs",
    },
    {
      name: "Netlify Blog",
      url: "https://www.netlify.com/blog/feed.xml",
      websiteUrl: "https://www.netlify.com/blog",
      category: "jamstack",
    },
    {
      name: "Prisma Blog",
      url: "https://www.prisma.io/blog/rss.xml",
      websiteUrl: "https://www.prisma.io/blog",
      category: "database",
    },
    {
      name: "Supabase Blog",
      url: "https://supabase.com/blog/rss.xml",
      websiteUrl: "https://supabase.com/blog",
      category: "backend",
    },
    {
      name: "Cloudflare Blog",
      url: "https://blog.cloudflare.com/rss/",
      websiteUrl: "https://blog.cloudflare.com",
      category: "devops",
    },
    {
      name: "GitHub Blog",
      url: "https://github.blog/feed/",
      websiteUrl: "https://github.blog",
      category: "devtools",
    },
    {
      name: "Stripe Blog",
      url: "https://stripe.com/blog/feed.rss",
      websiteUrl: "https://stripe.com/blog",
      category: "backend",
    },
    {
      name: "Netflix Tech Blog",
      url: "https://netflixtechblog.com/feed",
      websiteUrl: "https://netflixtechblog.com",
      category: "engineering",
    },
    {
      name: "Spotify Engineering",
      url: "https://engineering.atspotify.com/feed/",
      websiteUrl: "https://engineering.atspotify.com",
      category: "engineering",
    },
    {
      name: "Airbnb Engineering",
      url: "https://medium.com/feed/airbnb-engineering",
      websiteUrl: "https://medium.com/airbnb-engineering",
      category: "engineering",
    },
    {
      name: "Uber Engineering",
      url: "https://www.uber.com/en-IE/blog/engineering/rss/",
      websiteUrl: "https://www.uber.com/blog/engineering",
      category: "engineering",
    },
    {
      name: "Shopify Engineering",
      url: "https://shopify.engineering/blog.atom",
      websiteUrl: "https://shopify.engineering",
      category: "engineering",
    },
    {
      name: "Discord Blog",
      url: "https://discord.com/blog/rss.xml",
      websiteUrl: "https://discord.com/blog",
      category: "engineering",
    },
    {
      name: "Linear Blog",
      url: "https://linear.app/blog/rss.xml",
      websiteUrl: "https://linear.app/blog",
      category: "product",
    },
    {
      name: "Render Blog",
      url: "https://render.com/blog/rss.xml",
      websiteUrl: "https://render.com/blog",
      category: "devops",
    },
    {
      name: "Railway Blog",
      url: "https://blog.railway.app/feed.xml",
      websiteUrl: "https://blog.railway.app",
      category: "devops",
    },
    {
      name: "PlanetScale Blog",
      url: "https://planetscale.com/blog/rss.xml",
      websiteUrl: "https://planetscale.com/blog",
      category: "database",
    },
    {
      name: "Turso Blog",
      url: "https://blog.turso.tech/rss.xml",
      websiteUrl: "https://blog.turso.tech",
      category: "database",
    },
    {
      name: "Deno Blog",
      url: "https://deno.com/blog/rss.xml",
      websiteUrl: "https://deno.com/blog",
      category: "javascript",
    },
    {
      name: "Bun Blog",
      url: "https://bun.sh/blog/rss.xml",
      websiteUrl: "https://bun.sh/blog",
      category: "javascript",
    },
    {
      name: "Figma Blog",
      url: "https://www.figma.com/blog/feed/",
      websiteUrl: "https://www.figma.com/blog",
      category: "design",
    },
    {
      name: "Notion Blog",
      url: "https://www.notion.so/blog/rss.xml",
      websiteUrl: "https://www.notion.so/blog",
      category: "product",
    },
    // ============================================
    // Career & Industry
    // ============================================
    {
      name: "The Pragmatic Engineer",
      url: "https://newsletter.pragmaticengineer.com/feed",
      websiteUrl: "https://newsletter.pragmaticengineer.com",
      category: "career",
    },
    {
      name: "StaffEng",
      url: "https://staffeng.com/feed.xml",
      websiteUrl: "https://staffeng.com",
      category: "career",
    },
    {
      name: "Bytes.dev",
      url: "https://bytes.dev/rss",
      websiteUrl: "https://bytes.dev",
      category: "javascript",
    },
    {
      name: "This Week in React",
      url: "https://thisweekinreact.com/rss.xml",
      websiteUrl: "https://thisweekinreact.com",
      category: "react",
    },
    // ============================================
    // AI/ML
    // ============================================
    {
      name: "Hugging Face Blog",
      url: "https://huggingface.co/blog/feed.xml",
      websiteUrl: "https://huggingface.co/blog",
      category: "ai",
    },
    {
      name: "OpenAI Blog",
      url: "https://openai.com/blog/rss/",
      websiteUrl: "https://openai.com/blog",
      category: "ai",
    },
    {
      name: "Anthropic News",
      url: "https://www.anthropic.com/news/rss.xml",
      websiteUrl: "https://www.anthropic.com/news",
      category: "ai",
    },
    {
      name: "Google AI Blog",
      url: "https://blog.research.google/feeds/posts/default",
      websiteUrl: "https://blog.research.google",
      category: "ai",
    },
    {
      name: "Towards Data Science",
      url: "https://towardsdatascience.com/feed",
      websiteUrl: "https://towardsdatascience.com",
      category: "ai",
    },
    {
      name: "The Batch (DeepLearning.AI)",
      url: "https://www.deeplearning.ai/the-batch/feed/",
      websiteUrl: "https://www.deeplearning.ai/the-batch",
      category: "ai",
    },
  ];

  // Transform raw sources to include generated slugs
  const feedSources = feedSourcesRaw.map((source) => ({
    ...source,
    slug: generateSlug(source.name),
  }));

  const addFeedSources = async () => {
    const sourcesResponse = await db
      .insert(feed_sources)
      .values(feedSources)
      .onConflictDoNothing()
      .returning();

    console.log(`Added ${sourcesResponse.length} feed sources`);
    return sourcesResponse;
  };

  // Add sample LINK posts directly to posts table for testing
  const addSampleLinks = async (
    sourceIds: { id: number; websiteUrl: string | null; slug: string | null }[],
    users: { id: string }[],
  ) => {
    if (sourceIds.length === 0) {
      console.log("No sources to add links for, fetching from DB...");
      const existingSources = await db
        .select({
          id: feed_sources.id,
          websiteUrl: feed_sources.websiteUrl,
          slug: feed_sources.slug,
        })
        .from(feed_sources);
      if (existingSources.length === 0) {
        console.log("No feed sources found, skipping sample links");
        return [];
      }
      sourceIds = existingSources;
    }

    // Filter to only sources with valid websiteUrls
    const validSources = sourceIds.filter(
      (s) => s.websiteUrl && s.websiteUrl.length > 0,
    );
    if (validSources.length === 0) {
      console.log("No sources with valid websiteUrls, skipping sample links");
      return [];
    }

    if (users.length === 0) {
      console.log("No users to assign as authors, skipping sample links");
      return [];
    }

    const sampleLinks = [];
    const now = new Date();

    // Sample article titles
    const sampleTitles = [
      "Building Scalable React Applications with Server Components",
      "The Complete Guide to CSS Grid Layout in 2024",
      "Understanding TypeScript Generics: A Practical Guide",
      "10 JavaScript Performance Tips Every Developer Should Know",
      "How We Migrated Our Monolith to Microservices",
      "Introduction to Edge Computing for Web Developers",
      "Mastering Git Branching Strategies for Large Teams",
      "Deep Dive into Node.js Event Loop",
      "Creating Accessible Forms: Best Practices",
      "The Future of Web Development: Trends to Watch",
      "Optimizing Database Queries in PostgreSQL",
      "Building Real-time Applications with WebSockets",
      "Container Security Best Practices for Kubernetes",
      "A Beginner's Guide to GraphQL APIs",
      "Testing React Applications with Vitest and Testing Library",
      "Modern Authentication Patterns with OAuth 2.0 and OIDC",
      "Deploying Next.js Applications to the Edge",
      "State Management in 2024: Redux vs Zustand vs Jotai",
      "Web Performance Optimization: Core Web Vitals Deep Dive",
      "Building Design Systems with Tailwind CSS",
      "Understanding React Concurrent Features",
      "Advanced CSS Animations and Transitions",
      "Migrating from REST to GraphQL: Lessons Learned",
      "Serverless Architecture Patterns for Modern Apps",
      "End-to-End Testing with Playwright",
      "TypeScript 5.0: New Features and Migration Guide",
      "CI/CD Pipeline Best Practices for JavaScript Projects",
      "Implementing Dark Mode: A Complete Guide",
      "Web Components vs React: When to Use Each",
      "Database Indexing Strategies for High Performance",
      "Building CLI Tools with Node.js",
      "WebAssembly for JavaScript Developers",
      "Micro-Frontends Architecture in Practice",
      "API Rate Limiting and Throttling Techniques",
      "Debugging Production Issues in Node.js",
      "React Query vs SWR: Data Fetching Compared",
      "Secure Coding Practices for Web Developers",
      "Progressive Web Apps in 2024",
      "Understanding the JavaScript Module System",
      "Building Accessible Navigation Components",
      "Docker Best Practices for Development Teams",
      "Functional Programming Patterns in JavaScript",
      "Real-time Collaboration with CRDTs",
      "Monitoring and Observability for Web Apps",
      "Code Review Best Practices for Remote Teams",
    ];

    // Add 3 sample links per source
    for (let i = 0; i < Math.min(15, validSources.length); i++) {
      const source = validSources[i];
      for (let j = 0; j < 3; j++) {
        const daysAgo = chance.integer({ min: 1, max: 14 });
        const publishedDate = new Date(
          now.getTime() - daysAgo * 24 * 60 * 60 * 1000,
        );
        const shortId = generateShortId();
        const title = sampleTitles[(i * 3 + j) % sampleTitles.length];
        const slug = `${title
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, "")
          .replace(/\s+/g, "-")
          .substring(0, 100)}-${shortId}`;

        sampleLinks.push({
          type: "link" as const,
          title,
          excerpt: chance.paragraph(),
          externalUrl: `${source.websiteUrl}/posts/${chance.word()}-${chance.word()}-${chance.integer({ min: 1000, max: 9999 })}`,
          sourceId: source.id,
          sourceAuthor: chance.name(),
          slug,
          authorId: users[0].id, // Use first user as author for external links
          status: "published" as const,
          publishedAt: publishedDate.toISOString(),
          upvotesCount: chance.integer({ min: 0, max: 100 }),
          downvotesCount: chance.integer({ min: 0, max: 10 }),
          viewsCount: chance.integer({ min: 0, max: 500 }),
          readingTime: chance.integer({ min: 3, max: 15 }),
          showComments: true,
        });
      }
    }

    const linksResponse = await db
      .insert(posts)
      .values(sampleLinks)
      .onConflictDoNothing()
      .returning();

    console.log(`Added ${linksResponse.length} sample LINK posts`);
    return linksResponse;
  };

  // Add sample comments on posts
  const addSampleComments = async (
    users: { id: string }[],
    postItems: { id: string }[],
  ) => {
    if (users.length === 0) {
      console.log("No users found, skipping comments");
      return;
    }

    if (postItems.length === 0) {
      console.log("No posts found, skipping comments");
      return;
    }

    const commentsData = [];

    // Add comments on posts
    for (const postItem of postItems.slice(0, 10)) {
      const numComments = chance.integer({ min: 1, max: 5 });
      for (let i = 0; i < numComments; i++) {
        // Generate a unique path for each comment (ltree format: alphanumeric, underscores)
        const pathId = generateShortId().replace(/[^a-zA-Z0-9]/g, "");
        commentsData.push({
          body: chance.paragraph(),
          postId: postItem.id,
          authorId: users[chance.integer({ min: 0, max: users.length - 1 })].id,
          path: pathId,
          depth: 0,
        });
      }
    }

    if (commentsData.length === 0) {
      console.log("No comments to add");
      return;
    }

    const commentsResponse = await db
      .insert(comments)
      .values(commentsData)
      .onConflictDoNothing()
      .returning();

    console.log(`Added ${commentsResponse.length} sample comments`);

    // Add some nested replies
    if (commentsResponse.length > 0) {
      const replies = [];
      for (const comment of commentsResponse.slice(0, 5)) {
        // Generate reply path by appending to parent's path
        const replyPathId = generateShortId().replace(/[^a-zA-Z0-9]/g, "");
        replies.push({
          body: chance.sentence({
            words: chance.integer({ min: 10, max: 30 }),
          }),
          postId: comment.postId,
          authorId: users[chance.integer({ min: 0, max: users.length - 1 })].id,
          parentId: comment.id,
          path: `${comment.path}.${replyPathId}`,
          depth: 1,
        });
      }

      const repliesResponse = await db
        .insert(comments)
        .values(replies)
        .onConflictDoNothing()
        .returning();

      console.log(`Added ${repliesResponse.length} nested replies`);
    }
  };

  async function addSeedDataToDb() {
    console.log(`Start seeding, please wait... `);

    try {
      // Add users and posts (to new posts table)
      const userData = await addUserData();

      // Add feed sources with slugs
      const sources = await addFeedSources();

      // Add sample LINK posts for testing (directly to posts table)
      await addSampleLinks(sources, userData.users);

      // Add sample comments on posts
      if (userData && userData.posts.length > 0) {
        // Filter to only published posts
        const publishedPosts = userData.posts.filter(
          (p) => p.status === "published",
        );
        await addSampleComments(userData.users, publishedPosts);
      }
    } catch (error) {
      console.log("Error:", error);
    }

    console.log(`Seeding finished.`);
    process.exit(0);
  }

  async function deleteDataFromAllTables() {
    const query = sql<string>`SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE';
    `;

    const tables = await db.execute(query); // retrieve tables

    for (const table of tables) {
      try {
        const query =
          await sql`DELETE FROM "${sql.raw(table.table_name as string)}" CASCADE;`;
        await db.execute(query);
        console.log("Delete", table.table_name);
        console.log(`Skipping ${table.table_name}`);
      } catch (error) {
        console.log(`Error deleting ${table.table_name}: ${error}`);
      }
    }

    console.log(`Database emptied`);
  }

  if (process.env.NODE_ENV !== "production") {
    await deleteDataFromAllTables();
    await addSeedDataToDb();
  } else {
    console.log(
      "This script is only for development, it will delete all of your data.",
    );
  }
};

main();
