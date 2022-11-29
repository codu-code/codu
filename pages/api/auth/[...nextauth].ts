import NextAuth, { type NextAuthOptions } from "next-auth";
import GitHubProvider from "next-auth/providers/github";
import { PrismaAdapter } from "@next-auth/prisma-adapter";

import prisma from "../../../server/db/client";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }),
  ],
  pages: {
    signIn: "/get-started",
    newUser: "/settings",
  },
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        console.log(user);
        session.user.id = user.id;
        if (user.username) {
          session.user.username = user.username;
        }
      }
      return session;
    },
  },
};

export default NextAuth(authOptions);
