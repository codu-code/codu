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
  user,
  content_report,
  content,
  discussion,
  aggregated_article,
  feed_source,
} from "@/server/db/schema";
import { and, count, desc, eq, lt } from "drizzle-orm";
import { db } from "@/server/db";

export const reportRouter = createTRPCRouter({
  // Legacy: Send report via email (backwards compatibility)
  send: protectedProcedure
    .input(ReportSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        if (!process.env.ADMIN_EMAIL) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Report service misconfigured",
          });
        }

        const { type, id, body } = input;
        const reportingUser = ctx.session.user;

        function getBaseUrl() {
          if (typeof window !== "undefined") return "";
          const env = process.env.DOMAIN_NAME || process.env.VERCEL_URL;
          if (env) return "https://" + env;
          return "http://localhost:3000";
        }

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
            url: `${getBaseUrl()}/${postAuthor.username}/${commentDetails.postSlug}`,
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

        if (type === "post" && typeof id === "string") {
          const [postDetails] = await ctx.db
            .select({
              slug: post.slug,
              title: post.title,
              user: {
                email: user.email,
                userId: user.id,
                username: user.username,
              },
            })
            .from(post)
            .innerJoin(user, eq(user.id, post.userId))
            .where(eq(post.id, id));

          const report = {
            reason: body,
            url: `${getBaseUrl()}/${postDetails.user.username}/${postDetails.slug}`,
            id,
            email: postDetails.user.email || "",
            title: postDetails.title,
            userId: postDetails.user.userId || "",
            username: postDetails.user.username || "",
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
            subject: "A user has reported an article - codu.co",
          });
          return { message: "Report has been sent!" };
        }

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
            url: `${getBaseUrl()}/${articleDetails.sourceSlug}/${articlePath}`,
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
      const { contentId, discussionId, reason, details } = input;
      const reporterId = ctx.session.user.id;

      // Validate that at least one target is provided
      if (!contentId && !discussionId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Must provide either contentId or discussionId",
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

      // Check for duplicate reports from same user
      const existingReport = await db.query.content_report.findFirst({
        where: (r, { eq, and }) =>
          and(
            eq(r.reporterId, reporterId),
            contentId
              ? eq(r.contentId, contentId)
              : eq(r.discussionId, discussionId!),
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
          reporterId,
          reason,
          details: details ?? null,
          status: "PENDING",
          createdAt: now,
        })
        .returning();

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
