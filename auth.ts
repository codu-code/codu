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
import * as Sentry from "@sentry/nextjs";

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
            to: `Niall (Codú) ${identifier}`,
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
  ],
  pages: {
    signIn: "/get-started",
    newUser: "/settings",
    verifyRequest: "/auth",
    error: "/auth/error",
  },
  callbacks: {
    session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
        session.user.role = user.role;
      }
      return session;
    },
    async signIn({ user }) {
      const userIsBanned = await db.query.banned_users.findFirst({
        where: (banned_users, { eq }) => eq(banned_users.userId, user.id),
      });
      return !userIsBanned;
    },
  },
  events: {
    async createUser({ user }) {
      const { email } = user;

      if (!email) {
        console.error("Missing email so cannot send welcome email");
        Sentry.captureMessage("Missing 'email' so cannot send welcome email");
        return;
      }
      const htmlMessage = createWelcomeEmailTemplate(user?.name || undefined);
      try {
        await manageNewsletterSubscription(email, "subscribe");
        await sendEmail({
          recipient: email,
          htmlMessage,
          subject:
            "Thanks for Joining Codú 🎉 + Your Excluisve Community Invite.",
        });
      } catch (error) {
        console.log("Error in createUser event:", error);
        Sentry.captureException(error);
      }
    },
  },
});
