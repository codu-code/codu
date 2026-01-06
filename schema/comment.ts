import z from "zod";
import { VoteTypeSchema } from "./post";

// Create Comment Schema
export const CreateCommentSchema = z.object({
  body: z.string().min(1).max(5000).trim(),
  postId: z.string(),
  parentId: z.string().optional(), // UUID for parent comment
});

export type CreateCommentInput = z.TypeOf<typeof CreateCommentSchema>;

// Save Comment Schema (alias for create/edit)
export const SaveCommentSchema = z.object({
  body: z.string().trim().min(1).max(5000),
  parentId: z.string().optional(),
  postId: z.string(),
  commentId: z.string().optional(), // For editing existing comment
});

export type SaveCommentInput = z.TypeOf<typeof SaveCommentSchema>;

// Edit Comment Schema
export const EditCommentSchema = z.object({
  id: z.string(),
  body: z.string().min(1).max(5000).trim(),
});

export type EditCommentInput = z.TypeOf<typeof EditCommentSchema>;

// Delete Comment Schema (soft delete)
export const DeleteCommentSchema = z.object({
  id: z.string(),
});

export type DeleteCommentInput = z.TypeOf<typeof DeleteCommentSchema>;

// Get Comments for a Post Schema
export const GetCommentsSchema = z.object({
  postId: z.string(),
  sort: z.enum(["best", "top", "new", "old", "controversial"]).default("best").optional(),
  limit: z.number().min(1).max(100).default(50).optional(),
  cursor: z
    .object({
      id: z.string(),
      createdAt: z.string().optional(),
      score: z.number().optional(),
    })
    .nullish(),
});

export type GetCommentsInput = z.TypeOf<typeof GetCommentsSchema>;

// Get Comment Replies Schema
export const GetRepliesSchema = z.object({
  parentId: z.string(),
  limit: z.number().min(1).max(50).default(10),
  cursor: z
    .object({
      id: z.string(),
      createdAt: z.string().optional(),
    })
    .nullish(),
});

export type GetRepliesInput = z.TypeOf<typeof GetRepliesSchema>;

// Vote Comment Schema (Reddit-style)
export const VoteCommentSchema = z.object({
  commentId: z.string(),
  voteType: VoteTypeSchema.nullable(), // null removes the vote
});

export type VoteCommentInput = z.TypeOf<typeof VoteCommentSchema>;

// Get Comment Count for Post Schema
export const GetCommentCountSchema = z.object({
  postId: z.string(),
});

export type GetCommentCountInput = z.TypeOf<typeof GetCommentCountSchema>;

// Get User's Comments Schema
export const GetUserCommentsSchema = z.object({
  authorId: z.string(),
  limit: z.number().min(1).max(100).default(20),
  cursor: z
    .object({
      id: z.string(),
      createdAt: z.string().optional(),
    })
    .nullish(),
});

export type GetUserCommentsInput = z.TypeOf<typeof GetUserCommentsSchema>;

// Legacy schemas (for backward compatibility)
export const LikeCommentSchema = z.object({
  commentId: z.string(),
});

export type LikeCommentInput = z.TypeOf<typeof LikeCommentSchema>;

export const SendEmailSchema = z.object({
  htmlMessage: z.string(),
  subject: z.string(),
});

export type SendEmailInput = z.TypeOf<typeof SendEmailSchema>;
