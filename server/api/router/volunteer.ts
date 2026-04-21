import {
  VolunteerApplicationSchema,
  volunteerAreaLabels,
  volunteerCommitmentLabels,
} from "@/schema/volunteer";
import * as Sentry from "@sentry/nextjs";
import sendEmail from "@/utils/sendEmail";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { createVolunteerApplicationEmailTemplate } from "@/utils/createVolunteerApplicationEmailTemplate";
import { appendRowToSubmissionsSheet } from "@/utils/googleSheets";
import { VOLUNTEER_SHEET_TAB } from "@/config/submissions";

export const volunteerRouter = createTRPCRouter({
  submit: publicProcedure
    .input(VolunteerApplicationSchema)
    .mutation(async ({ input }) => {
      // Honeypot: bots fill every input, humans don't see this one.
      if (input.website && input.website.length > 0) {
        return {
          success: true,
          message:
            "Thanks! We read every application and reply within 2 weeks.",
        };
      }

      const {
        name,
        email,
        link,
        location,
        area,
        workOn,
        experience,
        whyCodu,
        commitment,
        other,
      } = input;

      const now = new Date();
      const areaLabel = volunteerAreaLabels[area];
      const commitmentLabel = volunteerCommitmentLabels[commitment];
      const submittedAt = now.toLocaleString("en-IE", {
        dateStyle: "medium",
        timeStyle: "short",
      });

      const htmlMessage = createVolunteerApplicationEmailTemplate({
        name,
        email,
        link: link || undefined,
        location,
        areaLabel,
        workOn,
        experience: experience || undefined,
        whyCodu,
        commitmentLabel,
        other: other || undefined,
        submittedAt,
      });

      const adminEmail = process.env.ADMIN_EMAIL || "hi@codu.co";

      const [sheetResult, emailResult] = await Promise.allSettled([
        appendRowToSubmissionsSheet({
          tab: VOLUNTEER_SHEET_TAB,
          values: [
            now.toISOString(),
            name,
            email,
            link || "",
            location,
            areaLabel,
            workOn,
            experience || "",
            whyCodu,
            commitmentLabel,
            other || "",
          ],
        }),
        sendEmail({
          recipient: adminEmail,
          subject: `New Codú Volunteer Application — ${name} (${areaLabel})`,
          htmlMessage,
        }),
      ]);

      if (sheetResult.status === "rejected") {
        console.error("[volunteer] sheet append failed:", sheetResult.reason);
        Sentry.captureException(sheetResult.reason, {
          tags: { feature: "volunteer-form", step: "sheet-append" },
        });
      }
      if (emailResult.status === "rejected") {
        console.error("[volunteer] email send failed:", emailResult.reason);
        Sentry.captureException(emailResult.reason, {
          tags: { feature: "volunteer-form", step: "email-send" },
        });
      }

      if (
        sheetResult.status === "rejected" &&
        emailResult.status === "rejected"
      ) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            "Sorry, we couldn't submit your application. Please try again or email us directly at hi@codu.co.",
        });
      }

      return {
        success: true,
        message: "Thanks! We read every application and reply within 2 weeks.",
      };
    }),
});
