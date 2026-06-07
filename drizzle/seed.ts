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
  follow,
  bookmarks,
  post_votes,
  job,
  point_event,
  user_streak,
  badge,
  user_badge,
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
    // Relaunch / AI-builder oriented tags
    "AI",
    "RAG",
    "AGENTS",
    "PROMPTING",
    "LLM APPS",
    "INDIE HACKING",
    "STARTUPS",
    "CAREER",
    "TYPESCRIPT",
    "REACT",
  ];

  // Onboarding topic pool ("Your topics") used to populate user.topics and to
  // tag relaunch posts. Mirrors the relaunch positioning toward AI builders /
  // indie hackers.
  const topicPool = [
    "AI patterns",
    "RAG",
    "Agents",
    "Prompting",
    "LLM apps",
    "Product",
    "Frontend",
    "Career",
    "Indie hacking",
    "Startups",
  ];

  const experienceLevels = [
    "beginner",
    "intermediate",
    "advanced",
    "professional",
  ];

  // Pick `n` distinct topics from the pool.
  const pickTopics = (n: number) =>
    chance.pickset(topicPool, Math.min(n, topicPool.length));

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

  const slugify = (title: string, shortId: string) =>
    `${title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .substring(0, 100)}-${shortId}`;

  // Curated relaunch posts exercising EVERY post type + a spread of statuses,
  // dates and vote/comment counts so feed filters (type) and sorts (Latest /
  // Most helpful / Most discussed) all differ. `tagTitles` are matched to
  // seeded tags by title; `coreAuthor` indexes into coreUsers.
  const buildRelaunchPosts = () => {
    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;
    // daysAgo helper → ISO string.
    const ago = (d: number) => new Date(now - d * day).toISOString();

    type Seed = {
      type: "article" | "discussion" | "link" | "resource" | "til" | "question";
      title: string;
      excerpt: string;
      body?: string;
      externalUrl?: string;
      status: "published" | "in_review" | "draft";
      coreAuthor: number;
      daysAgo: number;
      upvotes: number;
      tagTitles: string[];
      featured?: boolean;
    };

    const seeds: Seed[] = [
      // ── Articles (published, body + tags) ────────────────────────────────
      {
        type: "article",
        title: "Patterns for production RAG that actually retrieve the right thing",
        excerpt:
          "Chunking, hybrid search and reranking — the three levers that moved our retrieval quality the most.",
        body: "## The problem\nMost RAG demos look great until real documents hit them.\n\n## What worked\n- Smaller, semantically-coherent chunks\n- Hybrid (keyword + vector) retrieval\n- A cross-encoder reranker on the top 50\n\nWe went from ~60% to ~88% answer relevance with these three changes alone.",
        status: "published",
        coreAuthor: 1,
        daysAgo: 2,
        upvotes: 142,
        tagTitles: ["RAG", "AI", "BACKEND"],
        featured: true,
      },
      {
        type: "article",
        title: "Evals before vibes: how we stopped shipping broken agents",
        excerpt:
          "A practical eval harness you can build in an afternoon that catches regressions before users do.",
        body: "## Why\nWithout evals, every prompt tweak is a coin flip.\n\n## The harness\nWe log every agent run, label a golden set, and gate deploys on a pass threshold. Cheap, boring, effective.",
        status: "published",
        coreAuthor: 6,
        daysAgo: 9,
        upvotes: 97,
        tagTitles: ["AGENTS", "AI", "LLM APPS"],
      },
      {
        type: "article",
        title: "From frontend dev to LLM apps without losing your mind",
        excerpt:
          "The mental-model shifts that helped me go from React components to streaming LLM UIs.",
        body: "## Streaming changes everything\nYour UI is now a function of a token stream, not a request/response.\n\n## Keep your DX\nGood TypeScript types around the model boundary save you constantly.",
        status: "published",
        coreAuthor: 2,
        daysAgo: 15,
        upvotes: 64,
        tagTitles: ["FRONTEND", "LLM APPS", "TYPESCRIPT"],
      },
      {
        type: "article",
        title: "Distribution is the hard part: 90 days of building in public",
        excerpt:
          "What moved the needle for an indie SaaS — and what was a total waste of time.",
        body: "## TL;DR\nBuilding was easy. Getting anyone to care was the job.\n\nProof-of-work posts beat launch posts. Boring consistency beat viral spikes.",
        status: "published",
        coreAuthor: 5,
        daysAgo: 22,
        upvotes: 118,
        tagTitles: ["INDIE HACKING", "STARTUPS", "PRODUCTIVITY"],
      },

      // ── Discussions ──────────────────────────────────────────────────────
      {
        type: "discussion",
        title: "What's your actual agent stack in production right now?",
        excerpt:
          "Framework, model, eval setup, hosting — curious what's holding up under real load.",
        body: "Mine: a thin custom loop, Sonnet for planning, Haiku for the cheap steps, and a homemade eval gate. What are you running?",
        status: "published",
        coreAuthor: 0,
        daysAgo: 1,
        upvotes: 38,
        tagTitles: ["AGENTS", "AI"],
      },
      {
        type: "discussion",
        title: "Is 'prompt engineering' still a real skill in 2026?",
        excerpt: "Or have the models gotten good enough that it barely matters?",
        body: "I keep going back and forth. For simple tasks it's noise; for agents it's still load-bearing. Where do you land?",
        status: "published",
        coreAuthor: 3,
        daysAgo: 4,
        upvotes: 51,
        tagTitles: ["PROMPTING", "AI"],
      },

      // ── Questions ────────────────────────────────────────────────────────
      {
        type: "question",
        title: "How do you handle PDF tables in a RAG pipeline?",
        excerpt:
          "Vanilla extraction mangles them and the model gives confidently wrong numbers.",
        body: "Tried a few parsers, all of them flatten the structure. Anyone solved this cleanly without going full vision model?",
        status: "published",
        coreAuthor: 4,
        daysAgo: 3,
        upvotes: 27,
        tagTitles: ["RAG", "AI"],
      },
      {
        type: "question",
        title: "First ML eng role — is a portfolio or a degree worth more?",
        excerpt: "Career-switching and trying to spend my limited hours wisely.",
        body: "Recruiters seem to want both. If you hire, what actually makes you click 'interview'?",
        status: "published",
        coreAuthor: 4,
        daysAgo: 11,
        upvotes: 19,
        tagTitles: ["CAREER"],
      },

      // ── TIL (today I learned) ────────────────────────────────────────────
      {
        type: "til",
        title: "TIL you can cache the system prompt and cut token cost ~80%",
        excerpt: "Prompt caching on long, stable system prompts is basically free money.",
        body: "If your system prompt is big and rarely changes, caching it slashes cost and latency. Wish I'd done this months ago.",
        status: "published",
        coreAuthor: 6,
        daysAgo: 2,
        upvotes: 73,
        tagTitles: ["LLM APPS", "TIPS", "AI"],
      },
      {
        type: "til",
        title: "TIL `structuredClone` is built into every modern runtime",
        excerpt: "No more JSON.parse(JSON.stringify(...)) hacks for deep copies.",
        body: "Works in Node, Deno, Bun and browsers. Handles Maps, Sets and Dates too.",
        status: "published",
        coreAuthor: 7,
        daysAgo: 6,
        upvotes: 45,
        tagTitles: ["JAVASCRIPT", "TIPS"],
      },

      // ── User-authored links (externalUrl, no curated source) ─────────────
      {
        type: "link",
        title: "A great write-up on building eval-driven agents",
        excerpt: "Sharing this — closest thing to how I actually work day to day.",
        externalUrl: "https://example.com/eval-driven-agents",
        status: "published",
        coreAuthor: 0,
        daysAgo: 5,
        upvotes: 31,
        tagTitles: ["AGENTS", "AI"],
      },
      {
        type: "link",
        title: "The indie hacker's guide to first 100 customers",
        excerpt: "Tactical, not motivational. Bookmarking for later.",
        externalUrl: "https://example.com/first-100-customers",
        status: "published",
        coreAuthor: 5,
        daysAgo: 8,
        upvotes: 22,
        tagTitles: ["INDIE HACKING", "STARTUPS"],
      },

      // ── Resource ─────────────────────────────────────────────────────────
      {
        type: "resource",
        title: "Open-source prompt library for common app tasks",
        excerpt: "Battle-tested prompts for summarisation, extraction and classification.",
        externalUrl: "https://example.com/prompt-library",
        status: "published",
        coreAuthor: 3,
        daysAgo: 12,
        upvotes: 40,
        tagTitles: ["PROMPTING", "LLM APPS"],
      },

      // ── Moderation / profile states ──────────────────────────────────────
      {
        type: "article",
        title: "Draft: notes on multi-agent orchestration (WIP)",
        excerpt: "Still messy — parking my thoughts before I forget them.",
        body: "Rough notes only. Coordination overhead seems to dominate once you pass ~3 agents.",
        status: "draft",
        coreAuthor: 1,
        daysAgo: 1,
        upvotes: 0,
        tagTitles: ["AGENTS"],
      },
      {
        type: "article",
        title: "Submitted: a beginner-friendly intro to vector databases",
        excerpt: "Awaiting review — feedback welcome once it's live.",
        body: "Covers embeddings, similarity search and when you actually need a dedicated vector DB.",
        status: "in_review",
        coreAuthor: 4,
        daysAgo: 1,
        upvotes: 0,
        tagTitles: ["RAG", "BACKEND"],
      },
      {
        type: "question",
        title: "Submitted: anyone using Bun in production for an LLM gateway?",
        excerpt: "Pending review — wondering about stability at scale.",
        body: "Tempted by the speed but nervous about edge cases. Real-world reports appreciated.",
        status: "in_review",
        coreAuthor: 7,
        daysAgo: 1,
        upvotes: 0,
        tagTitles: ["BACKEND", "JAVASCRIPT"],
      },
    ];

    return seeds.map((s) => {
      const shortId = generateShortId();
      const published = s.status === "published";
      return {
        row: {
          type: s.type,
          title: s.title,
          slug: slugify(s.title, shortId),
          excerpt: s.excerpt,
          body: s.body ?? null,
          externalUrl: s.externalUrl ?? null,
          readingTime: chance.integer({ min: 1, max: 12 }),
          status: s.status,
          publishedAt: published ? ago(s.daysAgo) : null,
          createdAt: ago(s.daysAgo),
          upvotesCount: s.upvotes,
          downvotesCount: published
            ? chance.integer({ min: 0, max: 6 })
            : 0,
          viewsCount: published ? s.upvotes * chance.integer({ min: 3, max: 12 }) : 0,
          featured: s.featured ?? false,
          showComments: true,
        },
        coreAuthor: s.coreAuthor,
        tagTitles: s.tagTitles,
      };
    });
  };

  // Hand-authored core users with realistic names, bios and topics so the
  // relaunch feed/profiles look alive (search, "Your topics", follows, etc.).
  const coreUsersRaw = [
    {
      name: "Amara Okafor",
      bio: "Building AI agents that actually ship. Ex-platform eng, now indie.",
      topics: ["Agents", "LLM apps", "Indie hacking"],
      experienceLevel: "advanced",
    },
    {
      name: "Diego Fernández",
      bio: "RAG nerd. Turning messy docs into useful answers for SMBs.",
      topics: ["RAG", "AI patterns", "Startups"],
      experienceLevel: "professional",
    },
    {
      name: "Priya Natarajan",
      bio: "Frontend engineer who fell down the LLM rabbit hole. React + DX.",
      topics: ["Frontend", "LLM apps", "Product"],
      experienceLevel: "intermediate",
    },
    {
      name: "Tom Whelan",
      bio: "Solo founder shipping a prompt-ops tool. Learning in public.",
      topics: ["Prompting", "Indie hacking", "Product"],
      experienceLevel: "intermediate",
    },
    {
      name: "Lina Haddad",
      bio: "Career-switcher into ML eng. Writing the guides I wish I'd had.",
      topics: ["Career", "AI patterns", "RAG"],
      experienceLevel: "beginner",
    },
    {
      name: "Marcus Bell",
      bio: "Startups, distribution, and the unglamorous work of getting users.",
      topics: ["Startups", "Indie hacking", "Product"],
      experienceLevel: "professional",
    },
    {
      name: "Yuki Tanaka",
      bio: "Building eval harnesses so agents stop hallucinating in prod.",
      topics: ["Agents", "AI patterns", "LLM apps"],
      experienceLevel: "advanced",
    },
    {
      name: "Grace Mwangi",
      bio: "Full-stack dev. Big on TypeScript, small on meetings.",
      topics: ["Frontend", "Career", "Product"],
      experienceLevel: "intermediate",
    },
  ];

  const coreUsers = coreUsersRaw.map((u, i) => ({
    username: `${u.name.split(" ").join("-").toLowerCase()}-${100 + i}`,
    name: u.name,
    email: `${u.name.split(" ").join(".").toLowerCase()}@example.com`,
    image: `https://robohash.org/${encodeURIComponent(u.name)}?bgset=bg1`,
    location: chance.country({ full: true }),
    bio: u.bio,
    websiteUrl: chance.url(),
    topics: u.topics,
    experienceLevel: u.experienceLevel,
    // Core users have all completed onboarding.
    onboardedAt: new Date(chance.date({ year: 2025 })).toISOString(),
  }));

  const generateUserData = (count = 100) => {
    const users = Array(count)
      .fill(null)
      .map((_, i) => {
        const name = chance.name();
        // ~70% of generated users have finished onboarding (topics + level set).
        const onboarded = chance.bool({ likelihood: 70 });
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
          topics: onboarded ? pickTopics(chance.integer({ min: 2, max: 4 })) : [],
          experienceLevel: onboarded ? chance.pickone(experienceLevels) : null,
          onboardedAt: onboarded
            ? new Date(chance.date({ year: 2025 })).toISOString()
            : null,
        };
      });

    return users;
  };

  // Core named users first (stable indices), then a pool of generated ones.
  const userData = [...coreUsers, ...generateUserData()];

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
      `Added ${usersResponse.length} users and ${postResponse.length} random posts`,
    );

    // ── Curated relaunch posts (all types, varied status/dates/counts) ──────
    const tagByTitle = new Map(tagResponse.map((t) => [t.title, t.id]));
    const relaunchSeeds = buildRelaunchPosts();
    const relaunchToInsert = relaunchSeeds.map((s) => ({
      ...s.row,
      authorId: usersResponse[s.coreAuthor].id,
    }));

    const relaunchResponse = await db
      .insert(posts)
      .values(relaunchToInsert)
      .onConflictDoNothing()
      .returning();

    console.log(`Added ${relaunchResponse.length} curated relaunch posts`);

    // Link curated posts to seeded tags via post_tags, keeping tag.postCount
    // roughly consistent.
    const postTagRows: { postId: string; tagId: number }[] = [];
    const tagCounts = new Map<number, number>();
    relaunchResponse.forEach((post, i) => {
      const seed = relaunchSeeds[i];
      for (const title of seed.tagTitles) {
        const tagId = tagByTitle.get(title);
        if (!tagId) continue;
        postTagRows.push({ postId: post.id, tagId });
        tagCounts.set(tagId, (tagCounts.get(tagId) ?? 0) + 1);
      }
    });

    if (postTagRows.length > 0) {
      await db.insert(post_tags).values(postTagRows).onConflictDoNothing();
      // Bump denormalized postCount per tag.
      for (const [tagId, count] of tagCounts) {
        await db
          .update(tag)
          .set({ postCount: count })
          .where(eq(tag.id, tagId));
      }
      console.log(`Linked ${postTagRows.length} post_tags`);
    }

    return {
      users: usersResponse,
      posts: [...postResponse, ...relaunchResponse],
      tags: tagResponse,
    };
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

  // Follow graph — wire core users together so the Following feed,
  // followers/following lists and follow notifications have data.
  const addFollows = async (users: { id: string }[]) => {
    if (users.length < 2) return;
    const coreCount = Math.min(coreUsers.length, users.length);
    const pairs = new Set<string>();
    const rows: { followerId: string; followingId: string }[] = [];

    // Each core user follows 3–5 others (core + a few random).
    for (let i = 0; i < coreCount; i++) {
      const followerId = users[i].id;
      const targets = chance.pickset(
        users.filter((u) => u.id !== followerId),
        chance.integer({ min: 3, max: 5 }),
      );
      for (const t of targets) {
        const key = `${followerId}:${t.id}`;
        if (pairs.has(key)) continue;
        pairs.add(key);
        rows.push({ followerId, followingId: t.id });
      }
    }

    // A handful of random users follow the core (gives them followers).
    for (let i = coreCount; i < Math.min(coreCount + 20, users.length); i++) {
      const followerId = users[i].id;
      const followingId = users[chance.integer({ min: 0, max: coreCount - 1 })].id;
      const key = `${followerId}:${followingId}`;
      if (pairs.has(key) || followerId === followingId) continue;
      pairs.add(key);
      rows.push({ followerId, followingId });
    }

    if (rows.length === 0) return;
    const res = await db
      .insert(follow)
      .values(rows)
      .onConflictDoNothing()
      .returning();
    console.log(`Added ${res.length} follows`);
  };

  // Bookmarks + post votes on published posts (exercises saved/voted states).
  const addBookmarksAndVotes = async (
    users: { id: string }[],
    publishedPosts: { id: string }[],
  ) => {
    if (users.length === 0 || publishedPosts.length === 0) return;

    const bookmarkRows: { postId: string; userId: string }[] = [];
    const bookmarkSeen = new Set<string>();
    const voteRows: {
      postId: string;
      userId: string;
      voteType: "up" | "down";
    }[] = [];
    const voteSeen = new Set<string>();

    for (const post of publishedPosts.slice(0, 25)) {
      // 1–3 bookmarks per post.
      const bookmarkers = chance.pickset(
        users,
        chance.integer({ min: 1, max: 3 }),
      );
      for (const u of bookmarkers) {
        const key = `${post.id}:${u.id}`;
        if (bookmarkSeen.has(key)) continue;
        bookmarkSeen.add(key);
        bookmarkRows.push({ postId: post.id, userId: u.id });
      }

      // 2–5 votes per post (mostly up).
      const voters = chance.pickset(users, chance.integer({ min: 2, max: 5 }));
      for (const u of voters) {
        const key = `${post.id}:${u.id}`;
        if (voteSeen.has(key)) continue;
        voteSeen.add(key);
        voteRows.push({
          postId: post.id,
          userId: u.id,
          voteType: chance.bool({ likelihood: 85 }) ? "up" : "down",
        });
      }
    }

    if (bookmarkRows.length > 0) {
      const res = await db
        .insert(bookmarks)
        .values(bookmarkRows)
        .onConflictDoNothing()
        .returning();
      console.log(`Added ${res.length} bookmarks`);
    }
    if (voteRows.length > 0) {
      const res = await db
        .insert(post_votes)
        .values(voteRows)
        .onConflictDoNothing()
        .returning();
      console.log(`Added ${res.length} post votes`);
    }
  };

  // Job board listings with varied type / remote / tags.
  const addJobs = async (users: { id: string }[]) => {
    if (users.length === 0) return;
    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;
    const jobsRaw = [
      {
        companyName: "Latent Labs",
        jobTitle: "Founding AI Engineer",
        jobLocation: "Remote (EU)",
        type: "full-time" as const,
        remote: true,
        aiNative: true,
        tags: ["AI", "Agents", "TypeScript"],
        jobDescription:
          "Build and ship LLM-powered features end to end. You'll own evals, retrieval and the agent loop.",
      },
      {
        companyName: "Harbor",
        jobTitle: "Senior Frontend Engineer",
        jobLocation: "Dublin, Ireland",
        type: "full-time" as const,
        remote: false,
        aiNative: false,
        tags: ["React", "TypeScript", "Frontend"],
        jobDescription:
          "Craft delightful product UI for a fast-growing SaaS. Strong React + design sense required.",
      },
      {
        companyName: "RAGtime",
        jobTitle: "ML Engineer (Contract)",
        jobLocation: "Remote (Global)",
        type: "freelancer" as const,
        remote: true,
        aiNative: true,
        tags: ["RAG", "Python", "AI"],
        jobDescription:
          "3-month contract to harden our retrieval pipeline. Chunking, reranking and eval experience a must.",
      },
      {
        companyName: "Indie Collective",
        jobTitle: "Part-time DevRel",
        jobLocation: "Remote",
        type: "part-time" as const,
        remote: true,
        aiNative: false,
        tags: ["Career", "Community"],
        jobDescription:
          "Help a small indie team grow its developer community. Writing + Discord wrangling.",
      },
      {
        companyName: "Vector & Co",
        jobTitle: "Backend Engineer, Inference",
        jobLocation: "Berlin, Germany",
        type: "full-time" as const,
        remote: false,
        aiNative: true,
        tags: ["Backend", "LLM apps", "Python"],
        jobDescription:
          "Own the inference gateway: latency, cost, and reliability at scale.",
      },
      {
        companyName: "Sidequest",
        jobTitle: "Generalist (Founding)",
        jobLocation: "Remote (Americas)",
        type: "other" as const,
        remote: true,
        aiNative: true,
        tags: ["Startups", "Indie hacking", "AI"],
        jobDescription:
          "Do a bit of everything at a pre-seed startup. Comfort with ambiguity essential.",
      },
    ];

    const jobRows = jobsRaw.map((j, i) => {
      const shortId = generateShortId();
      const publishedAt = new Date(now - (i + 1) * day).toISOString();
      return {
        ...j,
        userId: users[i % Math.min(coreUsers.length, users.length)].id,
        slug: slugify(`${j.companyName} ${j.jobTitle}`, shortId),
        applicationUrl: `https://example.com/jobs/apply/${shortId}`,
        status: "active" as const,
        publishedAt,
        approvedAt: publishedAt,
        expiresAt: new Date(now + 30 * day).toISOString(),
        priceCents: 9900,
      };
    });

    const res = await db
      .insert(job)
      .values(jobRows)
      .onConflictDoNothing()
      .returning();
    console.log(`Added ${res.length} jobs`);
  };

  // Engagement: badges (idempotent), point events, streaks, and a few awards
  // so profiles show achievements.
  const addEngagement = async (users: { id: string }[]) => {
    if (users.length === 0) return;

    const BADGES = [
      {
        key: "first_post",
        name: "First Post",
        description: "Published your first post on Codú.",
        emoji: "🚀",
      },
      {
        key: "streak_7",
        name: "Week Warrior",
        description: "Kept a 7-day activity streak.",
        emoji: "🔥",
      },
      {
        key: "streak_30",
        name: "Regular",
        description: "Kept a 30-day activity streak.",
        emoji: "⚡",
      },
      {
        key: "points_100",
        name: "Contributor",
        description: "Earned 100 points.",
        emoji: "✨",
      },
      {
        key: "points_500",
        name: "Builder",
        description: "Earned 500 points.",
        emoji: "🏆",
      },
      {
        key: "connector",
        name: "Connector",
        description: "Invited a new builder to the community.",
        emoji: "🤝",
      },
    ];

    const badgeRows = await db
      .insert(badge)
      .values(BADGES)
      .onConflictDoNothing()
      .returning({ id: badge.id, key: badge.key });
    // onConflictDoNothing may return nothing on re-run; re-select to be safe.
    const allBadges =
      badgeRows.length > 0
        ? badgeRows
        : await db.select({ id: badge.id, key: badge.key }).from(badge);
    const badgeByKey = new Map(allBadges.map((b) => [b.key, b.id]));
    console.log(`Ensured ${allBadges.length} badges`);

    const coreCount = Math.min(coreUsers.length, users.length);
    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;

    const pointRows: {
      userId: string;
      action:
        | "post_published"
        | "comment_created"
        | "upvote_received"
        | "daily_active"
        | "shipped"
        | "referral";
      points: number;
      sourceType?: string;
      sourceId?: string;
      createdAt: string;
    }[] = [];
    const streakRows: {
      userId: string;
      currentStreak: number;
      longestStreak: number;
      lastActiveOn: string;
    }[] = [];
    const badgeAwards: { userId: string; badgeId: number }[] = [];

    for (let i = 0; i < coreCount; i++) {
      const userId = users[i].id;
      // A spread of point events over the last ~30 days. Use a unique sourceId
      // per event to satisfy the dedupe unique index.
      const numEvents = chance.integer({ min: 3, max: 8 });
      let total = 0;
      for (let e = 0; e < numEvents; e++) {
        const action = chance.pickone([
          "post_published",
          "comment_created",
          "upvote_received",
          "daily_active",
          "shipped",
        ] as const);
        const points = chance.integer({ min: 5, max: 40 });
        total += points;
        pointRows.push({
          userId,
          action,
          points,
          sourceType: "seed",
          sourceId: `${userId}-${e}-${generateShortId()}`,
          createdAt: new Date(
            now - chance.integer({ min: 0, max: 30 }) * day,
          ).toISOString(),
        });
      }

      const longest = chance.integer({ min: 3, max: 21 });
      streakRows.push({
        userId,
        currentStreak: chance.integer({ min: 1, max: longest }),
        longestStreak: longest,
        lastActiveOn: new Date(now).toISOString(),
      });

      // Award badges consistent with the (rough) earned state.
      const award = (key: string) => {
        const id = badgeByKey.get(key);
        if (id) badgeAwards.push({ userId, badgeId: id });
      };
      award("first_post"); // core users all have posts
      if (total >= 100) award("points_100");
      if (longest >= 7) award("streak_7");
      if (i % 3 === 0) award("connector");
    }

    if (pointRows.length > 0) {
      await db.insert(point_event).values(pointRows).onConflictDoNothing();
      console.log(`Added ${pointRows.length} point events`);
    }
    if (streakRows.length > 0) {
      await db.insert(user_streak).values(streakRows).onConflictDoNothing();
      console.log(`Added ${streakRows.length} user streaks`);
    }
    if (badgeAwards.length > 0) {
      const res = await db
        .insert(user_badge)
        .values(badgeAwards)
        .onConflictDoNothing()
        .returning();
      console.log(`Awarded ${res.length} badges`);
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

        // Social graph, engagement signals and supporting data for relaunch.
        await addFollows(userData.users);
        await addBookmarksAndVotes(userData.users, publishedPosts);
        await addJobs(userData.users);
        await addEngagement(userData.users);
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
