import { TRPCError } from "@trpc/server";
import { BanUserSchema, UnbanUserSchema } from "../../../schema/admin";

import { router, adminOnlyProcedure } from "../trpc";

export const adminRouter = router({
  ban: adminOnlyProcedure
    .input(BanUserSchema)
    .mutation(async ({ input, ctx }) => {
      const { userId, note } = input;
      const currentUserId = ctx.session.user.id;

      const user = await ctx.prisma.user.findFirstOrThrow({
        where: {
          id: userId,
        },
      });

      if (user.role === "ADMIN") {
        throw new TRPCError({
          code: "FORBIDDEN",
        });
      }

      await ctx.prisma.bannedUsers.create({
        data: {
          userId,
          note,
          bannedById: currentUserId,
        },
      });
      await ctx.prisma.session.deleteMany({
        where: {
          userId,
        },
      });

      return { banned: true };
    }),
  unban: adminOnlyProcedure
    .input(UnbanUserSchema)
    .mutation(async ({ input, ctx }) => {
      const { userId } = input;

      await ctx.prisma.bannedUsers.deleteMany({
        where: {
          userId,
        },
      });

      return { unbanned: true };
    }),
});
