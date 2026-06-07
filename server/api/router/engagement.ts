import { z } from "zod";
import { nanoid } from "nanoid";
import { and, desc, eq, gt, sql } from "drizzle-orm";
import { createTRPCRouter, publicProcedure, protectedProcedure } from "../trpc";
import { point_event, user } from "@/server/db/schema";
import { getStreak } from "@/server/lib/engagement";

export const engagementRouter = createTRPCRouter({
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
