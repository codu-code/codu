import z from "zod";

export const GetTagsSchema = z.object({
  take: z.number(),
});
