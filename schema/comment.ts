import z from "zod";

export const SaveCommentSchema = z.object({
  body: z.string().trim().min(1).max(5000),
  parentId: z.number().optional(),
  postId: z.string(),
  commentId: z.number().optional(),
});

export const EditCommentSchema = z.object({
  body: z.string().trim().min(1).max(5000),
  id: z.number(),
});

export const DeleteCommentSchema = z.object({
  id: z.number(),
});

export const GetCommentsSchema = z.object({
  postId: z.string(),
});

export const LikeCommentSchema = z.object({
  commentId: z.number(),
});

export type SaveCommentInput = z.TypeOf<typeof SaveCommentSchema>;
export type EditCommentInput = z.TypeOf<typeof EditCommentSchema>;
