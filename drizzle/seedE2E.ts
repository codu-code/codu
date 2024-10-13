import { Chance } from "chance";
import { user, session } from "../server/db/schema";
import { eq } from "drizzle-orm";

import "dotenv/config";

import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const DATABASE_URL = process.env.DATABASE_URL || "";
const E2E_SESSION_ID = process.env.E2E_USER_SESSION_ID || "";
const E2E_USER_ID = process.env.E2E_USER_ID || "";
const E2E_USER_EMAIL = process.env.E2E_USER_EMAIL || "";

if (!DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

if (!E2E_SESSION_ID) {
  throw new Error("E2E_SESSION_ID is not set");
}

if (!E2E_USER_ID) {
  throw new Error("E2E_USER_ID is not set");
}

if (!E2E_USER_EMAIL) {
  throw new Error("E2E_USER_ID is not set");
}

const client = postgres(DATABASE_URL, { max: 1 });
const db: PostgresJsDatabase = drizzle(client);

// By passing a number we get a repeatable source of random generation.
const main = async () => {
  const chance = new Chance(1);

  const seedE2EUser = async () => {
    const name = "E2E Test User";

    const [existingE2EUser] = await db
      .selectDistinct()
      .from(user)
      .where(eq(user.id, E2E_USER_ID));

    if (existingE2EUser) {
      console.log("E2E Test user already exists. Skipping creation");
      return existingE2EUser;
    }

    const userData = {
      id: E2E_USER_ID,
      username: `${name.split(" ").join("-").toLowerCase()}-${chance.integer({
        min: 0,
        max: 999,
      })}`,
      name,
      email: process.env.E2E_USER_EMAIL,
      image: `https://robohash.org/${encodeURIComponent(name)}?bgset=bg1`,
      location: chance.country({ full: true }),
      bio: chance.sentence({ words: 10 }),
      websiteUrl: chance.url(),
    };
    const [createdUser] = await db.insert(user).values(userData).returning();
    return createdUser;
  };

  const seedE2EUserSession = async (userId: string) => {
    const [existingE2EUserSession] = await db
      .selectDistinct()
      .from(session)
      .where(eq(session.sessionToken, E2E_SESSION_ID));

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
          sessionToken: E2E_SESSION_ID,
          // Set session to expire in 6 months.
          expires: new Date(currentDate.setMonth(currentDate.getMonth() + 6)),
        })
        .returning();
    } catch (err) {
      console.log(err);
    }
  };

  const NODE_ENV = process.env.NODE_ENV;
  if (NODE_ENV !== "production") {
    const user = await seedE2EUser();
    await seedE2EUserSession(user.id);
    console.log(`Succesfully seeded DB with session`);
  } else {
    console.log(
      "This script is only for development, it will delete all of your data.",
    );
  }
};

main();
