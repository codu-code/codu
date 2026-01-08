import { feed_sources, user } from "../server/db/schema";
import { nanoid } from "nanoid";
import { eq } from "drizzle-orm";
import "dotenv/config";
import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const DATABASE_URL = process.env.DATABASE_URL || "";

if (!DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

const client = postgres(DATABASE_URL, { max: 1 });
const db: PostgresJsDatabase = drizzle(client);

// Generate slug from name
const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
};

// RSS feed sources for content aggregator
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

async function seedFeedSources() {
  console.log(
    `Seeding ${feedSourcesRaw.length} feed sources with bot users...`,
  );

  let usersCreated = 0;
  let sourcesCreated = 0;
  let sourcesUpdated = 0;

  for (const source of feedSourcesRaw) {
    const slug = generateSlug(source.name);
    const username = slug.substring(0, 40); // Max 40 chars for username

    // Check if user already exists
    const existingUser = await db
      .select({ id: user.id })
      .from(user)
      .where(eq(user.username, username))
      .limit(1);

    let userId: string;

    if (existingUser.length > 0) {
      // Use existing user
      userId = existingUser[0].id;
    } else {
      // Create new bot user for this source
      const newUserId = `feed_${slug}_${nanoid(8)}`;
      const [newUser] = await db
        .insert(user)
        .values({
          id: newUserId,
          username: username,
          name: source.name,
          websiteUrl: source.websiteUrl || "",
          bio: source.description || "",
          image: "/images/person.png",
        })
        .returning({ id: user.id });

      userId = newUser.id;
      usersCreated++;
      console.log(`Created bot user: ${username}`);
    }

    // Check if source already exists
    const existingSource = await db
      .select({ id: feed_sources.id, userId: feed_sources.userId })
      .from(feed_sources)
      .where(eq(feed_sources.url, source.url))
      .limit(1);

    if (existingSource.length > 0) {
      // Update existing source with user_id if not set
      if (!existingSource[0].userId) {
        await db
          .update(feed_sources)
          .set({ userId: userId })
          .where(eq(feed_sources.id, existingSource[0].id));
        sourcesUpdated++;
        console.log(`Updated source with user_id: ${source.name}`);
      }
    } else {
      // Insert new source
      await db.insert(feed_sources).values({
        name: source.name,
        url: source.url,
        websiteUrl: source.websiteUrl,
        category: source.category,
        description: source.description,
        slug: slug,
        userId: userId,
      });
      sourcesCreated++;
      console.log(`Created source: ${source.name}`);
    }
  }

  console.log("\n=== Summary ===");
  console.log(`Bot users created: ${usersCreated}`);
  console.log(`Feed sources created: ${sourcesCreated}`);
  console.log(`Feed sources updated with user_id: ${sourcesUpdated}`);
  console.log(`Total sources processed: ${feedSourcesRaw.length}`);

  await client.end();
  process.exit(0);
}

seedFeedSources().catch((error) => {
  console.error("Error seeding feed sources:", error);
  client.end();
  process.exit(1);
});
