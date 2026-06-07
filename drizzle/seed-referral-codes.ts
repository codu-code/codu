import { user } from "../server/db/schema";
import { isNull, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import "dotenv/config";
import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const DATABASE_URL = process.env.DATABASE_URL || "";
if (!DATABASE_URL) throw new Error("DATABASE_URL is not set");

const client = postgres(DATABASE_URL, { max: 1 });
const db: PostgresJsDatabase = drizzle(client);

async function backfill() {
  const rows = await db
    .select({ id: user.id })
    .from(user)
    .where(isNull(user.referralCode));
  console.log(`Users without a referral code: ${rows.length}`);
  let done = 0;
  for (const r of rows) {
    try {
      await db
        .update(user)
        .set({ referralCode: nanoid(8) })
        .where(eq(user.id, r.id));
      done++;
    } catch {
      // unique collision (astronomically unlikely) — retry once
      await db
        .update(user)
        .set({ referralCode: nanoid(10) })
        .where(eq(user.id, r.id));
      done++;
    }
  }
  console.log(`Backfilled ${done} referral codes.`);
  await client.end();
  process.exit(0);
}

backfill().catch((e) => {
  console.error("Error backfilling referral codes:", e);
  client.end();
  process.exit(1);
});
