import { type Config } from "drizzle-kit";

import { env } from "@/config/env";

export default {
  schema: "./server/db/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: env.DATABASE_URL,
  },
  out: "./drizzle",
  verbose: true,
  strict: true,
} satisfies Config;
