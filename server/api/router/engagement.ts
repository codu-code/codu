import { z } from "zod";
import { nanoid } from "nanoid";
import { and, desc, eq, gt, sql } from "drizzle-orm";
import { createTRPCRouter, publicProcedure, protectedProcedure } from "../trpc";
import { point_event, user, badge, follow, posts } from "@/server/db/schema";
import { getStreak, getUserBadges } from "@/server/lib/engagement";

export const engagementRouter = createTRPCRouter({
  // "Get your first win in 3 steps" — real completion state for the feed banner:
  // picked topics, followed 3 builders, published a first post.
  onboardingWins: protectedProcedure.query(async ({ ctx }) => {
    const uid = ctx.session.user.id;
    const [u] = await ctx.db
      .select({ topics: user.topics })
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
    const followCount = Number(followRow?.c ?? 0);
    const postCount = Number(postRow?.c ?? 0);
    return {
      pickedTopics: (u?.topics?.length ?? 0) > 0,
      followedThree: followCount >= 3,
      posted: postCount > 0,
      followCount,
    };
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

  // Build Board — ranked builders by points over a window.
  leaderboard: publicProcedure
    .input(
      z.object({
        window: z.enum(["week", "all"]).default("week"),
        limit: z.number().min(1).max(50).nullish(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const limit = input.limit ?? 10;
      const where =
        input.window === "week"
          ? gt(
              point_event.createdAt,
              new Date(Date.now() - 7 * 86_400_000).toISOString(),
            )
          : undefined;

      const rows = await ctx.db
        .select({
          userId: point_event.userId,
          name: user.name,
          username: user.username,
          image: user.image,
          points: sql<number>`sum(${point_event.points})`,
        })
        .from(point_event)
        .innerJoin(user, eq(point_event.userId, user.id))
        .where(where ? and(where) : undefined)
        .groupBy(point_event.userId, user.name, user.username, user.image)
        .orderBy(desc(sql`sum(${point_event.points})`))
        .limit(limit);

      return rows.map((r) => ({ ...r, points: Number(r.points) }));
    }),
});
