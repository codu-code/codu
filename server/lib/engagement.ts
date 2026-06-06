import { eq } from "drizzle-orm";
import * as Sentry from "@sentry/nextjs";
import { db } from "@/server/db";
import { point_event, user_streak } from "@/server/db/schema";

type PointAction =
  | "post_published"
  | "comment_created"
  | "upvote_received"
  | "daily_active"
  | "shipped";

export const POINTS: Record<PointAction, number> = {
  post_published: 20,
  comment_created: 3,
  upvote_received: 2,
  daily_active: 1,
  shipped: 25,
};

interface AwardInput {
  userId: string;
  action: PointAction;
  points?: number;
  sourceType?: string;
  sourceId?: string;
  actorId?: string;
}

/**
 * Append a points event. Never throws — engagement must never break a core
 * action (posting, commenting, voting). Dedupe for the (user, action, source,
 * actor) tuple is enforced by a unique index where all four are present
 * (e.g. upvotes from distinct users).
 */
export async function award(input: AwardInput): Promise<void> {
  try {
    if (!input.userId) return;
    await db
      .insert(point_event)
      .values({
        userId: input.userId,
        action: input.action,
        points: input.points ?? POINTS[input.action],
        sourceType: input.sourceType ?? null,
        sourceId: input.sourceId ?? null,
        actorId: input.actorId ?? null,
      })
      .onConflictDoNothing();
  } catch (error) {
    Sentry.captureException(error);
  }
}

const dayKey = (d: Date) => d.toISOString().slice(0, 10);

/**
 * Record a day of activity and roll the streak forward. Idempotent per day.
 * Also awards a small daily-active point. Never throws.
 */
export async function recordDailyActivity(userId: string): Promise<void> {
  try {
    if (!userId) return;
    const now = new Date();
    const today = dayKey(now);

    const [existing] = await db
      .select()
      .from(user_streak)
      .where(eq(user_streak.userId, userId))
      .limit(1);

    if (!existing) {
      await db.insert(user_streak).values({
        userId,
        currentStreak: 1,
        longestStreak: 1,
        lastActiveOn: now.toISOString(),
      });
      await award({ userId, action: "daily_active", sourceId: today });
      return;
    }

    const last = existing.lastActiveOn
      ? existing.lastActiveOn.slice(0, 10)
      : null;
    if (last === today) return; // already counted today

    const yesterday = dayKey(new Date(now.getTime() - 86400000));
    const current = last === yesterday ? existing.currentStreak + 1 : 1;
    const longest = Math.max(existing.longestStreak, current);

    await db
      .update(user_streak)
      .set({
        currentStreak: current,
        longestStreak: longest,
        lastActiveOn: now.toISOString(),
      })
      .where(eq(user_streak.userId, userId));

    await award({ userId, action: "daily_active", sourceId: today });
  } catch (error) {
    Sentry.captureException(error);
  }
}

export async function getStreak(userId: string) {
  const [row] = await db
    .select()
    .from(user_streak)
    .where(eq(user_streak.userId, userId))
    .limit(1);
  return row ?? null;
}
