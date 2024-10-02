import { type NextAuthOptions, getServerSession } from "next-auth";
import GitHubProvider from "next-auth/providers/github";
import GitlabProvider from "next-auth/providers/gitlab";
import EmailProvider, {
  type SendVerificationRequestParams,
} from "next-auth/providers/email";
import { createWelcomeEmailTemplate } from "@/utils/createEmailTemplate";
import * as Sentry from "@sentry/nextjs";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "./db";
import sendEmail, { nodemailerSesTransporter } from "@/utils/sendEmail";
import { manageNewsletterSubscription } from "./lib/newsletter";
import { createPasswordLessEmailTemplate } from "@/utils/createPasswordLessEmailTemplate";
import type { Adapter } from "next-auth/adapters";
import { user } from "@/server/db/schema";

const sendPasswordLessEmail = async (params: SendVerificationRequestParams) => {
  const { identifier, url } = params;
  try {
    if (!process.env.ADMIN_EMAIL) {
      throw new Error("ADMIN_EMAIL not set");
    }
    await nodemailerSesTransporter.sendMail({
      to: `Niall (Codú) ${identifier}`,
      from: process.env.ADMIN_EMAIL,
      subject: `Sign in to Codú 🚀`,
      /** Email Text body (fallback for email clients that don't render HTML, e.g. feature phones) */
      text: `Sign in to Codú 🚀\n\n`,
      html: createPasswordLessEmailTemplate(url),
    });
  } catch (error) {
    Sentry.captureException(error);
    throw new Error(`Sign in email could not be sent`);
  }
};

export const authOptions: NextAuthOptions = {
  adapter: DrizzleAdapter(db, {
    // @ts-ignore-next-line
    usersTable: user,
  }) as Adapter,
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_ID || "",
      clientSecret: process.env.GITHUB_SECRET || "",
    }),
    GitlabProvider({
      clientId: process.env.GITLAB_ID || "",
      clientSecret: process.env.GITLAB_SECRET || "",
    }),
    EmailProvider({
      server: {},
      sendVerificationRequest: sendPasswordLessEmail,
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
        session.user.role = user.role;
      }
      return session;
    },
    async signIn({ user }) {
      const userIsBanned = await db.query.banned_users.findFirst({
        where: (banned_users, { eq }) => eq(banned_users.userId, user.id),
      });

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
