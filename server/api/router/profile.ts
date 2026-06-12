import { z } from "zod";
import {
  user,
  comments,
  posts,
  feed_sources as feedSources,
} from "@/server/db/schema";
import { buildCommentHref } from "@/server/lib/content-url";
import {
  saveSettingsSchema,
  getProfileSchema,
  uploadPhotoUrlSchema,
  updateProfilePhotoUrlSchema,
} from "@/schema/profile";

import { getPresignedUrl } from "@/server/common/getPresignedUrl";

import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
  rateLimitedProcedure,
} from "../trpc";
import {
  isUserSubscribedToNewsletter,
  manageNewsletterSubscription,
} from "@/server/lib/newsletter";
import { isReservedUsername } from "@/server/lib/reserved-usernames";
import { checkBadges } from "@/server/lib/engagement";
import { TRPCError } from "@trpc/server";
import { nanoid } from "nanoid";
import { and, desc, eq, gte, isNull, ne, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { emailTokenReqSchema } from "@/schema/token";
import { generateEmailToken, sendVerificationEmail } from "@/utils/emailToken";
import { TOKEN_EXPIRATION_TIME } from "@/config/constants";
import { emailChangeRequest } from "@/server/db/schema";

export const profileRouter = createTRPCRouter({
  // The signed-in user's chosen topics ("Your topics" / onboarding).
  myInterests: protectedProcedure.query(async ({ ctx }) => {
    const [row] = await ctx.db
      .select({
        topics: user.topics,
        onboardedAt: user.onboardedAt,
        experienceLevel: user.experienceLevel,
      })
      .from(user)
      .where(eq(user.id, ctx.session.user.id))
      .limit(1);
    return {
      topics: row?.topics ?? [],
      onboardedAt: row?.onboardedAt ?? null,
      experienceLevel: row?.experienceLevel ?? null,
    };
  }),

  // Save the user's topics (and optional onboarding fields). Topics are capped
  // and trimmed so the column can't be stuffed.
  updateInterests: protectedProcedure
    .input(
      z.object({
        topics: z.array(z.string().min(1).max(40)).max(24),
        experienceLevel: z.string().max(40).optional(),
        markOnboarded: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const topics = Array.from(
        new Set(input.topics.map((t) => t.trim()).filter(Boolean)),
      ).slice(0, 24);
      const set: Record<string, unknown> = { topics };
      if (input.experienceLevel) set.experienceLevel = input.experienceLevel;
      if (input.markOnboarded) set.onboardedAt = new Date().toISOString();
      const [row] = await ctx.db
        .update(user)
        .set(set)
        .where(eq(user.id, ctx.session.user.id))
        .returning({ topics: user.topics, onboardedAt: user.onboardedAt });
      // Topic picks are an onboarding-badge input; no points awarded here, so
      // run the badge check explicitly. Never throws.
      await checkBadges(ctx.session.user.id);
      return {
        topics: row?.topics ?? topics,
        onboardedAt: row?.onboardedAt ?? null,
      };
    }),

  edit: rateLimitedProcedure({
    name: "profile-edit",
    limit: 5,
    windowMs: 10 * 60_000,
    message:
      "You're updating your profile too fast. Take a breather and try again.",
  })
    .input(saveSettingsSchema)
    .mutation(async ({ input, ctx }) => {
      const { email } = ctx.session.user;

      if (!email) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Email not found",
        });
      }

      // Usernames share the top-level namespace with routes/content, so block
      // any handle that would collide with a reserved path.
      if (isReservedUsername(input.username)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "That username is reserved.",
        });
      }

      // Case-insensitive uniqueness (GitHub-style). The lower(username) index
      // also enforces this; this check just gives a clean message.
      const handleClash = await ctx.db.query.user.findFirst({
        columns: { id: true },
        where: (users) =>
          and(
            sql`lower(${users.username}) = ${input.username.toLowerCase()}`,
            ne(users.id, ctx.session.user.id),
          ),
      });
      if (handleClash) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "That username is already taken.",
        });
      }

      const newsletter = await isUserSubscribedToNewsletter(email);

      if (newsletter !== input.newsletter) {
        const action = input.newsletter ? "subscribe" : "unsubscribe";
        if (!email) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Email not found",
          });
        }
        const response = await manageNewsletterSubscription(email, action);
        if (!response) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to update newsletter subscription",
          });
        }
      }

      // Explicitly whitelist updatable columns rather than spreading `input`,
      // so a future field added to saveSettingsSchema can't silently become
      // mass-assignable on the user row.
      const [profile] = await ctx.db
        .update(user)
        .set({
          name: input.name,
          bio: input.bio,
          username: input.username,
          location: input.location,
          websiteUrl: input.websiteUrl,
          emailNotifications: input.emailNotifications,
          newsletter: input.newsletter,
        })
        .where(eq(user.id, ctx.session.user.id))
        .returning();

      if (!profile) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Profile not found or update failed",
        });
      }
      return profile;
    }),
  updateProfilePhotoUrl: protectedProcedure
    .input(updateProfilePhotoUrlSchema)
    .mutation(async ({ input, ctx }) => {
      const [profile] = await ctx.db
        .update(user)
        .set({ image: `${input.url}?id=${nanoid(3)}` })
        .where(eq(user.id, ctx.session.user.id))
        .returning();

      if (!profile) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Profile not found or update failed",
        });
      }
      return profile;
    }),
  getUploadUrl: protectedProcedure
    .input(uploadPhotoUrlSchema)
    .mutation(async ({ ctx, input }) => {
      const { size, type } = input;
      const extension = type.split("/")[1];

      const acceptedFormats = ["jpg", "jpeg", "gif", "png", "webp"];

      if (!acceptedFormats.includes(extension)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Invalid file. Accepted file formats: ${acceptedFormats.join(
            ", ",
          )}.`,
        });
      }

      if (size > 1048576 * 10) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Maximum file size 10mb",
        });
      }

      const response = await getPresignedUrl(type, size, {
        kind: "user",
        userId: ctx.session.user.id,
      });

      return response;
    }),
  get: publicProcedure.input(getProfileSchema).query(async ({ ctx, input }) => {
    const { username } = input;
    // Handles resolve case-insensitively (GitHub-style).
    const [profile] = await ctx.db
      .select()
      .from(user)
      .where(sql`lower(${user.username}) = ${username.toLowerCase()}`);

    if (!profile) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Profile not found",
      });
    }
    return profile;
  }),
  // A user's comments/replies, newest first, each linked to the comment anchor
  // on its published parent content. Profiles are public.
  userReplies: publicProcedure
    .input(getProfileSchema)
    .query(async ({ ctx, input }) => {
      const { username } = input;

      const [profile] = await ctx.db
        .select({ id: user.id })
        .from(user)
        .where(sql`lower(${user.username}) = ${username.toLowerCase()}`)
        .limit(1);

      if (!profile) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Profile not found",
        });
      }

      // Parent post's author drives member hrefs; aliased so it doesn't collide
      // with any future join on the comment author.
      const postAuthor = alias(user, "post_author");

      const rows = await ctx.db
        .select({
          id: comments.id,
          body: comments.body,
          createdAt: comments.createdAt,
          parentTitle: posts.title,
          parentType: posts.type,
          parentSlug: posts.slug,
          sourceSlug: feedSources.slug,
          authorUsername: postAuthor.username,
        })
        .from(comments)
        .innerJoin(posts, eq(comments.postId, posts.id))
        .leftJoin(feedSources, eq(posts.sourceId, feedSources.id))
        .leftJoin(postAuthor, eq(posts.authorId, postAuthor.id))
        .where(
          and(
            eq(comments.authorId, profile.id),
            isNull(comments.deletedAt),
            eq(posts.status, "published"),
          ),
        )
        .orderBy(desc(comments.createdAt))
        .limit(30);

      return rows.map((r) => ({
        id: r.id,
        body: r.body,
        createdAt: r.createdAt,
        parent: {
          title: r.parentTitle,
          href: buildCommentHref({
            commentId: r.id,
            parentType: r.parentType,
            parentSlug: r.parentSlug,
            sourceSlug: r.sourceSlug,
            authorUsername: r.authorUsername,
          }),
        },
      }));
    }),
  updateEmail: rateLimitedProcedure({
    name: "profile-update-email",
    limit: 5,
    windowMs: 10 * 60_000,
    message:
      "You're requesting email changes too fast. Take a breather and try again.",
  })
    .input(emailTokenReqSchema)
    .mutation(async ({ input, ctx }) => {
      const { newEmail } = input;
      const userId = ctx.session.user.id;

      if (!newEmail) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid request",
        });
      }

      // Check if the new email is already in use
      const existingUser = await ctx.db.query.user.findFirst({
        where: eq(user.email, newEmail),
      });

      if (existingUser) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Unable to process the request",
        });
      }

      // Rate limiting: Check for recent requests
      const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
      const recentRequest = await ctx.db.query.emailChangeRequest.findFirst({
        where: and(
          eq(emailChangeRequest.userId, userId),
          gte(emailChangeRequest.createdAt, twoMinutesAgo), // 2 minutes
        ),
      });

      if (recentRequest) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "Please wait before requesting another email change",
        });
      }

      // Generate a new token and expiration date
      const token = generateEmailToken();
      const expiresAt = new Date(Date.now() + TOKEN_EXPIRATION_TIME);

      // Create a new email change request
      await ctx.db.insert(emailChangeRequest).values({
        userId,
        newEmail,
        token,
        expiresAt,
      });

      // Send verification email
      try {
        await sendVerificationEmail(newEmail, token);
      } catch (error) {
        console.error("Failed to send verification email:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to send verification email",
        });
      }

      return { message: "Verification email sent" };
    }),
});
