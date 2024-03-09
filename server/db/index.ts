import { drizzle } from "drizzle-orm/postgres-js";
import { Logger } from "drizzle-orm/logger";

import postgres from "postgres";

import { env } from "@/config/env";
import * as schema from "@/server/db/schema";
import { green } from "console-log-colors";

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
    console.log(green("drizzle:query"), query, params.join(","));
  },
};

const connection = globalForDb.connection ?? postgres(env.DATABASE_URL);
if (env.NODE_ENV !== "production") globalForDb.connection = connection;

// log in dev but not in any other environment
// currently doesnt look like drizzle supports logging levels so its 0 or 100 which we dont want in Prod
export const db = drizzle(connection, {
  schema,
  logger: env.NODE_ENV === "development" ? drizzlelogger : false,
});
