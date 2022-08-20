import { TRPCError } from "@trpc/server";
import { createRouter } from "../createRouter";
import { saveSettingsSchema, getProfileSchema } from "../../../schema/profile";

export const profileRouter = createRouter()
  .mutation("profile", {
    input: saveSettingsSchema,
    async resolve({ ctx, input }) {
      if (!ctx.session?.user?.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User is not authenticated",
        });
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
    },
  })
  .query("profile", {
    input: getProfileSchema,
    resolve({ ctx, input }) {
      const { username } = input;
      return ctx.prisma.user.findUnique({
        where: {
          username,
        },
      });
    },
  });
