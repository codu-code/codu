import { badge } from "../server/db/schema";
import "dotenv/config";
import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const DATABASE_URL = process.env.DATABASE_URL || "";
if (!DATABASE_URL) throw new Error("DATABASE_URL is not set");

const client = postgres(DATABASE_URL, { max: 1 });
const db: PostgresJsDatabase = drizzle(client);

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

async function seedBadges() {
  let created = 0;
  for (const b of BADGES) {
    const res = await db.insert(badge).values(b).onConflictDoNothing();
    // postgres-js returns count via res?.count on some drivers; just log attempt
    created++;
    console.log(`  ✓ ${b.emoji} ${b.name} (${b.key})`);
  }
  console.log(`\nSeeded/ensured ${created} badges.`);
  await client.end();
  process.exit(0);
}

seedBadges().catch((e) => {
  console.error("Error seeding badges:", e);
  client.end();
  process.exit(1);
});
