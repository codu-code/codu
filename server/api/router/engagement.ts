import { z } from "zod";
import { nanoid } from "nanoid";
import { and, eq, isNull, sql } from "drizzle-orm";
import { createTRPCRouter, publicProcedure, protectedProcedure } from "../trpc";
import {
  point_event,
  user,
  badge,
  user_badge,
  follow,
  posts,
} from "@/server/db/schema";
import { getStreak, getUserBadges } from "@/server/lib/engagement";
import { shouldCelebrateFirstWin } from "@/server/lib/onboarding";

export const engagementRouter = createTRPCRouter({
  // "Get your first win in 3 steps" — real completion state for the feed banner:
  // picked topics, followed 3 builders, published a first post.
  onboardingWins: protectedProcedure.query(async ({ ctx }) => {
    const uid = ctx.session.user.id;
    const [u] = await ctx.db
      .select({
        topics: user.topics,
        username: user.username,
        firstWinCelebratedAt: user.firstWinCelebratedAt,
      })
      .from(user)
      .where(eq(user.id, uid))
      .limit(1);
    const [followRow] = await ctx.db
      .select({ c: sql<number>`count(*)` })
      .from(follow)
      .where(eq(follow.followerId, uid));
    const [postRow] = await ctx.db
      .select({ c: sql<number>`count(*)` })
      .from(posts)
      .where(eq(posts.authorId, uid));
    // The reward badge must be genuinely earned before we celebrate — a post
    // can exist (posted=true) yet sit in moderation review with no badge.
    const [firstBadge] = await ctx.db
      .select({ id: user_badge.id })
      .from(user_badge)
      .innerJoin(badge, eq(user_badge.badgeId, badge.id))
      .where(and(eq(user_badge.userId, uid), eq(badge.key, "first_post")))
      .limit(1);
    const followCount = Number(followRow?.c ?? 0);
    const postCount = Number(postRow?.c ?? 0);
    const wins = {
      pickedTopics: (u?.topics?.length ?? 0) > 0,
      followedThree: followCount >= 3,
      posted: postCount > 0,
    };
    return {
      ...wins,
      followCount,
      // Current username (server-truth) so the celebration's "See your badges"
      // link points at the profile even if the SSR-threaded prop is stale.
      username: u?.username ?? null,
      // Server-truth trigger for the app-wide first-win celebration: every step
      // done, the first_post badge actually earned, and not yet celebrated.
      // Drives <OnboardingCelebration> on any page.
      celebrate: shouldCelebrateFirstWin(
        wins,
        !!firstBadge,
        u?.firstWinCelebratedAt ?? null,
      ),
    };
  }),

  // Persist that the first-win celebration has been shown. Idempotent: only
  // stamps the timestamp once (guarded by isNull), so it never re-celebrates.
  markFirstWinCelebrated: protectedProcedure.mutation(async ({ ctx }) => {
    await ctx.db
      .update(user)
      .set({ firstWinCelebratedAt: new Date().toISOString() })
      .where(
        and(eq(user.id, ctx.session.user.id), isNull(user.firstWinCelebratedAt)),
      );
    return { ok: true };
  }),

  // The signed-in user's streak + total points (personal, never empty-feeling).
  myStats: protectedProcedure.query(async ({ ctx }) => {
    const streak = await getStreak(ctx.session.user.id);
    const [pts] = await ctx.db
      .select({
        total: sql<number>`coalesce(sum(${point_event.points}), 0)`,
      })
      .from(point_event)
      .where(eq(point_event.userId, ctx.session.user.id));
    return {
      currentStreak: streak?.currentStreak ?? 0,
      longestStreak: streak?.longestStreak ?? 0,
      points: Number(pts?.total ?? 0),
    };
  }),

  // Public achievements for a profile: streak, points, earned + locked badges.
  profileEngagement: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ ctx, input }) => {
      const [pts] = await ctx.db
        .select({
          total: sql<number>`coalesce(sum(${point_event.points}), 0)`,
        })
        .from(point_event)
        .where(eq(point_event.userId, input.userId));
      const streak = await getStreak(input.userId);
      const earned = await getUserBadges(input.userId);
      const all = await ctx.db
        .select({
          key: badge.key,
          name: badge.name,
          description: badge.description,
          emoji: badge.emoji,
        })
        .from(badge)
        .orderBy(badge.id);
      const earnedMap = new Map(earned.map((e) => [e.key, e.awardedAt]));
      const badges = all.map((b) => ({
        ...b,
        earned: earnedMap.has(b.key),
        awardedAt: earnedMap.get(b.key) ?? null,
      }));
      return {
        points: Number(pts?.total ?? 0),
        currentStreak: streak?.currentStreak ?? 0,
        longestStreak: streak?.longestStreak ?? 0,
        badges,
      };
    }),

  // The signed-in user's referral code + how many they've brought in.
  myReferral: protectedProcedure.query(async ({ ctx }) => {
    const uid = ctx.session.user.id;
    const [u] = await ctx.db
      .select({ code: user.referralCode })
      .from(user)
      .where(eq(user.id, uid))
      .limit(1);
    let code = u?.code ?? null;
    if (!code) {
      code = nanoid(8);
      await ctx.db
        .update(user)
        .set({ referralCode: code })
        .where(eq(user.id, uid));
    }
    const [cnt] = await ctx.db
      .select({ c: sql<number>`count(*)` })
      .from(user)
      .where(eq(user.invitedBy, uid));
    return { code, count: Number(cnt?.c ?? 0) };
  }),
});
