import { ReportSchema } from "@/schema/report";
import * as Sentry from "@sentry/nextjs";
import sendEmail from "@/utils/sendEmail";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { createCommentReportEmailTemplate } from "@/utils/createCommentReportEmailTemplate";
import { createArticleReportEmailTemplate } from "@/utils/createArticleReportEmailTemplate";

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
        const user = ctx.session.user;

        function getBaseUrl() {
          if (typeof window !== "undefined") return "";
          const env = process.env.DOMAIN_NAME || process.env.VERCEL_URL;
          Sentry.captureMessage(`Domain - env https://${env}`);
          if (env) return "https://" + env;
          Sentry.captureMessage("It's localhost");
          return "http://localhost:3000";
        }

        if (type === "comment" && typeof id === "number") {
          const comment = await ctx.db.comment.findUniqueOrThrow({
            where: { id },
            include: {
              user: true,
              post: {
                select: {
                  slug: true,
                },
              },
            },
          });

          const report = {
            reason: body,
            url: `${getBaseUrl()}/articles/${comment.post.slug}`,
            id,
            email: comment.user.email || "",
            comment: comment.body,
            userId: comment.user.id,
            username: comment.user.username || "",
            reportedBy: {
              username: user.username,
              id: user.id,
              email: user?.email || "",
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
          const post = await ctx.db.post.findUniqueOrThrow({
            where: { id },
            include: {
              user: true,
            },
          });

          const report = {
            reason: body,
            url: `${getBaseUrl()}/articles/${post.slug}`,
            id,
            email: post.user.email || "",
            title: post.title,
            userId: post.user.id,
            username: post.user.username || "",
            reportedBy: {
              username: user.username,
              id: user.id,
              email: user?.email || "",
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
