import { drizzle } from "drizzle-orm/postgres-js";
import { type Logger } from "drizzle-orm/logger";

import postgres from "postgres";

import { env } from "@/config/env";
import * as schema from "@/server/db/schema";

/**
 * Cache the database connection in development. This avoids creating a new connection on every HMR
 * update.
 */
const globalForDb = globalThis as unknown as {
  connection: postgres.Sql | undefined;
};

// drizzles default is ugly
const drizzlelogger: Logger = {
  logQuery(query: string, params: unknown[]): void {
    console.log("\x1b[32m%s\x1b[0m", "drizzle:query", query, params.join(",")); //cyan
  },
};

const connection =
  globalForDb.connection ??
  postgres(env.DATABASE_URL, {
    max: 100,
    idle_timeout: 20,
  });

if (env.NODE_ENV !== "production") globalForDb.connection = connection;

// log in dev but not in any other environment
// currently doesnt look like drizzle supports logging levels so its 0 or 100 which we dont want in Prod
export const db = drizzle(connection, {
  schema,
  logger: env.NODE_ENV === "development" ? drizzlelogger : false,
});
