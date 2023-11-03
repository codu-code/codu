import { nanoid } from "nanoid";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure, publicProcedure } from "../trpc";
import { getPresignedUrl } from "../../common/getPresignedUrl";
import {
  getCommunitySchema,
  deleteCommunitySchema,
  uploadPhotoUrlSchema,
  upsertCommunitySchema,
} from "../../../schema/community";

export const communityRouter = router({
  all: publicProcedure
    .input(getCommunitySchema)
    .query(async ({ ctx, input }) => {
      const limit = input?.limit ?? 50;
      const filter = input.filter ?? undefined;
      const { cursor } = input;

      const response = await ctx.prisma.community.findMany({
        take: limit + 1,
        where: {
          name: {
            contains: filter,
            mode: "insensitive",
          },
        },
        select: {
          id: true,
          name: true,
          description: true,
          slug: true,
          city: true,
          country: true,
          excerpt: true,
          coverImage: true,
          members: {
            include: {
              user: true,
            },
          },
        },
        cursor: cursor ? { id: cursor } : undefined,
        skip: cursor ? 1 : 0,
      });

      let nextCursor: typeof cursor | undefined = undefined;
      if (response.length > limit) {
        const nextItem = response.pop();
        nextCursor = nextItem?.id;
      }

      return { communities: response, nextCursor };
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
        kind: "communities",
      });

      return response;
    }),
  upsert: protectedProcedure
    .input(upsertCommunitySchema)
    .mutation(async ({ input, ctx }) => {
      if (ctx.session.user.id) {
        if (input.id !== null && input.id !== undefined) {
          const membership = await ctx.prisma.membership.findFirst({
            where: {
              communityId: input.id,
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

          const community = await ctx.prisma.community.update({
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
              country: input.country,
              city: input.city,
              excerpt: input.excerpt,
              coverImage: `${input.coverImage}?id=${nanoid(3)}`,
            },
          });

          return community;
        } else {
          const community = await ctx.prisma.community.create({
            data: {
              id: nanoid(8),
              slug: `${input.name
                .toLowerCase()
                .replace(/ /g, "-")
                .replace(/[^\w-]+/g, "")}-${nanoid(8)}`,
              description: input.description,
              name: input.name,
              country: input.country,
              city: input.city,
              excerpt: input.excerpt,
              coverImage: `${input.coverImage}?id=${nanoid(3)}`,
            },
          });
          const membership = await ctx.prisma.membership.create({
            data: {
              id: nanoid(8),
              communityId: community.id,
              userId: ctx.session.user.id,
              isEventOrganiser: true,
            },
          });
          return {
            ...community,
            members: [membership],
          };
        }
      }
    }),
  createMembership: protectedProcedure
    .input(deleteCommunitySchema)
    .mutation(async ({ input, ctx }) => {
      await ctx.prisma.membership.create({
        data: {
          id: nanoid(8),
          communityId: input.id,
          userId: ctx.session.user.id,
          isEventOrganiser: false,
        },
      });
    }),
  deleteMembership: protectedProcedure
    .input(deleteCommunitySchema)
    .mutation(async ({ input, ctx }) => {
      const membership = await ctx.prisma.membership.findFirst({
        where: {
          communityId: input.id,
          userId: ctx.session.user.id,
        },
      });
      if (membership) {
        await ctx.prisma.membership.delete({
          where: {
            id: membership.id,
          },
        });
      }
    }),
});
