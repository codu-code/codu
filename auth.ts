import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import GitLab from "next-auth/providers/gitlab";
import Nodemailer from "next-auth/providers/nodemailer";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/server/db";
import { user } from "@/server/db/schema";
import { createWelcomeEmailTemplate } from "@/utils/createEmailTemplate";
import { createPasswordLessEmailTemplate } from "@/utils/createPasswordLessEmailTemplate";
import { manageNewsletterSubscription } from "@/server/lib/newsletter";
import sendEmail, { nodemailerSesTransporter } from "@/utils/sendEmail";
import { isAdminEmail } from "@/server/lib/adminConfig";
import { eq } from "drizzle-orm";
import * as Sentry from "@sentry/nextjs";

// Passwordless email sign-in is gated: enabled in dev, or explicitly via env.
const emailAuthEnabled =
  process.env.EMAIL_AUTH_ENABLED === "true" ||
  process.env.NODE_ENV !== "production";

export const { handlers, auth, signIn, signOut } = NextAuth({
  // @ts-expect-error - DrizzleAdapter type mismatch with next-auth internal types
  adapter: DrizzleAdapter(db, {
    // @ts-expect-error - Custom user table
    usersTable: user,
  }),
  providers: [
    GitHub({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }),
    GitLab({
      clientId: process.env.GITLAB_ID!,
      clientSecret: process.env.GITLAB_SECRET!,
    }),
    ...(emailAuthEnabled
      ? [
          Nodemailer({
            server: {
              // Using custom sendVerificationRequest, so this is not used
              host: "",
              port: 0,
              auth: { user: "", pass: "" },
            },
            from: process.env.ADMIN_EMAIL,
            async sendVerificationRequest({ identifier, url }) {
              try {
                if (!process.env.ADMIN_EMAIL) {
                  throw new Error("ADMIN_EMAIL not set");
                }
                await nodemailerSesTransporter.sendMail({
                  to: identifier,
                  from: process.env.ADMIN_EMAIL,
                  subject: `Sign in to Codú 🚀`,
                  text: `Sign in to Codú 🚀\n\n`,
                  html: createPasswordLessEmailTemplate(url),
                });
              } catch (error) {
                Sentry.captureException(error);
                throw new Error(`Sign in email could not be sent`);
              }
            },
          }),
        ]
      : []),
  ],
  pages: {
    signIn: "/get-started",
    newUser: "/welcome",
    verifyRequest: "/auth",
    error: "/auth/error",
  },
  callbacks: {
    session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
        session.user.role = user.role;
        session.user.newsletter = user.newsletter;
      }
      return session;
    },
    async signIn({ user }) {
      try {
        const userIsBanned = await db.query.banned_users.findFirst({
          where: (banned_users, { eq }) => eq(banned_users.userId, user.id),
        });
        return !userIsBanned;
      } catch (error) {
        console.error("Error checking banned users:", error);
        Sentry.captureException(error);
        // Fail closed: reject sign-in on error to maintain security
        return false;
      }
    },
  },
  events: {
    async createUser({ user: newUser }) {
      const { email, id } = newUser;

      if (!email) {
        console.error("Missing email so cannot send welcome email");
        Sentry.captureMessage("Missing 'email' so cannot send welcome email");
        return;
      }

      // Grant admin role if email is in ADMIN_EMAILS environment variable
      if (isAdminEmail(email)) {
        try {
          await db.update(user).set({ role: "ADMIN" }).where(eq(user.id, id));
          console.log(`Granted ADMIN role to ${email}`);
        } catch (error) {
          console.error("Failed to grant admin role:", error);
          Sentry.captureException(error);
        }
      }

      const htmlMessage = createWelcomeEmailTemplate(
        newUser?.name || undefined,
      );

      // Subscribe to newsletter (separate try/catch so it doesn't block welcome email)
      try {
        await manageNewsletterSubscription(email, "subscribe");
      } catch (error) {
        console.error("Failed to subscribe user to newsletter:", error);
        Sentry.captureException(error);
      }

      // Send welcome email
      try {
        await sendEmail({
          recipient: email,
          htmlMessage,
          subject:
            "Thanks for Joining Codú 🎉 + Your Exclusive Community Invite.",
        });
      } catch (error) {
        console.error("Failed to send welcome email:", error);
        Sentry.captureException(error);
      }
    },
  },
});
