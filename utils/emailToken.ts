import { db } from "@/server/db";
import { user } from "@/server/db/schema";
import crypto from "crypto";
import sendEmail from "./sendEmail";
import { eq } from "drizzle-orm";
import { getAppOrigin } from "@/server/lib/url";

export const generateEmailToken = () => {
  return crypto.randomBytes(64).toString("hex");
};

export const sendVerificationEmail = async (email: string, token: string) => {
  const verificationLink = `${getAppOrigin()}/verify-email?token=${token}`;
  const subject = "Confirm your email — one tap and you're in";
  const htmlMessage = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Email Verification</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                background-color: #f4f4f4;
                color: #333;
                margin: 0;
                padding: 0;
            }
            .container {
                width: 100%;
                max-width: 600px;
                margin: 0 auto;
                background-color: #ffffff;
                padding: 20px;
                border-radius: 8px;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            }
            h1 {
                font-size: 24px;
                margin-bottom: 20px;
            }
            p {
                font-size: 16px;
                line-height: 1.6;
                margin-bottom: 20px;
            }
            .btn {
                display: inline-block;
                padding: 12px 24px;
                font-size: 16px;
                color: #fff !important;
                font-weight: bold;
                background-color: #007bff;
                text-decoration: none;
                border-radius: 4px;
                margin-top: 20px;
            }
            .footer {
                margin-top: 40px;
                font-size: 12px;
                color: #777;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>Confirm your email</h1>
            <p>Welcome to Codú — the community for AI builders and indie hackers. Less theory, more shipping.</p>
            <p>Tap the button below to confirm your email and finish setting up your account:</p>
            <a href="${verificationLink}" class="btn">Confirm my email</a>
            <p>This link expires in 1 hour. If it does, just request a new one.</p>
            <p>If the button doesn't work, copy and paste this URL into your browser:</p>
            <p style="word-break: break-all; font-size: 14px; color: #555;">${verificationLink}</p>
            <p>If you didn't sign up for Codú, you can safely ignore this email.</p>
            <p>See you in the build,<br>The Codú team</p>
            <div class="footer">
                <p>&copy; ${new Date().getFullYear()} Codú. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
  `;

  try {
    return sendEmail({ recipient: email, htmlMessage, subject });
  } catch (error) {
    console.error("Error sending verification email:", error);
    throw new Error("Failed to send verification email");
  }
};

export const updateEmail = async (userId: string, newEmail: string) => {
  try {
    await db.update(user).set({ email: newEmail }).where(eq(user.id, userId));
  } catch (error) {
    console.error("Error updating email in database:", error);
    throw new Error("Failed to update email");
  }
};

export const checkIfEmailExists = async (email: string) => {
  try {
    const existingUser = await db.query.user.findFirst({
      where: (users, { eq }) => eq(users.email, email),
    });

    return !!existingUser;
  } catch (error) {
    console.error("Error checking if email exists:", error);
    throw new Error("Failed to check if email exists");
  }
};
