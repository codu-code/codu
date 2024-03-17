import { type Config } from "drizzle-kit";

import { env } from "@/config/env";

export default {
  schema: "./server/db/schema.ts",
  driver: "pg",
  dbCredentials: {
    connectionString: env.DATABASE_URL,
  },
  out: "./drizzle",
  verbose: true,
  strict: true,
} satisfies Config;
