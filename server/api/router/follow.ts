import { z } from "zod";
import { and, eq, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "../trpc";
import { follow } from "@/server/db/schema";

export const followRouter = createTRPCRouter({
  follow: protectedProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (input.userId === ctx.session.user.id) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You can't follow yourself.",
        });
      }
      await ctx.db
        .insert(follow)
        .values({
          followerId: ctx.session.user.id,
          followingId: input.userId,
        })
        .onConflictDoNothing();
      return { following: true };
    }),

  unfollow: protectedProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(follow)
        .where(
          and(
            eq(follow.followerId, ctx.session.user.id),
            eq(follow.followingId, input.userId),
          ),
        );
      return { following: false };
    }),

  isFollowing: protectedProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ ctx, input }) => {
      const [row] = await ctx.db
        .select({ id: follow.id })
        .from(follow)
        .where(
          and(
            eq(follow.followerId, ctx.session.user.id),
            eq(follow.followingId, input.userId),
          ),
        )
        .limit(1);
      return !!row;
    }),

  counts: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ ctx, input }) => {
      const [followers] = await ctx.db
        .select({ c: sql<number>`count(*)` })
        .from(follow)
        .where(eq(follow.followingId, input.userId));
      const [following] = await ctx.db
        .select({ c: sql<number>`count(*)` })
        .from(follow)
        .where(eq(follow.followerId, input.userId));
      return {
        followers: Number(followers?.c ?? 0),
        following: Number(following?.c ?? 0),
      };
    }),
});
