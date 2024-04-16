import { nanoid } from "nanoid";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";
import {
  getEventsSchema,
  upsertEventSchema,
  deleteEventSchema,
  uploadPhotoUrlSchema,
} from "../../../schema/event";
import { getPresignedUrl } from "@/server/common/getPresignedUrl";
import { desc, eq } from "drizzle-orm";
import { event, r_s_v_p } from "@/server/db/schema";

export const eventRouter = createTRPCRouter({
  all: publicProcedure.input(getEventsSchema).query(async ({ ctx, input }) => {
    const limit = input?.limit ?? 50;
    const filter = input.filter ?? undefined;
    const { cursor } = input;

    const response = await ctx.db.query.event.findMany({
      columns: {
        id: true,
        name: true,
        slug: true,
        description: true,
        eventDate: true,
        address: true,
        capacity: true,
        coverImage: true,
      },
      with: {
        community: {
          columns: {
            name: true,
            slug: true,
            coverImage: true,
            city: true,
            country: true,
          },
        },
        RSVP: {
          columns: {
            id: true,
          },
        },
      },
      where: (event, { and, lte, ilike }) =>
        and(
          cursor ? lte(event.eventDate, cursor) : undefined,
          filter ? ilike(event.name, `%${filter}%`) : undefined,
        ),
      limit: limit + 1,
      offset: cursor ? 1 : 0,
      orderBy: [desc(event.eventDate)],
    });

    let nextCursor: typeof cursor | undefined = undefined;
    if (response.length > limit) {
      const nextItem = response.pop();
      nextCursor = nextItem?.eventDate;
    }

    return { events: response, nextCursor };
  }),
  upsert: protectedProcedure
    .input(upsertEventSchema)
    .mutation(async ({ input, ctx }) => {
      if (ctx.session.user.id) {
        if (input.id !== null && input.id !== undefined) {
          const eventSearchResult = await ctx.db.query.event.findFirst({
            columns: { communityId: true },
            where: (event, { eq, and }) =>
              and(eq(event.id, input.id as string)),
          });

          if (!eventSearchResult) {
            throw new TRPCError({
              code: "NOT_FOUND",
            });
          }
          console.log(0);

          const membership = await ctx.db.query.membership.findFirst({
            columns: { isEventOrganiser: true },
            where: (membership, { eq, and }) =>
              and(
                eq(membership.id, input.id as string),
                eq(membership.isEventOrganiser, true),
                eq(membership.userId, ctx.session.user.id),
              ),
          });
          console.log(1);

          if (membership === null || membership?.isEventOrganiser === false) {
            throw new TRPCError({
              code: "FORBIDDEN",
            });
          }

          const [updatedEvent] = await ctx.db
            .update(event)
            .set({
              slug: `${input.name
                .toLowerCase()
                .replace(/ /g, "-")
                .replace(/[^\w-]+/g, "")}-${nanoid(8)}`,
              description: input.description,
              name: input.name,
              address: input.address,
              eventDate: input.eventDate,
              capacity: input.capacity,
              coverImage: `${input.coverImage}?id=${nanoid(3)}`,
            })
            .where(eq(event.id, input.id))
            .returning();

          return updatedEvent;
        } else {
          console.log(2);
          const [createdEvent] = await ctx.db
            .insert(event)
            .values({
              id: nanoid(8),
              communityId: input.communityId,
              slug: `${input.name
                .toLowerCase()
                .replace(/ /g, "-")
                .replace(/[^\w-]+/g, "")}-${nanoid(8)}`,
              description: input.description,
              name: input.name,
              address: input.address,
              eventDate: input.eventDate,
              capacity: input.capacity,
              coverImage: `${input.coverImage}?id=${nanoid(3)}`,
            })
            .returning();
          console.log(3);

          const membership = await ctx.db
            .insert(r_s_v_p)
            .values({
              id: nanoid(8),
              eventId: createdEvent.id,
              userId: ctx.session.user.id,
            })
            .returning();
          console.log(4);

          return {
            ...createdEvent,
            members: [membership],
          };
        }
      }
    }),
  getUploadUrl: protectedProcedure
    .input(uploadPhotoUrlSchema)
    .mutation(async ({ input }) => {
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
        kind: "events",
      });

      return response;
    }),
  createRSVP: protectedProcedure
    .input(deleteEventSchema)
    .mutation(async ({ input, ctx }) => {
      await ctx.db.insert(r_s_v_p).values({
        id: nanoid(8),
        eventId: input.id,
        userId: ctx.session.user.id,
      });
    }),
  deleteRSVP: protectedProcedure
    .input(deleteEventSchema)
    .mutation(async ({ input, ctx }) => {
      const rsvp = await ctx.db.query.r_s_v_p.findFirst({
        columns: { id: true },
        where: (event, { eq, and }) =>
          and(
            eq(event.id, input.id as string),
            eq(event.userId, ctx.session.user.id),
          ),
      });

      if (rsvp) {
        await ctx.db.delete(r_s_v_p).where(eq(r_s_v_p.id, rsvp.id));
      }
    }),
});
