import z from "zod";

export const CreateDiscussionSchema = z.object({
  body: z.string().min(1).max(5000).trim(),
  targetType: z.enum(["POST", "ARTICLE"]),
  postId: z.string().optional(),
  articleId: z.number().optional(),
  parentId: z.number().optional(),
});

export type CreateDiscussionInput = z.TypeOf<typeof CreateDiscussionSchema>;

export const EditDiscussionSchema = z.object({
  id: z.number(),
  body: z.string().min(1).max(5000).trim(),
});

export type EditDiscussionInput = z.TypeOf<typeof EditDiscussionSchema>;

export const DeleteDiscussionSchema = z.object({
  id: z.number(),
});

export type DeleteDiscussionInput = z.TypeOf<typeof DeleteDiscussionSchema>;

export const GetDiscussionsSchema = z.object({
  targetType: z.enum(["POST", "ARTICLE"]),
  postId: z.string().optional(),
  articleId: z.number().optional(),
});

export type GetDiscussionsInput = z.TypeOf<typeof GetDiscussionsSchema>;

export const LikeDiscussionSchema = z.object({
  discussionId: z.number(),
});

export type LikeDiscussionInput = z.TypeOf<typeof LikeDiscussionSchema>;

// Reddit-style voting schema
export const VoteDiscussionSchema = z.object({
  discussionId: z.number(),
  voteType: z.enum(["UP", "DOWN"]).nullable(), // null removes the vote
});

export type VoteDiscussionInput = z.TypeOf<typeof VoteDiscussionSchema>;
