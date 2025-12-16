import nodemailer from "nodemailer";
import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2";
import { z } from "zod";

const hasAccessKeys = process.env.ACCESS_KEY && process.env.SECRET_KEY;

const sesClient = new SESv2Client({
  region: "eu-west-1",
  ...(hasAccessKeys
    ? {
        credentials: {
          accessKeyId: process.env.ACCESS_KEY || "",
          secretAccessKey: process.env.SECRET_KEY || "",
        },
      }
    : {}),
});

// create Nodemailer SES transporter
export const nodemailerSesTransporter = nodemailer.createTransport({
  SES: { sesClient, SendEmailCommand },
});

interface MailConfig {
  recipient: string;
  subject: string;
  htmlMessage: string;
}

const sendEmail = async (config: MailConfig) => {
  const { recipient, htmlMessage, subject } = config;
  if (!htmlMessage.length || !subject.length)
    throw new Error(`"htmlMessage" & "subject" required.`);
  const emailSchema = z.string().email();
  const to = emailSchema.parse(recipient);
  // send some mail
  return new Promise((resolve, reject) => {
    nodemailerSesTransporter.sendMail(
      {
        from: "hi@codu.co",
        to,
        subject,
        html: htmlMessage,
      },
      (err, info) => {
        if (err) {
          console.log("Error sending mail:", err);
          reject(`Error sending mail: ${err}`);
        } else {
          console.log(info.envelope);
          console.log(info.messageId);
          resolve({
            envelope: info.envelope,
            messageId: info.messageId,
          });
        }
      },
    );
  });
};

export default sendEmail;
