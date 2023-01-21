import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

const { DATABASE_URL, DB_USERNAME, DB_HOST, DB_PORT, DB_PASSWORD, DB_NAME } =
  process.env;

const url =
  DATABASE_URL ||
  `postgres://${DB_USERNAME}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}`;

if (!url && !DB_USERNAME) {
  throw new Error("'DB_USERNAME' is required.");
}

if (!url && !DB_NAME) {
  throw new Error("'DB_NAME' is required.");
}

if (!url && !DB_HOST) {
  throw new Error("'DB_HOST' is required.");
}
if (!url && !DB_PORT) {
  throw new Error("'DB_PORT' is required.");
}
if (!url && !DB_PASSWORD) {
  throw new Error("'DB_PASSWORD' is required.");
}

export default global.prisma ||
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
    datasources: {
      db: {
        url: `postgres://${DB_USERNAME}:${DB_PASSWORD}@${DB_HOST}/${DB_NAME}`,
      },
    },
  });
