import NextAuth, { type NextAuthOptions } from "next-auth";
import GitHubProvider from "next-auth/providers/github";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { createWelcomeEmailTemplate } from "../../../utils/createEmailTemplate";

import prisma from "../../../server/db/client";
import sendEmail from "../../../utils/sendEmail";

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
      if (!user.email) {
        console.error("Missing user.email so cannot send welcome email");
        return;
      }
      const htmlMessage = createWelcomeEmailTemplate(user?.name || undefined);
      try {
        sendEmail({
          recipient: user.email,
          htmlMessage,
          subject: "Welcome to Codú 🎉 | Here is your community invite 💌",
        });
      } catch (error) {
        console.log("Error in createUser event:", error);
      }
    },
  },
};

export default authOptions;
