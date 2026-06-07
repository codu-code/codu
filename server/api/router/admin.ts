import { TRPCError } from "@trpc/server";
import { BanUserSchema, UnbanUserSchema } from "../../../schema/admin";
import z from "zod";
import crypto from "crypto";
import * as Sentry from "@sentry/nextjs";

import { createTRPCRouter, adminOnlyProcedure } from "../trpc";
import {
  banned_users,
  session,
  user,
  posts,
  content_report,
  feed_sources,
  notification,
} from "@/server/db/schema";
import { and, count, desc, eq, isNotNull, sql } from "drizzle-orm";
import { award } from "@/server/lib/engagement";
import { POST_APPROVED } from "@/utils/notifications";

// Mirror of the slug helper used by content/post publish so approved posts get
// a stable URL when none was set yet.
function generateSlug(title: string): string {
  const baseSlug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .substring(0, 80);
  const uniqueId = crypto.randomBytes(3).toString("hex");
  return `${baseSlug}-${uniqueId}`;
}

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

      // Hide all published posts by the banned user
      await ctx.db
        .update(posts)
        .set({ status: "draft" })
        .where(and(eq(posts.authorId, userId), eq(posts.status, "published")));

      return { banned: true };
    }),
  unban: adminOnlyProcedure
    .input(UnbanUserSchema)
    .mutation(async ({ input, ctx }) => {
      const { userId } = input;

      await ctx.db.delete(banned_users).where(eq(banned_users.userId, userId));

      // Restore posts that were previously published (have publishedAt set)
      await ctx.db
        .update(posts)
        .set({ status: "published" })
        .where(
          and(
            eq(posts.authorId, userId),
            eq(posts.status, "draft"),
            isNotNull(posts.publishedAt),
          ),
        );

      return { unbanned: true };
    }),

  // Auto-moderation queue: posts awaiting human review (status `in_review`).
  listInReview: adminOnlyProcedure.query(async ({ ctx }) => {
    const rows = await ctx.db
      .select({
        id: posts.id,
        title: posts.title,
        slug: posts.slug,
        authorId: posts.authorId,
        authorUsername: user.username,
        authorName: user.name,
        createdAt: posts.createdAt,
      })
      .from(posts)
      .leftJoin(user, eq(posts.authorId, user.id))
      .where(eq(posts.status, "in_review"))
      .orderBy(desc(posts.createdAt))
      .limit(50);

    return rows;
  }),

  // Approve or reject a post that is currently in review.
  moderatePost: adminOnlyProcedure
    .input(
      z.object({
        id: z.string(),
        decision: z.enum(["approve", "reject"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [existing] = await ctx.db
        .select({
          id: posts.id,
          authorId: posts.authorId,
          title: posts.title,
          slug: posts.slug,
          status: posts.status,
        })
        .from(posts)
        .where(eq(posts.id, input.id))
        .limit(1);

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Post not found" });
      }

      // Idempotent / guarded: only act on posts still awaiting review.
      if (existing.status !== "in_review") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Post is not in review",
        });
      }

      if (input.decision === "reject") {
        const [rejected] = await ctx.db
          .update(posts)
          .set({ status: "rejected" })
          .where(eq(posts.id, input.id))
          .returning();
        return rejected;
      }

      // Approve → publish now, mirroring the normal publish path.
      const [approved] = await ctx.db
        .update(posts)
        .set({
          status: "published",
          publishedAt: new Date().toISOString(),
          slug:
            existing.slug ||
            (existing.title ? generateSlug(existing.title) : existing.slug),
        })
        .where(eq(posts.id, input.id))
        .returning();

      // Award publish points, exactly as the normal publish flow does.
      await award({
        userId: existing.authorId,
        action: "post_published",
        sourceType: "post",
        sourceId: existing.id,
      });

      // Notify the author their post was approved (notifier = author, so the
      // existing notifier join in the notifications list resolves correctly).
      try {
        await ctx.db.insert(notification).values({
          type: POST_APPROVED,
          userId: existing.authorId,
          notifierId: existing.authorId,
          postId: existing.id,
        });
      } catch (error) {
        Sentry.captureException(error);
      }

      return approved;
    }),
});
