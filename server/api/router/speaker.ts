import {
  SpeakerApplicationSchema,
  speakerFormatLabels,
  speakerExperienceLabels,
  talkLengthLabels,
} from "@/schema/speaker";
import * as Sentry from "@sentry/nextjs";
import sendEmail from "@/utils/sendEmail";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { createSpeakerApplicationEmailTemplate } from "@/utils/createSpeakerApplicationEmailTemplate";
import { appendRowToSubmissionsSheet } from "@/utils/googleSheets";
import { SPEAKER_SHEET_TAB } from "@/config/submissions";

export const speakerRouter = createTRPCRouter({
  submit: publicProcedure
    .input(SpeakerApplicationSchema)
    .mutation(async ({ input }) => {
      // Honeypot: silently succeed so bots don't learn the field is wrong.
      if (input.website && input.website.length > 0) {
        return {
          success: true,
          message:
            "Thanks for pitching! We read every submission and reply within 2 weeks.",
        };
      }

      const {
        name,
        email,
        link,
        location,
        bio,
        format,
        talks,
        experience,
        other,
      } = input;

      const now = new Date();
      const formatLabel = speakerFormatLabels[format];
      const experienceLabel = experience
        ? speakerExperienceLabels[experience]
        : undefined;
      const submittedAt = now.toLocaleString("en-IE", {
        dateStyle: "medium",
        timeStyle: "short",
      });

      const talksWithLabels = talks.map((t) => ({
        title: t.title,
        lengthLabel: talkLengthLabels[t.length],
        abstract: t.abstract,
      }));

      const htmlMessage = createSpeakerApplicationEmailTemplate({
        name,
        email,
        link: link || undefined,
        location,
        bio,
        formatLabel,
        experienceLabel,
        talks: talksWithLabels,
        other: other || undefined,
        submittedAt,
      });

      const adminEmail = process.env.ADMIN_EMAIL || "hi@codu.co";

      // Fixed columns for up to 3 talks — unused slots stay empty.
      const talkSlot = (idx: number) => {
        const t = talksWithLabels[idx];
        return [t?.title ?? "", t?.lengthLabel ?? "", t?.abstract ?? ""];
      };

      // Partial-failure policy: see volunteer.ts for the same pattern. If one
      // channel fails we still return success; only both failing errors out.
      const [sheetResult, emailResult] = await Promise.allSettled([
        appendRowToSubmissionsSheet({
          tab: SPEAKER_SHEET_TAB,
          values: [
            now.toISOString(),
            name,
            email,
            link || "",
            location,
            bio,
            formatLabel,
            experienceLabel ?? "",
            ...talkSlot(0),
            ...talkSlot(1),
            ...talkSlot(2),
            other || "",
          ],
        }),
        sendEmail({
          recipient: adminEmail,
          subject: `New Codú Speaker Pitch — ${name} (${talks.length} talk${talks.length === 1 ? "" : "s"})`,
          htmlMessage,
        }),
      ]);

      if (sheetResult.status === "rejected") {
        console.error("[speaker] sheet append failed:", sheetResult.reason);
        Sentry.captureException(sheetResult.reason, {
          tags: { feature: "speaker-form", step: "sheet-append" },
        });
      }
      if (emailResult.status === "rejected") {
        console.error("[speaker] email send failed:", emailResult.reason);
        Sentry.captureException(emailResult.reason, {
          tags: { feature: "speaker-form", step: "email-send" },
        });
      }

      if (
        sheetResult.status === "rejected" &&
        emailResult.status === "rejected"
      ) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            "Sorry, we couldn't submit your pitch. Please try again or email us directly at hi@codu.co.",
        });
      }

      return {
        success: true,
        message:
          "Thanks for pitching! We read every submission and reply within 2 weeks.",
      };
    }),
});
