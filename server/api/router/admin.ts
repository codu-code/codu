import { TRPCError } from "@trpc/server";
import { BanUserSchema, UnbanUserSchema } from "../../../schema/admin";

import { createTRPCRouter, adminOnlyProcedure } from "../trpc";
import { banned_users, session } from "@/server/db/schema";
import { eq } from "drizzle-orm";

export const adminRouter = createTRPCRouter({
  ban: adminOnlyProcedure
    .input(BanUserSchema)
    .mutation(async ({ input, ctx }) => {
      const { userId, note } = input;
      const currentUserId = ctx.session.user.id;

      const user = await ctx.db.query.user.findFirst({
        where: (user, { eq }) => eq(user.id, userId),
      });

      if (!user) throw new Error("User not found");

      if (user.role === "ADMIN") {
        throw new TRPCError({
          code: "FORBIDDEN",
        });
      }

      await ctx.db.insert(banned_users).values({
        bannedById: currentUserId,
        userId: userId,
        note: note,
        createdAt: new Date().toISOString(),
      });

      await ctx.db.delete(session).where(eq(session.userId, userId));

      return { banned: true };
    }),
  unban: adminOnlyProcedure
    .input(UnbanUserSchema)
    .mutation(async ({ input, ctx }) => {
      const { userId } = input;

      await ctx.db.delete(banned_users).where(eq(banned_users.userId, userId));

      return { unbanned: true };
    }),
});
