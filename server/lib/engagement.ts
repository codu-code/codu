import { and, desc, eq, gte, inArray, sql } from "drizzle-orm";
import { cookies } from "next/headers";
import { nanoid } from "nanoid";
import * as Sentry from "@sentry/nextjs";
import { db } from "@/server/db";
import {
  point_event,
  user_streak,
  badge,
  user_badge,
  user,
} from "@/server/db/schema";

type PointAction =
  | "post_published"
  | "comment_created"
  | "upvote_received"
  | "daily_active"
  | "shipped"
  | "referral";

export const POINTS: Record<PointAction, number> = {
  post_published: 20,
  comment_created: 3,
  upvote_received: 2,
  daily_active: 1,
  shipped: 25,
  referral: 30,
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

    const [refRow] = await db
      .select({ c: sql<number>`count(*)` })
      .from(user)
      .where(eq(user.invitedBy, userId));

    const stats: BadgeStats = {
      points: Number(pts?.total ?? 0),
      longestStreak: streak?.longest ?? 0,
      posts: Number(postRow?.c ?? 0),
      referrals: Number(refRow?.c ?? 0),
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

// ── Referrals ──────────────────────────────────────────────────────────────
/** Max `referral` point awards a single referrer can earn in a rolling 24h. */
const REFERRAL_DAILY_CAP = 5;

/**
 * Ensure the user has a referral code, and attribute a pending referral from the
 * `codu_ref` cookie (set on /get-started?ref=). Idempotent + never throws. Call
 * from a request-scoped server component (the app layout).
 */
export async function ensureReferral(userId: string): Promise<void> {
  try {
    if (!userId) return;
    const [u] = await db
      .select({ referralCode: user.referralCode, invitedBy: user.invitedBy })
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);
    if (!u) return;

    if (!u.referralCode) {
      await db
        .update(user)
        .set({ referralCode: nanoid(8) })
        .where(eq(user.id, userId));
    }

    if (!u.invitedBy) {
      const ref = (await cookies()).get("codu_ref")?.value;
      if (ref) {
        const [referrer] = await db
          .select({ id: user.id })
          .from(user)
          .where(eq(user.referralCode, ref))
          .limit(1);
        if (referrer && referrer.id !== userId) {
          await db
            .update(user)
            .set({ invitedBy: referrer.id })
            .where(eq(user.id, userId));

          // Per-referrer cap: count this referrer's `referral` awards in the
          // last 24h. Beyond the cap we still attribute the invite (invitedBy
          // above) but skip the points, so one person spinning up N accounts
          // each carrying the cookie can't farm unlimited points. Badges are
          // still re-checked so legitimate progress isn't lost.
          const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
          const [recent] = await db
            .select({ c: sql<number>`count(*)` })
            .from(point_event)
            .where(
              and(
                eq(point_event.userId, referrer.id),
                eq(point_event.action, "referral"),
                gte(point_event.createdAt, since),
              ),
            );

          if (Number(recent?.c ?? 0) < REFERRAL_DAILY_CAP) {
            await award({
              userId: referrer.id,
              action: "referral",
              sourceType: "user",
              sourceId: userId,
            });
          }
          await checkBadges(referrer.id);
        }
      }
    }
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
