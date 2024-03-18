import { ReportSchema } from "@/schema/report";
import * as Sentry from "@sentry/nextjs";
import sendEmail from "@/utils/sendEmail";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { createCommentReportEmailTemplate } from "@/utils/createCommentReportEmailTemplate";
import { createArticleReportEmailTemplate } from "@/utils/createArticleReportEmailTemplate";
import { comment, post, user } from "@/server/db/schema";
import { eq } from "drizzle-orm";

export const reportRouter = createTRPCRouter({
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
              post: { slug: post.slug },
              user: {
                email: user.email,
                userId: user.id,
                username: user.username,
              },
            })
            .from(comment)
            .innerJoin(user, eq(user.id, comment.userId))
            .innerJoin(post, eq(comment.postId, post.id))
            .where(eq(comment.id, id));

          const report = {
            reason: body,
            url: `${getBaseUrl()}/articles/${commentDetails.post.slug}`,
            id,
            email: commentDetails.user.email || "",
            comment: commentDetails.body || "",
            userId: commentDetails.user.userId || "",
            username: commentDetails.user.username || "",
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
            url: `${getBaseUrl()}/articles/${postDetails.slug}`,
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
});
