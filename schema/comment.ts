import z from "zod";

export const CreateCommentSchema = z.object({
  body: z.string().trim(),
  postId: z.string(),
  parentId: z.number().optional(),
});

export const DeleteCommentSchema = z.object({
  id: z.number(),
});

export const GetCommentsSchema = z.object({
  postId: z.string(),
});
