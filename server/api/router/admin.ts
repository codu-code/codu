import { TRPCError } from "@trpc/server";
import { BanUserSchema, UnbanUserSchema } from "../../../schema/admin";
import z from "zod";
import * as Sentry from "@sentry/nextjs";

import { createTRPCRouter, adminOnlyProcedure } from "../trpc";
import { countOpenSystemReports } from "./utils";
import {
  banned_users,
  session,
  user,
  posts,
  comments,
  content_report,
  reports,
  feed_sources,
  notification,
} from "@/server/db/schema";
import { and, count, desc, eq, isNotNull, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { runPostGoLiveSideEffects } from "@/server/lib/post-go-live";
import { POST_APPROVED } from "@/utils/notifications";
import {
  buildCommentHref,
  buildContentHref,
  buildSlug,
} from "@/server/lib/content-url";
import { groupReportedPosts, toLegacyReason } from "@/server/lib/reportedPosts";
import { mintUrlId } from "@/server/lib/url-id";

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

    // System (auto-flagged) reports live in `reports`, not `content_report`.
    const pendingSystemReports = await countOpenSystemReports(ctx.db);

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
      pendingReports: pendingReports.count + pendingSystemReports,
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
  // `excerpt` gives a moderator a first impression in the queue itself; the
  // full read happens on the preview page, which loads the post by id.
  listInReview: adminOnlyProcedure.query(async ({ ctx }) => {
    const rows = await ctx.db
      .select({
        id: posts.id,
        title: posts.title,
        slug: posts.slug,
        excerpt: posts.excerpt,
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

  // Live posts (status `published`) that have at least one open report, from a
  // member (`content_report`) or the nightly review cron (`reports`). These are
  // flagged-but-still-public; an admin can Hide (→ in_review) or Dismiss the
  // report(s). The two tables' ids are returned in separate fields
  // (`reportIds` / `systemReportIds`) because their sequences overlap.
  listReportedPosts: adminOnlyProcedure.query(async ({ ctx }) => {
    // Pending member reports joined to their (live) post + author.
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

    // Pending system reports, joined the same way.
    const pendingSystemReports = await ctx.db
      .select({
        reportId: reports.id,
        reason: reports.reason,
        details: reports.details,
        reportCreatedAt: reports.createdAt,
        postId: posts.id,
        title: posts.title,
        slug: posts.slug,
        authorId: posts.authorId,
        authorUsername: user.username,
        authorName: user.name,
      })
      .from(reports)
      .innerJoin(posts, eq(reports.postId, posts.id))
      .leftJoin(user, eq(posts.authorId, user.id))
      .where(
        and(
          eq(reports.status, "pending"),
          eq(reports.source, "system"),
          eq(posts.status, "published"),
        ),
      )
      .orderBy(desc(reports.createdAt))
      .limit(200);

    return groupReportedPosts(pendingReports, pendingSystemReports);
  }),

  // Comments the nightly review cron has flagged (pending system reports in
  // `reports`). Soft-deleted comments stay listed so their report can still be
  // dismissed. `reportId` is a `reports` id — see report.dismissSystem.
  listFlaggedComments: adminOnlyProcedure.query(async ({ ctx }) => {
    // The comment's author and its parent post's author are both users; the
    // latter drives member hrefs.
    const postAuthor = alias(user, "post_author");

    const rows = await ctx.db
      .select({
        reportId: reports.id,
        reason: reports.reason,
        details: reports.details,
        reportCreatedAt: reports.createdAt,
        commentId: comments.id,
        body: comments.body,
        deletedAt: comments.deletedAt,
        authorUsername: user.username,
        parentTitle: posts.title,
        parentType: posts.type,
        parentSlug: posts.slug,
        sourceSlug: feed_sources.slug,
        postAuthorUsername: postAuthor.username,
      })
      .from(reports)
      .innerJoin(comments, eq(reports.commentId, comments.id))
      .innerJoin(posts, eq(comments.postId, posts.id))
      .leftJoin(user, eq(comments.authorId, user.id))
      .leftJoin(feed_sources, eq(posts.sourceId, feed_sources.id))
      .leftJoin(postAuthor, eq(posts.authorId, postAuthor.id))
      .where(and(eq(reports.status, "pending"), eq(reports.source, "system")))
      .orderBy(desc(reports.createdAt))
      .limit(200);

    return rows.map((row) => {
      const parent = {
        sourceSlug: row.sourceSlug,
        authorUsername: row.postAuthorUsername,
      };
      // No public URL for the parent (a member post whose author has no
      // username) means no link, rather than a broken one.
      const hasPublicUrl =
        buildContentHref({
          type: row.parentType,
          slug: row.parentSlug,
          ...parent,
        }) !== null;

      return {
        reportId: row.reportId,
        reason: toLegacyReason(row.reason),
        details: row.details,
        reportedAt: row.reportCreatedAt,
        commentId: row.commentId,
        body: row.body,
        isDeleted: row.deletedAt !== null,
        authorUsername: row.authorUsername,
        parentTitle: row.parentTitle,
        href: hasPublicUrl
          ? buildCommentHref({
              commentId: row.commentId,
              parentType: row.parentType,
              parentSlug: row.parentSlug,
              ...parent,
            })
          : null,
      };
    });
  }),

  // Moderate a post from the queue.
  //  - approve : in_review → published (+ points + author notification)
  //  - reject  : in_review → rejected  (+ stores moderationNote so the author
  //              later sees "Hidden by moderator" + reason)
  //  - hide    : published → in_review (a live, reported post leaves the public
  //              feed and re-enters the review queue for a human decision)
  // Nothing is ever deleted. When hiding/rejecting a post that has open
  // reports (member or system), those reports are resolved (set to actioned)
  // so they leave the flagged queue.
  moderatePost: adminOnlyProcedure
    .input(
      z.object({
        id: z.string(),
        decision: z.enum(["approve", "reject", "hide"]),
        note: z.string().max(1000).optional(),
        // Optional future release time when approving: a future value schedules
        // the post (the promote-scheduled cron goes it live); missing/past
        // publishes immediately.
        publishAt: z.string().datetime().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [existing] = await ctx.db
        .select({
          id: posts.id,
          authorId: posts.authorId,
          title: posts.title,
          slug: posts.slug,
          urlId: posts.urlId,
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

      // Resolve any open reports for a post (set to actioned) so it leaves the
      // flagged queue once a moderator hides or rejects it. Member reports and
      // system reports live in separate tables with their own status enums.
      const resolveOpenReports = async () => {
        const resolution = {
          actionTaken: "Resolved by moderator",
          reviewedById: ctx.session.user.id,
          reviewedAt: new Date().toISOString(),
        };
        await ctx.db
          .update(content_report)
          .set({ status: "ACTIONED", ...resolution })
          .where(
            and(
              eq(content_report.postId, input.id),
              eq(content_report.status, "PENDING"),
            ),
          );
        await ctx.db
          .update(reports)
          .set({ status: "actioned", ...resolution })
          .where(
            and(eq(reports.postId, input.id), eq(reports.status, "pending")),
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
            ...(input.note !== undefined ? { moderationNote: input.note } : {}),
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

      // Approving is a moderator ruling that the post is fine, so any system
      // flag still open against it is dismissed rather than resurfacing once
      // the post is live again.
      await ctx.db
        .update(reports)
        .set({
          status: "dismissed",
          actionTaken: "Post approved by moderator",
          reviewedById: ctx.session.user.id,
          reviewedAt: new Date().toISOString(),
        })
        .where(
          and(
            eq(reports.postId, input.id),
            eq(reports.source, "system"),
            eq(reports.status, "pending"),
          ),
        );

      // Ensure the post has a stable slug before approving (now) or scheduling.
      // The slug's trailing token must be the post's urlId (parseUrlId
      // contract), so mint one if the row predates the urlId column.
      const slugUrlId = existing.urlId ?? mintUrlId();
      const urlIdPatch = existing.urlId ? {} : { urlId: slugUrlId };
      const slug =
        existing.slug ||
        (existing.title ? buildSlug(existing.title, slugUrlId) : existing.slug);

      // Approve & schedule: a FUTURE publishAt parks the post as `scheduled`;
      // go-live side-effects run from the cron at the real go-live, not now.
      const publishAt = input.publishAt ? new Date(input.publishAt) : null;
      if (publishAt && publishAt.getTime() > Date.now()) {
        const [scheduled] = await ctx.db
          .update(posts)
          .set({
            status: "scheduled",
            publishedAt: publishAt.toISOString(),
            slug,
            ...urlIdPatch,
          })
          .where(eq(posts.id, input.id))
          .returning();

        // Courtesy "approved + scheduled" notification (POST_APPROVED, notifier =
        // author); the go-live notification fires from the cron later.
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

        return scheduled;
      }

      // Approve → publish now, mirroring the normal publish path.
      const [approved] = await ctx.db
        .update(posts)
        .set({
          status: "published",
          publishedAt: new Date().toISOString(),
          slug,
          ...urlIdPatch,
        })
        .where(eq(posts.id, input.id))
        .returning();

      // Same go-live side-effects the cron runs (points + IndexNow + notification).
      await runPostGoLiveSideEffects(ctx.db, {
        id: existing.id,
        authorId: existing.authorId,
        type: existing.type,
        slug: approved?.slug ?? slug,
        authorUsername: existing.authorUsername,
        sourceId: existing.sourceId,
        canonicalUrl: existing.canonicalUrl,
      });

      return approved;
    }),
});
