import { createTRPCRouter, publicProcedure } from "../trpc";
import { GetTagsSchema } from "../../../schema/tag";

export const tagRouter = createTRPCRouter({
  get: publicProcedure.input(GetTagsSchema).query(async ({ ctx, input }) => {
    try {
      const count = await ctx.db.tag.count({});
      const response = await ctx.db.tag.findMany({
        orderBy: {
          PostTag: {
            _count: "desc",
          },
        },
        take: input.take,
      });

      return { data: response, count };
    } catch (error) {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to fetch tags' });
    }
  }),
});
