import { type NextAuthOptions, getServerSession, Theme } from "next-auth";
import GitHubProvider from "next-auth/providers/github";
import EmailProvider, {
  SendVerificationRequestParams,
} from "next-auth/providers/email";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { createWelcomeEmailTemplate } from "@/utils/createEmailTemplate";
import * as Sentry from "@sentry/nextjs";

import prisma from "@/server/db/client";
import sendEmail, { nodemailerSesTransporter } from "@/utils/sendEmail";
import { manageNewsletterSubscription } from "./lib/newsletter";
import { createPasswordLessEmailTemplate } from "@/utils/createPasswordLessEmailTemplate";

const sendPasswordLessEmail = async (params: SendVerificationRequestParams) => {
  const { identifier, url, provider } = params;

  try {
    await nodemailerSesTransporter.sendMail({
      to: identifier,
      from: provider.from,
      subject: `Sign in to Codú 🚀`,
      /** Email Text body (fallback for email clients that don't render HTML, e.g. feature phones) */
      text: `Sign in to Codú 🚀\n\n`,
      html: createPasswordLessEmailTemplate(url),
    });
  } catch (error) {
    throw new Error(`Sign in email could not be sent`);
  }
};

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_ID || "",
      clientSecret: process.env.GITHUB_SECRET || "",
    }),
    EmailProvider({
      server: {},
      sendVerificationRequest: sendPasswordLessEmail,
      from: process.env.EMAIL_FROM,
    }),
  ],
  pages: {
    signIn: "/get-started",
    newUser: "/settings",
    verifyRequest: "/auth",
    error: "/auth/error", // (used for any errors which occur during auth
  },
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
        if (user.username) {
          session.user.username = user.username;
          session.user.role = user.role;
        }
      }
      return session;
    },
    async signIn({ user }) {
      const userIsBanned = !!(await prisma.bannedUsers.findFirst({
        where: {
          userId: user.id,
        },
      }));
      // Allows signin or not
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
};

/**
 * Wrapper for `getServerSession` so that you don't need to import the `authOptions` in every file.
 *
 * @see https://next-auth.js.org/configuration/nextjs
 */
export const getServerAuthSession = () => getServerSession(authOptions);

export default authOptions;
