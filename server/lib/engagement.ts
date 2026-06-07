import { and, desc, eq, inArray, sql } from "drizzle-orm";
import * as Sentry from "@sentry/nextjs";
import { db } from "@/server/db";
import { point_event, user_streak, badge, user_badge } from "@/server/db/schema";

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
    // Check for newly-earned badges (safe — never throws).
    await checkBadges(input.userId);
  } catch (error) {
    Sentry.captureException(error);
  }
}

// ── Badges ───────────────────────────────────────────────────────────────
interface BadgeStats {
  points: number;
  longestStreak: number;
  posts: number;
  referrals: number;
}

const BADGE_RULES: { key: string; test: (s: BadgeStats) => boolean }[] = [
  { key: "first_post", test: (s) => s.posts >= 1 },
  { key: "streak_7", test: (s) => s.longestStreak >= 7 },
  { key: "streak_30", test: (s) => s.longestStreak >= 30 },
  { key: "points_100", test: (s) => s.points >= 100 },
  { key: "points_500", test: (s) => s.points >= 500 },
  { key: "connector", test: (s) => s.referrals >= 1 },
];

/** Grant any newly-earned badges. Never throws. */
export async function checkBadges(userId: string): Promise<void> {
  try {
    if (!userId) return;
    const [pts] = await db
      .select({
        total: sql<number>`coalesce(sum(${point_event.points}), 0)`,
      })
      .from(point_event)
      .where(eq(point_event.userId, userId));
    const [streak] = await db
      .select({ longest: user_streak.longestStreak })
      .from(user_streak)
      .where(eq(user_streak.userId, userId))
      .limit(1);
    const [postRow] = await db
      .select({ c: sql<number>`count(*)` })
      .from(point_event)
      .where(
        and(
          eq(point_event.userId, userId),
          eq(point_event.action, "post_published"),
        ),
      );

    const stats: BadgeStats = {
      points: Number(pts?.total ?? 0),
      longestStreak: streak?.longest ?? 0,
      posts: Number(postRow?.c ?? 0),
      referrals: 0, // wired in the referral step
    };

    const earnedKeys = BADGE_RULES.filter((r) => r.test(stats)).map(
      (r) => r.key,
    );
    if (earnedKeys.length === 0) return;

    const badges = await db
      .select({ id: badge.id, key: badge.key })
      .from(badge)
      .where(inArray(badge.key, earnedKeys));

    for (const b of badges) {
      await db
        .insert(user_badge)
        .values({ userId, badgeId: b.id })
        .onConflictDoNothing();
    }
  } catch (error) {
    Sentry.captureException(error);
  }
}

export async function getUserBadges(userId: string) {
  return db
    .select({
      key: badge.key,
      name: badge.name,
      description: badge.description,
      emoji: badge.emoji,
      awardedAt: user_badge.awardedAt,
    })
    .from(user_badge)
    .innerJoin(badge, eq(user_badge.badgeId, badge.id))
    .where(eq(user_badge.userId, userId))
    .orderBy(desc(user_badge.awardedAt));
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
