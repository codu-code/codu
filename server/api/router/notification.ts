import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import {
  GetNotificationsSchema,
  DeleteNotificationSchema,
} from "../../../schema/notification";

export const notificationRouter = createTRPCRouter({
  delete: protectedProcedure
    .input(DeleteNotificationSchema)
    .mutation(async ({ input, ctx }) => {
      const { id } = input;

      const currentNotification = await ctx.db.notification.findUnique({
        where: { id },
      });

      if (currentNotification?.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
        });
      }

      const notification = await ctx.db.notification.delete({
        where: {
          id,
        },
      });

      return notification.id;
    }),
  deleteAll: protectedProcedure.mutation(async ({ ctx }) => {
    const notification = await ctx.db.notification.deleteMany({
      where: {
        userId: ctx.session.user.id,
      },
    });

    return notification;
  }),
  get: protectedProcedure
    .input(GetNotificationsSchema)
    .query(async ({ ctx, input }) => {
      const userId = ctx?.session?.user?.id;

      const limit = input?.limit ?? 50;
      const { cursor } = input;
      const response = await ctx.db.notification.findMany({
        take: limit + 1,
        where: {
          userId,
        },
        select: {
          id: true,
          type: true,
          createdAt: true,
          notifier: {
            select: {
              name: true,
              username: true,
              image: true,
            },
          },
          post: {
            select: {
              title: true,
              slug: true,
            },
          },
        },
        cursor: cursor ? { id: cursor } : undefined,
        skip: cursor ? 1 : 0,
        orderBy: {
          createdAt: "desc",
        },
      });

      let nextCursor: typeof cursor | undefined = undefined;

      if (response.length > limit) {
        const nextItem = response.pop();
        nextCursor = nextItem?.id;
      }

      return { data: response, nextCursor };
    }),
  getCount: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx?.session?.user?.id;

    const count = await ctx.db.notification.count({
      where: {
        userId,
      },
    });

    return count;
  }),
});
