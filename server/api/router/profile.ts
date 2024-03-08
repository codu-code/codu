import {
  saveSettingsSchema,
  getProfileSchema,
  uploadPhotoUrlSchema,
  updateProfilePhotoUrlSchema,
} from "../../../schema/profile";

import { getPresignedUrl } from "../../common/getPresignedUrl";

import { createTRPCRouter, publicProcedure, protectedProcedure } from "../trpc";
import {
  isUserSubscribedToNewsletter,
  manageNewsletterSubscription,
} from "@/server/lib/newsletter";
import { TRPCError } from "@trpc/server";
import { nanoid } from "nanoid";

export const profileRouter = createTRPCRouter({
  edit: protectedProcedure
    .input(saveSettingsSchema)
    .mutation(async ({ input, ctx }) => {
      const { email } = ctx.session.user;

      if (!email) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Email not found",
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

      const profile = await ctx.prisma.user.update({
        where: {
          id: ctx.session.user.id,
        },
        data: {
          ...input,
        },
      });
      return profile;
    }),
  updateProfilePhotoUrl: protectedProcedure
    .input(updateProfilePhotoUrlSchema)
    .mutation(async ({ input, ctx }) => {
      const profile = await ctx.prisma.user.update({
        where: {
          id: ctx.session.user.id,
        },
        data: {
          image: `${input.url}?id=${nanoid(3)}`,
        },
      });
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

      if (size > 1048576) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Maximum file size 1mb",
        });
      }

      const response = await getPresignedUrl(type, size, {
        kind: "user",
        userId: ctx.session.user.id,
      });

      return response;
    }),
  get: publicProcedure.input(getProfileSchema).query(({ ctx, input }) => {
    const { username } = input;
    return ctx.prisma.user.findUnique({
      where: {
        username,
      },
    });
  }),
});
