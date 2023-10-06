import toast from "react-hot-toast";
import { SendEmailSchema } from "../../../schema/comment";
import sendEmail from "../../../utils/sendEmail";
import { protectedProcedure, router } from "../trpc";

export const sendEmailRouter = router({

    send:protectedProcedure
        .input(SendEmailSchema)
        .mutation(async ({input}) => {
            const { recipient, htmlMessage, subject } = input;
            sendEmail({
                recipient,
                htmlMessage,
                subject,
            })
    })
})

