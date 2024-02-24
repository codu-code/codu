import { type NextAuthOptions, getServerSession } from "next-auth";
import GitHubProvider from "next-auth/providers/github";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { createWelcomeEmailTemplate } from "@/utils/createEmailTemplate";
import * as Sentry from "@sentry/nextjs";

import prisma from "@/server/db/client";
import sendEmail from "@/utils/sendEmail";
import { manageNewsletterSubscription } from "./lib/newsletter";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_ID || "",
      clientSecret: process.env.GITHUB_SECRET || "",
    }),
  ],
  pages: {
    signIn: "/get-started",
    newUser: "/settings",
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
