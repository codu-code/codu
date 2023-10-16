import toast from "react-hot-toast";
import { SendEmailSchema } from "../../../schema/comment";
import sendEmail from "@/utils/sendEmail";

import { createTRPCRouter, protectedProcedure } from "../trpc";

export const emailReportRouter = createTRPCRouter({
  send: protectedProcedure
    .input(SendEmailSchema)
    .mutation(async ({ input }) => {
      const { htmlMessage, subject } = input;
      try {
        await sendEmail({
          recipient: process.env.ADMIN_EMAIL || "",
          htmlMessage,
          subject,
        });
      } catch (error) {
        console.log(`Failed to send email: ${error}`);
        throw new Error();
      }
    }),
});
