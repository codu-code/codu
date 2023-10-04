import nodemailer from "nodemailer";
import * as aws from "@aws-sdk/client-ses";
import { z } from "zod";

const hasAccessKeys = process.env.ACCESS_KEY && process.env.SECRET_KEY;

const ses = new aws.SES({
  apiVersion: "2010-12-01",
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
const transporter = nodemailer.createTransport({
  SES: { ses, aws },
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
  transporter.sendMail(
    {
      from: "hi@codu.co",
      to,
      subject,
      html: htmlMessage,
    },
    (err, info) => {
      if (err) {
        console.log("Error sending mail:", err);
      } else {
        console.log(info.envelope);
        console.log(info.messageId);
      }
    },
  );
};

export default sendEmail;
