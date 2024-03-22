import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import {
  GetNotificationsSchema,
  DeleteNotificationSchema,
} from "../../../schema/notification";
import { notification } from "@/server/db/schema";
import { count, desc, eq } from "drizzle-orm";

export const notificationRouter = createTRPCRouter({
  delete: protectedProcedure
    .input(DeleteNotificationSchema)
    .mutation(async ({ input, ctx }) => {
      const { id } = input;

      const [currentNotification] = await ctx.db
        .select()
        .from(notification)
        .where(eq(notification.id, id));

      if (currentNotification?.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
        });
      }

      const [notificationRes] = await ctx.db
        .delete(notification)
        .where(eq(notification.id, id))
        .returning();

      return notificationRes.id;
    }),
  deleteAll: protectedProcedure.mutation(async ({ ctx }) => {
    const notificationRes = await ctx.db
      .delete(notification)
      .where(eq(notification.userId, ctx.session.user.id))
      .returning();

    return notificationRes.length;
  }),
  get: protectedProcedure
    .input(GetNotificationsSchema)
    .query(async ({ ctx, input }) => {
      const userId = ctx?.session?.user?.id;

      const limit = input?.limit ?? 50;
      const { cursor } = input;
      const response = await ctx.db.query.notification.findMany({
        columns: { id: true, type: true, createdAt: true },
        with: {
          notifier: {
            columns: {
              name: true,
              username: true,
              image: true,
            },
          },
          post: {
            columns: {
              title: true,
              slug: true,
            },
          },
        },
        where: (notifications, { eq, and, lte, or }) =>
          and(
            eq(notifications.userId, userId),
            cursor ? lte(notifications.id, cursor) : undefined,
          ),
        limit: limit + 1,
        offset: cursor ? 1 : 0,
        orderBy: [desc(notification.createdAt)],
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

    const [notificationRes] = await ctx.db
      .select({ count: count() })
      .from(notification)
      .where(eq(notification.userId, userId));

    return notificationRes.count;
  }),
});
