import toast from "react-hot-toast";
import { SendEmailSchema } from "../../../schema/comment";
import sendEmail from "../../../utils/sendEmail";
import { protectedProcedure, router } from "../trpc";

export const sendEmailRouter = router({

    send:protectedProcedure
        .input(SendEmailSchema)
        .mutation(async ({input}) => {
            const { htmlMessage, subject } = input;
            sendEmail({
                recipient:process.env.ADMIN_EMAIL || '',
                htmlMessage,
                subject,
            })
    })
})

