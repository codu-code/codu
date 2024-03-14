import { createTRPCRouter, publicProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { post_tag, tag } from "@/server/db/schema";
import { desc, eq, count } from "drizzle-orm";

export const tagRouter = createTRPCRouter({
  get: publicProcedure.query(async ({ ctx }) => {
    try {
      const data = await ctx.db
        .select({
          title: tag.title,
          count: count(tag.title),
        })
        .from(tag)
        .groupBy(tag.title)
        .leftJoin(post_tag, eq(post_tag.tagId, tag.id))
        .limit(10)
        .orderBy(desc(count(tag.title)));

      return { data };
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch tags",
      });
    }
  }),
});
