import { nanoid } from "nanoid";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";
import { getPresignedUrl } from "../../common/getPresignedUrl";
import {
  getCommunitySchema,
  deleteCommunitySchema,
  uploadPhotoUrlSchema,
  upsertCommunitySchema,
} from "../../../schema/community";
import { desc, eq, ilike } from "drizzle-orm";
import { community, membership } from "@/server/db/schema";

export const communityRouter = createTRPCRouter({
  all: publicProcedure
    .input(getCommunitySchema)
    .query(async ({ ctx, input }) => {
      const limit = input?.limit ?? 15;
      const filter = input.filter ?? undefined;
      const { cursor } = input;

      const communities = await ctx.db.query.community.findMany({
        columns: {
          id: true,
          name: true,
          description: true,
          slug: true,
          city: true,
          country: true,
          excerpt: true,
          coverImage: true,
        },
        with: {
          members: {
            with: { user: true },
          },
        },
        where: (community, { eq, and, lte, or }) =>
          and(
            cursor ? lte(community.id, cursor) : undefined,
            filter ? ilike(community.name, `%${filter}%`) : undefined,
          ),
        limit: limit + 1,
        offset: cursor ? 1 : 0,
        orderBy: [desc(community.id)],
      });

      let nextCursor: typeof cursor | undefined = undefined;
      if (communities.length > limit) {
        const nextItem = communities.pop();
        nextCursor = nextItem?.id;
      }

      return { communities, nextCursor };
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
          const membership = await ctx.db.query.membership.findFirst({
            columns: { isEventOrganiser: true },
            where: (memberships, { eq, and }) =>
              and(
                eq(memberships.id, input.id as string),
                eq(memberships.userId, ctx.session.user.id),
                eq(memberships.isEventOrganiser, true),
              ),
          });

          if (membership === null || membership?.isEventOrganiser === false) {
            throw new TRPCError({
              code: "FORBIDDEN",
            });
          }

          const updatedCommunity = await ctx.db
            .update(community)
            .set({
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
            })
            .where(eq(community.id, input.id))
            .returning();

          return updatedCommunity;
        } else {
          const [createdCommunity] = await ctx.db
            .insert(community)
            .values({
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
            })
            .returning();

          const members = await ctx.db
            .insert(membership)
            .values({
              id: nanoid(8),
              communityId: createdCommunity.id,
              userId: ctx.session.user.id,
              isEventOrganiser: true,
            })
            .returning();

          return {
            ...community,
            members,
          };
        }
      }
    }),
  createMembership: protectedProcedure
    .input(deleteCommunitySchema)
    .mutation(async ({ input, ctx }) => {
      await ctx.db.insert(membership).values({
        id: nanoid(8),
        communityId: input.id,
        userId: ctx.session.user.id,
        isEventOrganiser: false,
      });
    }),
  deleteMembership: protectedProcedure
    .input(deleteCommunitySchema)
    .mutation(async ({ input, ctx }) => {
      const membershipDetails = await ctx.db.query.membership.findFirst({
        columns: { id: true },
        where: (memberships, { eq, and }) =>
          and(
            eq(memberships.communityId, input.id as string),
            eq(memberships.userId, ctx.session.user.id),
          ),
      });

      if (membershipDetails) {
        await ctx.db
          .delete(membership)
          .where(eq(membership.id, membershipDetails.id));
      }
    }),
});
