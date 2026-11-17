// Every feed source is linked to a user profile that authors its aggregated
// posts; a source without one cannot be ingested.
import crypto from "crypto";
import { eq } from "drizzle-orm";

import type { db as Database } from "@/server/db";
import { feed_sources, user } from "@/server/db/schema";

type SourceProfile = Pick<
  typeof feed_sources.$inferSelect,
  "id" | "name" | "slug" | "logoUrl" | "websiteUrl" | "description"
>;

const USERNAME_MAX_LENGTH = 40;

/** Username of a source's profile, derived from its slug (or name). */
export function buildSourceUsername(
  source: Pick<SourceProfile, "name" | "slug">,
): string {
  const base =
    source.slug || source.name.toLowerCase().replace(/[^a-z0-9]/g, "-");
  return `source-${base}`.substring(0, USERNAME_MAX_LENGTH);
}

/** Create the user profile for a feed source and link it. Returns the user id. */
export async function createSourceUser(
  db: Pick<typeof Database, "insert" | "update">,
  source: SourceProfile,
): Promise<string> {
  const userId = crypto.randomUUID();

  await db.insert(user).values({
    id: userId,
    username: buildSourceUsername(source),
    name: source.name,
    // Never used to sign in; it only has to be unique.
    email: `source-${source.id}@feeds.codu.co`,
    image: source.logoUrl || "/images/person.png",
    bio: source.description?.substring(0, 200) || `Content from ${source.name}`,
    websiteUrl: source.websiteUrl || "",
    emailNotifications: false,
    newsletter: false,
  });

  await db
    .update(feed_sources)
    .set({ userId })
    .where(eq(feed_sources.id, source.id));

  return userId;
}
