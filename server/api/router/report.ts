import {
  ReportSchema,
  CreateReportSchema,
  GetReportsSchema,
  ReviewReportSchema,
} from "@/schema/report";
import * as Sentry from "@sentry/nextjs";
import sendEmail from "@/utils/sendEmail";
import {
  createTRPCRouter,
  protectedProcedure,
  adminOnlyProcedure,
} from "../trpc";
import { TRPCError } from "@trpc/server";
import { createCommentReportEmailTemplate } from "@/utils/createCommentReportEmailTemplate";
import { createArticleReportEmailTemplate } from "@/utils/createArticleReportEmailTemplate";
import {
  comment,
  post,
  posts,
  user,
  content_report,
  aggregated_article,
  feed_source,
} from "@/server/db/schema";
import { and, count, desc, eq, lt } from "drizzle-orm";
import { db } from "@/server/db";
import { getAppOrigin } from "@/server/lib/url";
import { enforceRateLimit } from "@/server/lib/rateLimit";

export const reportRouter = createTRPCRouter({
  // Legacy: Send report via email (backwards compatibility)
  send: protectedProcedure
    .input(ReportSchema)
    .mutation(async ({ input, ctx }) => {
      // Each call emails the admin inbox — throttle per reporter so a script
      // can't use this as an email-amplification endpoint.
      await enforceRateLimit({
        key: `report:${ctx.session.user.id}`,
        limit: 5,
        windowMs: 10 * 60_000,
        message: "You're reporting too fast. Try again in a few minutes.",
      });
      try {
        if (!process.env.ADMIN_EMAIL) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Report service misconfigured",
          });
        }

        const { type, id, body } = input;
        const reportingUser = ctx.session.user;

        if (type === "comment" && typeof id === "number") {
          const [commentDetails] = await ctx.db
            .select({
              body: comment.body,
              postSlug: post.slug,
              postAuthorUsername: user.username,
              commentUserEmail: user.email,
              commentUserId: user.id,
              commentUserUsername: user.username,
            })
            .from(comment)
            .innerJoin(user, eq(user.id, comment.userId))
            .innerJoin(post, eq(comment.postId, post.id))
            .where(eq(comment.id, id));

          // Get post author username
          const [postAuthor] = await ctx.db
            .select({ username: user.username })
            .from(post)
            .innerJoin(user, eq(user.id, post.userId))
            .where(eq(post.slug, commentDetails.postSlug));

          const report = {
            reason: body,
            url: `${getAppOrigin()}/${postAuthor.username}/${commentDetails.postSlug}`,
            id,
            email: commentDetails.commentUserEmail || "",
            comment: commentDetails.body || "",
            userId: commentDetails.commentUserId || "",
            username: commentDetails.commentUserUsername || "",
            reportedBy: {
              username: reportingUser.username,
              id: reportingUser.id,
              email: reportingUser?.email || "",
            },
          };

          const htmlMessage = createCommentReportEmailTemplate(report);

          await sendEmail({
            recipient: process.env.ADMIN_EMAIL,
            htmlMessage,
            subject: "A user has reported a comment - codu.co",
          });
          return { message: "Report has been sent!" };
        }

        // Post flags now route through report.create (the unified
        // content_report flow), so report.send no longer handles "post". The
        // legacy branch (which queried the deprecated `post` table) was removed.

        if (type === "article" && typeof id === "string") {
          const [articleDetails] = await ctx.db
            .select({
              slug: aggregated_article.slug,
              shortId: aggregated_article.shortId,
              title: aggregated_article.title,
              url: aggregated_article.externalUrl,
              sourceSlug: feed_source.slug,
              sourceName: feed_source.name,
            })
            .from(aggregated_article)
            .leftJoin(
              feed_source,
              eq(aggregated_article.sourceId, feed_source.id),
            )
            .where(eq(aggregated_article.id, id));

          if (!articleDetails) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Article not found",
            });
          }

          // Use slug if available, fallback to shortId
          const articlePath = articleDetails.slug || articleDetails.shortId;
          const report = {
            reason: body,
            url: `${getAppOrigin()}/${articleDetails.sourceSlug}/${articlePath}`,
            id: String(id),
            email: "", // Feed articles don't have a user email
            title: articleDetails.title,
            userId: "", // Feed articles don't have a userId
            username:
              articleDetails.sourceName ||
              articleDetails.sourceSlug ||
              "Unknown Source",
            reportedBy: {
              username: reportingUser.username,
              id: reportingUser.id,
              email: reportingUser?.email || "",
            },
          };
          const htmlMessage = createArticleReportEmailTemplate(report);
          await sendEmail({
            recipient: process.env.ADMIN_EMAIL,
            htmlMessage,
            subject: "A user has reported a feed article - codu.co",
          });
          return { message: "Report has been sent!" };
        }

        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid report",
        });
      } catch (error) {
        Sentry.captureException(error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Report failed to send",
        });
      }
    }),

  // New: Create a report (stored in database)
  create: protectedProcedure
    .input(CreateReportSchema)
    .mutation(async ({ input, ctx }) => {
      const { contentId, discussionId, postId, reason, details } = input;
      const reporterId = ctx.session.user.id;

      // Same per-reporter throttle as send — reports fan out to admin
      // email/notifications and unbounded inserts are abusable.
      await enforceRateLimit({
        key: `report:${reporterId}`,
        limit: 5,
        windowMs: 10 * 60_000,
        message: "You're reporting too fast. Try again in a few minutes.",
      });

      // Validate that exactly one target is provided
      const targetCount = [contentId, discussionId, postId].filter(
        (t) => t !== undefined && t !== null,
      ).length;
      if (targetCount !== 1) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Must provide exactly one of contentId, discussionId, postId",
        });
      }

      // Validate content exists if provided
      if (contentId) {
        const contentItem = await db.query.content.findFirst({
          where: (c, { eq }) => eq(c.id, contentId),
          columns: { id: true },
        });
        if (!contentItem) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Content not found",
          });
        }
      }

      // Validate discussion exists if provided
      if (discussionId) {
        const discussionItem = await db.query.discussion.findFirst({
          where: (d, { eq }) => eq(d.id, discussionId),
          columns: { id: true },
        });
        if (!discussionItem) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Discussion not found",
          });
        }
      }

      // Validate post exists if provided
      if (postId) {
        const postItem = await db.query.posts.findFirst({
          where: (p, { eq }) => eq(p.id, postId),
          columns: { id: true },
        });
        if (!postItem) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Post not found",
          });
        }
      }

      // Check for duplicate PENDING report from same user on the same target
      const existingReport = await db.query.content_report.findFirst({
        where: (r, { eq, and }) =>
          and(
            eq(r.reporterId, reporterId),
            eq(r.status, "PENDING"),
            contentId
              ? eq(r.contentId, contentId)
              : discussionId
                ? eq(r.discussionId, discussionId)
                : eq(r.postId, postId!),
          ),
      });

      if (existingReport) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "You have already reported this item",
        });
      }

      const now = new Date().toISOString();

      const [report] = await db
        .insert(content_report)
        .values({
          contentId: contentId ?? null,
          discussionId: discussionId ?? null,
          postId: postId ?? null,
          reporterId,
          reason,
          details: details ?? null,
          status: "PENDING",
          createdAt: now,
        })
        .returning();

      // Notify the admin of a new post flag — fire-and-forget, never blocks the
      // report and never changes the post's status (a human acts on the queue).
      if (postId && process.env.ADMIN_EMAIL) {
        const adminEmail = process.env.ADMIN_EMAIL;
        void (async () => {
          try {
            const [postDetails] = await db
              .select({
                title: posts.title,
                authorEmail: user.email,
                authorId: user.id,
                authorUsername: user.username,
              })
              .from(posts)
              .innerJoin(user, eq(user.id, posts.authorId))
              .where(eq(posts.id, postId));

            const htmlMessage = createArticleReportEmailTemplate({
              reason: details || reason,
              url: `${getAppOrigin()}/admin/moderation?item=${postId}`,
              id: postId,
              email: postDetails?.authorEmail || "",
              title: postDetails?.title || "",
              userId: postDetails?.authorId || "",
              username: postDetails?.authorUsername || "",
              reportedBy: {
                username: ctx.session.user.username,
                id: ctx.session.user.id,
                email: ctx.session.user.email || "",
              },
            });

            await sendEmail({
              recipient: adminEmail,
              htmlMessage,
              subject: "A user has reported a post - codu.co",
            });
          } catch (error) {
            Sentry.captureException(error);
          }
        })();
      }

      return { id: report.id, message: "Report submitted successfully" };
    }),

  // Admin: Get all reports with filtering
  getAll: adminOnlyProcedure
    .input(GetReportsSchema)
    .query(async ({ input }) => {
      const { status, reason, limit, cursor } = input;

      const conditions = [];

      if (status) {
        conditions.push(eq(content_report.status, status));
      }

      if (reason) {
        conditions.push(eq(content_report.reason, reason));
      }

      if (cursor) {
        conditions.push(lt(content_report.id, cursor.id));
      }

      const whereClause =
        conditions.length > 0 ? and(...conditions) : undefined;

      const reports = await db.query.content_report.findMany({
        where: whereClause,
        with: {
          reporter: {
            columns: {
              id: true,
              username: true,
              name: true,
              image: true,
            },
          },
          reviewedBy: {
            columns: {
              id: true,
              username: true,
              name: true,
            },
          },
          content: {
            columns: {
              id: true,
              title: true,
              type: true,
              userId: true,
            },
            with: {
              user: {
                columns: {
                  id: true,
                  username: true,
                  name: true,
                },
              },
            },
          },
          discussion: {
            columns: {
              id: true,
              body: true,
              userId: true,
            },
            with: {
              user: {
                columns: {
                  id: true,
                  username: true,
                  name: true,
                },
              },
            },
          },
        },
        orderBy: [desc(content_report.createdAt)],
        limit: limit + 1,
      });

      let nextCursor: { id: number; createdAt?: string } | undefined;
      if (reports.length > limit) {
        const nextItem = reports.pop();
        nextCursor = {
          id: nextItem!.id,
          createdAt: nextItem!.createdAt ?? undefined,
        };
      }

      return {
        reports,
        nextCursor,
      };
    }),

  // Admin: Get report counts by status
  getCounts: adminOnlyProcedure.query(async () => {
    const [pending] = await db
      .select({ count: count() })
      .from(content_report)
      .where(eq(content_report.status, "PENDING"));

    const [reviewed] = await db
      .select({ count: count() })
      .from(content_report)
      .where(eq(content_report.status, "REVIEWED"));

    const [dismissed] = await db
      .select({ count: count() })
      .from(content_report)
      .where(eq(content_report.status, "DISMISSED"));

    const [actioned] = await db
      .select({ count: count() })
      .from(content_report)
      .where(eq(content_report.status, "ACTIONED"));

    return {
      pending: pending.count,
      reviewed: reviewed.count,
      dismissed: dismissed.count,
      actioned: actioned.count,
      total: pending.count + reviewed.count + dismissed.count + actioned.count,
    };
  }),

  // Admin: Review a report
  review: adminOnlyProcedure
    .input(ReviewReportSchema)
    .mutation(async ({ input, ctx }) => {
      const { reportId, status, actionTaken } = input;
      const reviewerId = ctx.session.user.id;

      const existingReport = await db.query.content_report.findFirst({
        where: (r, { eq }) => eq(r.id, reportId),
      });

      if (!existingReport) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Report not found",
        });
      }

      const [updatedReport] = await db
        .update(content_report)
        .set({
          status,
          actionTaken: actionTaken ?? null,
          reviewedById: reviewerId,
          reviewedAt: new Date().toISOString(),
        })
        .where(eq(content_report.id, reportId))
        .returning();

      return updatedReport;
    }),

  // Admin: Get a single report by ID
  getById: adminOnlyProcedure
    .input(ReviewReportSchema.pick({ reportId: true }))
    .query(async ({ input }) => {
      const report = await db.query.content_report.findFirst({
        where: (r, { eq }) => eq(r.id, input.reportId),
        with: {
          reporter: {
            columns: {
              id: true,
              username: true,
              name: true,
              image: true,
              email: true,
            },
          },
          reviewedBy: {
            columns: {
              id: true,
              username: true,
              name: true,
            },
          },
          content: {
            columns: {
              id: true,
              title: true,
              type: true,
              body: true,
              excerpt: true,
              externalUrl: true,
              userId: true,
              createdAt: true,
            },
            with: {
              user: {
                columns: {
                  id: true,
                  username: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
          discussion: {
            columns: {
              id: true,
              body: true,
              userId: true,
              createdAt: true,
            },
            with: {
              user: {
                columns: {
                  id: true,
                  username: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
      });

      if (!report) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Report not found",
        });
      }

      return report;
    }),
});
