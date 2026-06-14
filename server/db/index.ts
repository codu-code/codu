import { drizzle } from "drizzle-orm/postgres-js";
import { type Logger } from "drizzle-orm/logger";

import postgres from "postgres";

import { env } from "@/config/env";
import * as schemaExports from "@/server/db/schema";

// The schema barrel re-exports four tables under camelCase aliases for app-code
// ergonomics (`post_votes as postVotes`, etc.). Those alias keys point at the
// SAME table object as their snake_case originals, so handing the whole module
// namespace to drizzle puts two keys per table into its tableNamesMap. The
// collision makes drizzle attach each join table's relations to the alias key
// and leave the canonical key with none, silently breaking relational queries
// like `with: { tags }` / `with: { votes }` ("not enough information to infer
// relation posts.tags"). Strip the aliases so each table reaches drizzle once;
// app code still imports them from the schema barrel unchanged.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const { postVotes, commentVotes, postTags, feedSources, ...schema } =
  schemaExports;

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

const connection = globalForDb.connection ?? postgres(env.DATABASE_URL);

if (env.NODE_ENV !== "production") globalForDb.connection = connection;

// log in dev but not in any other environment
// currently doesnt look like drizzle supports logging levels so its 0 or 100 which we dont want in Prod
export const db = drizzle(connection, {
  schema,
  logger: env.NODE_ENV === "development" ? drizzlelogger : false,
});
