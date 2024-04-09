import { sql } from "drizzle-orm";

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
  async function deleteDataFromAllTables() {
    const query = sql<string>`
    DROP SCHEMA public CASCADE;
    DROP SCHEMA drizzle CASCADE;
    CREATE SCHEMA public;
    `;

    await db.execute(query);
    console.log(`Database emptied`);
    client.end();
  }

  if (process.env.NODE_ENV !== "production") {
    await deleteDataFromAllTables();
  } else {
    console.log(
      "This script is only for development, it will delete all of your data.",
    );
  }
};

main();
