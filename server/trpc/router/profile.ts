import { saveSettingsSchema, getProfileSchema } from "../../../schema/profile";

import { router, publicProcedure, protectedProcedure } from "../trpc";

export const profileRouter = router({
  edit: protectedProcedure
    .input(saveSettingsSchema)
    .mutation(async ({ input, ctx }) => {
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
  get: publicProcedure.input(getProfileSchema).query(({ ctx, input }) => {
    const { username } = input;
    return ctx.prisma.user.findUnique({
      where: {
        username,
      },
    });
  }),
});
