import { z } from "zod";
import { and, desc, eq, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "../trpc";
import { follow, notification, user } from "@/server/db/schema";
import { NEW_FOLLOWER } from "@/utils/notifications";
import * as Sentry from "@sentry/nextjs";

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
      const inserted = await ctx.db
        .insert(follow)
        .values({
          followerId: ctx.session.user.id,
          followingId: input.userId,
        })
        .onConflictDoNothing()
        .returning({ id: follow.id });

      // Notify the followed user (only on a genuinely new follow).
      if (inserted.length > 0) {
        try {
          await ctx.db.insert(notification).values({
            type: NEW_FOLLOWER,
            userId: input.userId,
            notifierId: ctx.session.user.id,
          });
        } catch (error) {
          Sentry.captureException(error);
        }
      }
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

  // Users who follow `userId`
  getFollowers: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db
        .select({
          id: user.id,
          name: user.name,
          username: user.username,
          image: user.image,
          bio: user.bio,
        })
        .from(follow)
        .innerJoin(user, eq(follow.followerId, user.id))
        .where(eq(follow.followingId, input.userId))
        .orderBy(desc(follow.createdAt))
        .limit(100);
    }),

  // Users `userId` follows
  getFollowing: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db
        .select({
          id: user.id,
          name: user.name,
          username: user.username,
          image: user.image,
          bio: user.bio,
        })
        .from(follow)
        .innerJoin(user, eq(follow.followingId, user.id))
        .where(eq(follow.followerId, input.userId))
        .orderBy(desc(follow.createdAt))
        .limit(100);
    }),
});
