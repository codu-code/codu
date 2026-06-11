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
import { submitToIndexNow } from "@/server/lib/indexnow";
import { POST_APPROVED } from "@/utils/notifications";

const SITE_ORIGIN = "https://www.codu.co";

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

      const whereClause =
        conditions.length > 0 ? and(...conditions) : undefined;

      // Offset-based pagination. The cursor is the row offset; keyed pagination
      // on `id` would be wrong here because the list is ordered by `createdAt`.
      const offset = cursor ?? 0;

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
        offset,
      });

      let nextCursor: number | undefined;
      if (users.length > limit) {
        users.pop();
        nextCursor = offset + limit;
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
  // `moderationNote` surfaces WHY a post was flagged (auto-mod reason, etc.).
  listInReview: adminOnlyProcedure.query(async ({ ctx }) => {
    const rows = await ctx.db
      .select({
        id: posts.id,
        title: posts.title,
        slug: posts.slug,
        authorId: posts.authorId,
        authorUsername: user.username,
        authorName: user.name,
        moderationNote: posts.moderationNote,
        createdAt: posts.createdAt,
      })
      .from(posts)
      .leftJoin(user, eq(posts.authorId, user.id))
      .where(eq(posts.status, "in_review"))
      .orderBy(desc(posts.createdAt))
      .limit(50);

    return rows;
  }),

  // Live posts (status `published`) that have at least one PENDING report.
  // These are flagged-but-still-public; an admin can Hide (→ in_review) or
  // Dismiss the report(s). Two-step query: find the flagged post ids + counts,
  // then attach the latest report reason/details and the open report ids.
  listReportedPosts: adminOnlyProcedure.query(async ({ ctx }) => {
    // Pending post reports joined to their (live) post + author.
    const pendingReports = await ctx.db
      .select({
        reportId: content_report.id,
        reason: content_report.reason,
        details: content_report.details,
        reportCreatedAt: content_report.createdAt,
        postId: posts.id,
        title: posts.title,
        slug: posts.slug,
        authorId: posts.authorId,
        authorUsername: user.username,
        authorName: user.name,
      })
      .from(content_report)
      .innerJoin(posts, eq(content_report.postId, posts.id))
      .leftJoin(user, eq(posts.authorId, user.id))
      .where(
        and(
          eq(content_report.status, "PENDING"),
          eq(posts.status, "published"),
          isNotNull(content_report.postId),
        ),
      )
      .orderBy(desc(content_report.createdAt))
      .limit(200);

    // Group by post. Rows are newest-first, so the first row seen for a post is
    // its latest report (used for the headline reason/details).
    const byPost = new Map<
      string,
      {
        id: string;
        title: string | null;
        slug: string | null;
        authorId: string;
        authorUsername: string | null;
        authorName: string | null;
        reportCount: number;
        reportIds: number[];
        latestReason: string;
        latestDetails: string | null;
        latestReportAt: string | null;
      }
    >();

    for (const row of pendingReports) {
      const existing = byPost.get(row.postId);
      if (existing) {
        existing.reportCount += 1;
        existing.reportIds.push(row.reportId);
      } else {
        byPost.set(row.postId, {
          id: row.postId,
          title: row.title,
          slug: row.slug,
          authorId: row.authorId,
          authorUsername: row.authorUsername,
          authorName: row.authorName,
          reportCount: 1,
          reportIds: [row.reportId],
          latestReason: row.reason,
          latestDetails: row.details,
          latestReportAt: row.reportCreatedAt,
        });
      }
    }

    return Array.from(byPost.values());
  }),

  // Moderate a post from the queue.
  //  - approve : in_review → published (+ points + author notification)
  //  - reject  : in_review → rejected  (+ stores moderationNote so the author
  //              later sees "Hidden by moderator" + reason)
  //  - hide    : published → in_review (a live, reported post leaves the public
  //              feed and re-enters the review queue for a human decision)
  // Nothing is ever deleted. When hiding/rejecting a post that has open
  // reports, those reports are resolved (set to ACTIONED) so they leave the
  // flagged queue.
  moderatePost: adminOnlyProcedure
    .input(
      z.object({
        id: z.string(),
        decision: z.enum(["approve", "reject", "hide"]),
        note: z.string().max(1000).optional(),
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
          type: posts.type,
          sourceId: posts.sourceId,
          canonicalUrl: posts.canonicalUrl,
          authorUsername: user.username,
        })
        .from(posts)
        .leftJoin(user, eq(posts.authorId, user.id))
        .where(eq(posts.id, input.id))
        .limit(1);

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Post not found" });
      }

      // Guards: approve/reject only act on posts awaiting review; hide only acts
      // on currently-live (published) posts. This keeps actions scoped to the
      // correct lifecycle state and prevents acting on arbitrary statuses.
      if (input.decision === "hide") {
        if (existing.status !== "published") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Only a published post can be hidden",
          });
        }
      } else if (existing.status !== "in_review") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Post is not in review",
        });
      }

      // Resolve any open reports for a post (set to ACTIONED) so it leaves the
      // flagged queue once a moderator hides or rejects it.
      const resolveOpenReports = async () => {
        await ctx.db
          .update(content_report)
          .set({
            status: "ACTIONED",
            actionTaken: "Resolved by moderator",
            reviewedById: ctx.session.user.id,
            reviewedAt: new Date().toISOString(),
          })
          .where(
            and(
              eq(content_report.postId, input.id),
              eq(content_report.status, "PENDING"),
            ),
          );
      };

      if (input.decision === "hide") {
        // Move the live post into review and resolve its open reports.
        const [hidden] = await ctx.db
          .update(posts)
          .set({
            status: "in_review",
            // Carry the moderator's note (if any) into the review queue so the
            // reason a live post was pulled is visible to the next reviewer.
            ...(input.note !== undefined
              ? { moderationNote: input.note }
              : {}),
          })
          .where(eq(posts.id, input.id))
          .returning();
        await resolveOpenReports();
        return hidden;
      }

      if (input.decision === "reject") {
        const [rejected] = await ctx.db
          .update(posts)
          .set({
            status: "rejected",
            // Store the moderator's reason so the author can later see
            // "Hidden by moderator" + this note.
            moderationNote: input.note ?? null,
          })
          .where(eq(posts.id, input.id))
          .returning();
        // A rejected post may also have open reports (if it was hidden first);
        // resolve them so they don't linger in the flagged queue.
        await resolveOpenReports();
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

      // Ping IndexNow now the post is live — same scheme as the sitemap.
      // Fire-and-forget, production-guarded inside the lib. Source-imported and
      // cross-posted rows are skipped (this path only approves member content).
      if (!existing.sourceId && !existing.canonicalUrl) {
        const slug = approved?.slug ?? existing.slug;
        const url =
          existing.type === "discussion" || existing.type === "question"
            ? `${SITE_ORIGIN}/d/${slug}`
            : existing.authorUsername
              ? `${SITE_ORIGIN}/${existing.authorUsername}/${slug}`
              : null;
        if (url) void submitToIndexNow(url);
      }

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
