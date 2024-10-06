import { db } from "@/server/db";
import { emailVerificationToken, user } from "@/server/db/schema";
import crypto from "crypto";
import sendEmail from "./sendEmail";
import { and, eq } from "drizzle-orm";

export const generateEmailToken = () => {
  return crypto.randomBytes(64).toString("hex");
};

export const storeTokenInDb = async (
  userId: string,
  token: string,
  expiresAt: Date,
  email: string,
) => {
  const newToken = await db
    .insert(emailVerificationToken)
    .values({
      userId,
      token,
      expiresAt,
      email,
    })
    .returning();

  return newToken[0];
};

export const sendVerificationEmail = async (email: string, token: string) => {
  const verificationLink = `${process.env.NEXT_PUBLIC_BACKEND_URL}/verify_email?token=${token}`;
  const subject = "Verify Your Email Address";

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
            <h1>Confirm Your Email Address</h1>
            <p>Hello,</p>
            <p>Thank you for registering with us! To complete your registration, please verify your email address by clicking the button below:</p>
            <a href="${verificationLink}" class="btn">Verify Email</a>
            <p>Please note that this link is valid for 1 hour only. If it expires, you will need to request a new one.</p>
            <p>If you did not create an account, please ignore this email.</p>
            <p>Best regards, <br>The Codu Team</p>
            <div class="footer">
                <p>&copy; ${new Date().getFullYear()} Codu. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
  `;

  return sendEmail({ recipient: email, htmlMessage, subject });
};

export const getTokenFromDb = async (token: string, userId: string) => {
  const tokenFromDb = await db
    .select()
    .from(emailVerificationToken)
    .where(
      and(
        eq(emailVerificationToken.token, token),
        eq(emailVerificationToken.userId, userId),
      ),
    );
  return tokenFromDb;
};

export const updateEmail = async (userId: string, newEmail: string) => {
  await db.update(user).set({ email: newEmail }).where(eq(user.id, userId));
};

export const deleteTokenFromDb = async (token: string) => {
  await db
    .delete(emailVerificationToken)
    .where(eq(emailVerificationToken.token, token));
};
