import { type NextAuthOptions, getServerSession, Theme } from "next-auth";
import GitHubProvider from "next-auth/providers/github";
import EmailProvider, {
  SendVerificationRequestParams,
} from "next-auth/providers/email";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { createWelcomeEmailTemplate } from "@/utils/createEmailTemplate";
import * as Sentry from "@sentry/nextjs";

import prisma from "@/server/db/client";
import sendEmail from "@/utils/sendEmail";
import { manageNewsletterSubscription } from "./lib/newsletter";
import { createTransport } from "nodemailer";
import { createPasswordLessEmailTemplate } from "@/utils/createPasswordLessEmailTemplate";

const sendPasswordLessEmail = async (params: SendVerificationRequestParams) => {
  const { identifier, url, provider } = params;
  const transport = createTransport(provider.server);

  const result = await transport.sendMail({
    to: identifier,
    from: provider.from,
    subject: `Sign in to Codú 🚀`,
    /** Email Text body (fallback for email clients that don't render HTML, e.g. feature phones) */
    text: `Sign in to Codú 🚀\n\n`,
    html: createPasswordLessEmailTemplate(url),
  });
  const failed = result.rejected.concat(result.pending).filter(Boolean);
  if (failed.length) {
    throw new Error(`Email(s) (${failed.join(", ")}) could not be sent`);
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
      server: {
        host: process.env.EMAIL_SERVER_HOST,
        port: process.env.EMAIL_SERVER_PORT,
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        },
      },
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
