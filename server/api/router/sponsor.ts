import {
  SponsorInquirySchema,
  sponsorInterestLabels,
  sponsorBudgetLabels,
} from "@/schema/sponsor";
import * as Sentry from "@sentry/nextjs";
import sendEmail from "@/utils/sendEmail";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { createSponsorInquiryEmailTemplate } from "@/utils/createSponsorInquiryEmailTemplate";
import { sponsor_inquiry } from "@/server/db/schema";
import { db } from "@/server/db";
import { rateLimit, clientIpFromHeaders } from "@/server/lib/rateLimit";

export const sponsorRouter = createTRPCRouter({
  submit: publicProcedure
    .input(SponsorInquirySchema)
    .mutation(async ({ input, ctx }) => {
      // Public, unauthenticated endpoint that writes a row + sends an email, so
      // throttle by IP to stop scripted flooding. 3 inquiries / hour per IP.
      const ip = clientIpFromHeaders(ctx.headers);
      const { success } = rateLimit(`sponsor:${ip}`, 3, 60 * 60_000);
      if (!success) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "Too many inquiries. Please email partnerships@codu.co.",
        });
      }

      try {
        const { name, email, company, phone, interests, budgetRange, goals } =
          input;
        const now = new Date();

        // Convert interests array to comma-separated string for storage
        const interestsString = interests.join(",");

        // Save to database
        const [inquiry] = await db
          .insert(sponsor_inquiry)
          .values({
            name,
            email,
            company,
            phone: phone ?? null,
            interests: interestsString,
            budgetRange,
            goals: goals ?? null,
            status: "PENDING",
            createdAt: now.toISOString(),
          })
          .returning();

        // Send email notification
        const adminEmail = process.env.ADMIN_EMAIL || "partnerships@codu.co";

        // Convert interests to readable labels
        const interestLabels = interests.map(
          (interest) => sponsorInterestLabels[interest],
        );

        const htmlMessage = createSponsorInquiryEmailTemplate({
          name,
          email,
          company,
          phone,
          interests: interestLabels,
          budgetRange: sponsorBudgetLabels[budgetRange],
          goals,
          submittedAt: now.toLocaleString("en-IE", {
            dateStyle: "medium",
            timeStyle: "short",
          }),
        });

        await sendEmail({
          recipient: adminEmail,
          htmlMessage,
          subject: `New Sponsor Inquiry from ${company || name}`,
        });

        return {
          success: true,
          id: inquiry.id,
          message: "Thank you for your interest! We'll be in touch soon.",
        };
      } catch (error) {
        Sentry.captureException(error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            "Failed to submit inquiry. Please try again or email us directly at partnerships@codu.co",
        });
      }
    }),
});
