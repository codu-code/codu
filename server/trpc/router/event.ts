import { nanoid } from "nanoid";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure, publicProcedure } from "../trpc";
import {
  getEventsSchema,
  upsertEventSchema,
  deleteEventSchema,
  uploadPhotoUrlSchema,
} from "../../../schema/event";
import { getPresignedUrl } from "@/server/common/getPresignedUrl";

export const eventRouter = router({
  all: publicProcedure.input(getEventsSchema).query(async ({ ctx, input }) => {
    const limit = input?.limit ?? 50;
    const filter = input.filter ?? undefined;
    const { cursor } = input;

    const response = await ctx.prisma.event.findMany({
      take: limit + 1,
      where: {
        OR: [
          {
            name: {
              contains: filter,
              mode: "insensitive",
            },
          },
        ],
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        eventDate: true,
        address: true,
        capacity: true,
        coverImage: true,
        community: {
          select: {
            name: true,
            slug: true,
            coverImage: true,
            city: true,
            country: true,
          },
        },
        RSVP: {
          select: { id: true },
        },
      },
      cursor: cursor ? { id: cursor } : undefined,
      skip: cursor ? 1 : 0,
      orderBy: {
        eventDate: "desc",
      },
    });

    let nextCursor: typeof cursor | undefined = undefined;
    if (response.length > limit) {
      const nextItem = response.pop();
      nextCursor = nextItem?.id;
    }

    return { events: response, nextCursor };
  }),
  upsert: protectedProcedure
    .input(upsertEventSchema)
    .mutation(async ({ input, ctx }) => {
      if (ctx.session.user.id) {
        if (input.id !== null && input.id !== undefined) {
          const eventSearchResult = await ctx.prisma.event.findFirst({
            where: {
              id: input.id,
            },
            select: {
              communityId: true,
            },
          });

          if (!eventSearchResult) {
            throw new TRPCError({
              code: "NOT_FOUND",
            });
          }

          const membership = await ctx.prisma.membership.findFirst({
            where: {
              communityId: eventSearchResult?.communityId,
              userId: ctx.session.user.id,
              isEventOrganiser: true,
            },
            select: {
              isEventOrganiser: true,
            },
          });

          if (membership === null || membership.isEventOrganiser === false) {
            throw new TRPCError({
              code: "FORBIDDEN",
            });
          }

          const event = await ctx.prisma.event.update({
            where: {
              id: input.id,
            },
            data: {
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
            },
          });

          return event;
        } else {
          const event = await ctx.prisma.event.create({
            data: {
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
            },
          });
          const membership = await ctx.prisma.rSVP.create({
            data: {
              id: nanoid(8),
              eventId: event.id,
              userId: ctx.session.user.id,
            },
          });
          return {
            ...event,
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
            ", "
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
      await ctx.prisma.rSVP.create({
        data: {
          id: nanoid(8),
          eventId: input.id,
          userId: ctx.session.user.id,
        },
      });
    }),
  deleteRSVP: protectedProcedure
    .input(deleteEventSchema)
    .mutation(async ({ input, ctx }) => {
      const rsvp = await ctx.prisma.rSVP.findFirst({
        where: {
          eventId: input.id,
          userId: ctx.session.user.id,
        },
      });
      if (rsvp) {
        await ctx.prisma.rSVP.delete({
          where: {
            id: rsvp.id,
          },
        });
      }
    }),
});
