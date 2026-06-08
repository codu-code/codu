import nodemailer from "nodemailer";
import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2";
import { z } from "zod";

const hasAccessKeys = process.env.ACCESS_KEY && process.env.SECRET_KEY;

// Never send real email from tests / E2E. The dev:e2e server sets ENV=E2E;
// MOCK_EMAIL is an explicit override (e.g. when reusing a plain dev server for
// Playwright). jsonTransport accepts and discards the message instead of SES.
export const isEmailMocked =
  process.env.ENV === "E2E" ||
  process.env.NODE_ENV === "test" ||
  process.env.MOCK_EMAIL === "true";

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

// SES transporter in real environments; a no-op jsonTransport under test/E2E.
// Both sendEmail() and the next-auth magic-link sender use this transporter,
// so mocking here neutralises every outgoing email in one place.
export const nodemailerSesTransporter = isEmailMocked
  ? nodemailer.createTransport({ jsonTransport: true })
  : nodemailer.createTransport({
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
