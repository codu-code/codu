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
  comments,
} from "@/server/db/schema";
import { getStreak, getUserBadges } from "@/server/lib/engagement";

export const engagementRouter = createTRPCRouter({
  // "Get your first win in 3 steps" — real completion state for the feed banner:
  // picked topics, followed 3 builders, left a first comment. The reward (the
  // onboarding_complete badge) is granted by checkBadges and celebrated through
  // the generic uncelebratedBadges flow below.
  onboardingWins: protectedProcedure.query(async ({ ctx }) => {
    const uid = ctx.session.user.id;
    const [[u], [followRow], [commentRow]] = await Promise.all([
      ctx.db
        .select({ topics: user.topics })
        .from(user)
        .where(eq(user.id, uid))
        .limit(1),
      ctx.db
        .select({ c: sql<number>`count(*)` })
        .from(follow)
        .where(eq(follow.followerId, uid)),
      ctx.db
        .select({ c: sql<number>`count(*)` })
        .from(comments)
        .where(eq(comments.authorId, uid)),
    ]);
    const followCount = Number(followRow?.c ?? 0);
    return {
      pickedTopics: (u?.topics?.length ?? 0) > 0,
      followedThree: followCount >= 3,
      commented: Number(commentRow?.c ?? 0) > 0,
      followCount,
    };
  }),

  // Badges earned but not yet celebrated in-app, oldest first — the client
  // shows the confetti dialog per badge and marks each one below.
  uncelebratedBadges: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db
      .select({
        userBadgeId: user_badge.id,
        key: badge.key,
        name: badge.name,
        emoji: badge.emoji,
        awardedAt: user_badge.awardedAt,
      })
      .from(user_badge)
      .innerJoin(badge, eq(user_badge.badgeId, badge.id))
      .where(
        and(
          eq(user_badge.userId, ctx.session.user.id),
          isNull(user_badge.celebratedAt),
        ),
      )
      .orderBy(user_badge.awardedAt);
  }),

  // Persist that a badge's celebration has been shown. Idempotent (isNull
  // guard) and owner-scoped, so a badge never re-celebrates.
  markBadgeCelebrated: protectedProcedure
    .input(z.object({ userBadgeId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .update(user_badge)
        .set({ celebratedAt: new Date().toISOString() })
        .where(
          and(
            eq(user_badge.id, input.userBadgeId),
            eq(user_badge.userId, ctx.session.user.id),
            isNull(user_badge.celebratedAt),
          ),
        );
      return { ok: true };
    }),

  // The signed-in user's streak + total points (personal, never empty-feeling).
  myStats: protectedProcedure.query(async ({ ctx }) => {
    const [streak, [pts]] = await Promise.all([
      getStreak(ctx.session.user.id),
      ctx.db
        .select({
          total: sql<number>`coalesce(sum(${point_event.points}), 0)`,
        })
        .from(point_event)
        .where(eq(point_event.userId, ctx.session.user.id)),
    ]);
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
      const [[pts], streak, earned, all] = await Promise.all([
        ctx.db
          .select({
            total: sql<number>`coalesce(sum(${point_event.points}), 0)`,
          })
          .from(point_event)
          .where(eq(point_event.userId, input.userId)),
        getStreak(input.userId),
        getUserBadges(input.userId),
        ctx.db
          .select({
            key: badge.key,
            name: badge.name,
            description: badge.description,
            emoji: badge.emoji,
          })
          .from(badge)
          .orderBy(badge.id),
      ]);
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
