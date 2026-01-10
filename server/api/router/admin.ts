import { TRPCError } from "@trpc/server";
import { BanUserSchema, UnbanUserSchema } from "../../../schema/admin";
import z from "zod";

import { createTRPCRouter, adminOnlyProcedure } from "../trpc";
import {
  banned_users,
  session,
  user,
  posts,
  content_report,
  feed_sources,
} from "@/server/db/schema";
import { and, count, desc, eq, sql } from "drizzle-orm";

export const adminRouter = createTRPCRouter({
  // Get dashboard stats
  getStats: adminOnlyProcedure.query(async ({ ctx }) => {
    const [usersCount] = await ctx.db.select({ count: count() }).from(user);

    const [postsCount] = await ctx.db
      .select({ count: count() })
      .from(posts)
      .where(eq(posts.status, "published"));

    const [pendingReports] = await ctx.db
      .select({ count: count() })
      .from(content_report)
      .where(eq(content_report.status, "PENDING"));

    const [bannedUsersCount] = await ctx.db
      .select({ count: count() })
      .from(banned_users);

    const [activeSourcesCount] = await ctx.db
      .select({ count: count() })
      .from(feed_sources)
      .where(eq(feed_sources.status, "active"));

    return {
      totalUsers: usersCount.count,
      publishedPosts: postsCount.count,
      pendingReports: pendingReports.count,
      bannedUsers: bannedUsersCount.count,
      activeFeedSources: activeSourcesCount.count,
    };
  }),

  // Get users with search/filter
  getUsers: adminOnlyProcedure
    .input(
      z.object({
        search: z.string().optional(),
        limit: z.number().min(1).max(100).default(20),
        cursor: z.number().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { search, limit, cursor } = input;

      const conditions = [];

      if (search) {
        conditions.push(
          sql`(${user.username} ILIKE ${`%${search}%`} OR ${user.name} ILIKE ${`%${search}%`} OR ${user.email} ILIKE ${`%${search}%`})`,
        );
      }

      if (cursor) {
        conditions.push(sql`${user.id} > ${cursor.toString()}`);
      }

      const whereClause =
        conditions.length > 0 ? and(...conditions) : undefined;

      const users = await ctx.db.query.user.findMany({
        where: whereClause,
        columns: {
          id: true,
          username: true,
          name: true,
          email: true,
          image: true,
          role: true,
          createdAt: true,
        },
        with: {
          bannedUsers: {
            columns: {
              id: true,
              createdAt: true,
              note: true,
            },
          },
        },
        orderBy: [desc(user.createdAt)],
        limit: limit + 1,
      });

      let nextCursor: number | undefined;
      if (users.length > limit) {
        users.pop();
        nextCursor = users.length;
      }

      return {
        users: users.map((u) => ({
          ...u,
          isBanned: !!u.bannedUsers,
        })),
        nextCursor,
      };
    }),

  // Get banned users list
  getBannedUsers: adminOnlyProcedure.query(async ({ ctx }) => {
    const banned = await ctx.db.query.banned_users.findMany({
      with: {
        user: {
          columns: {
            id: true,
            username: true,
            name: true,
            email: true,
            image: true,
          },
        },
        bannedBy: {
          columns: {
            id: true,
            username: true,
            name: true,
          },
        },
      },
      orderBy: [desc(banned_users.createdAt)],
    });

    return banned;
  }),

  ban: adminOnlyProcedure
    .input(BanUserSchema)
    .mutation(async ({ input, ctx }) => {
      const { userId, note } = input;
      const currentUserId = ctx.session.user.id;

      const user = await ctx.db.query.user.findFirst({
        where: (user, { eq }) => eq(user.id, userId),
      });

      if (!user) throw new Error("User not found");

      if (user.role === "ADMIN") {
        throw new TRPCError({
          code: "FORBIDDEN",
        });
      }

      await ctx.db.insert(banned_users).values({
        bannedById: currentUserId,
        userId: userId,
        note: note,
        createdAt: new Date().toISOString(),
      });

      await ctx.db.delete(session).where(eq(session.userId, userId));

      return { banned: true };
    }),
  unban: adminOnlyProcedure
    .input(UnbanUserSchema)
    .mutation(async ({ input, ctx }) => {
      const { userId } = input;

      await ctx.db.delete(banned_users).where(eq(banned_users.userId, userId));

      return { unbanned: true };
    }),
});
