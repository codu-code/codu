import z from "zod";

export const UpdateSeriesSchema = z.object({
    postId: z.string(),
    seriesName: z.string().trim().optional()
});