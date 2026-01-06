import z from "zod";

export const CreateDiscussionSchema = z.object({
  body: z.string().min(1).max(5000).trim(),
  contentId: z.string(),
  parentId: z.string().uuid().optional(),
});

export type CreateDiscussionInput = z.TypeOf<typeof CreateDiscussionSchema>;

export const EditDiscussionSchema = z.object({
  id: z.string().uuid(),
  body: z.string().min(1).max(5000).trim(),
});

export type EditDiscussionInput = z.TypeOf<typeof EditDiscussionSchema>;

export const DeleteDiscussionSchema = z.object({
  id: z.string().uuid(),
});

export type DeleteDiscussionInput = z.TypeOf<typeof DeleteDiscussionSchema>;

export const GetDiscussionsSchema = z.object({
  contentId: z.string(),
});

export type GetDiscussionsInput = z.TypeOf<typeof GetDiscussionsSchema>;

// Reddit-style voting schema
export const VoteDiscussionSchema = z.object({
  discussionId: z.string().uuid(), // Changed from number to UUID
  voteType: z.enum(["up", "down"]).nullable(), // null removes the vote
});

export type VoteDiscussionInput = z.TypeOf<typeof VoteDiscussionSchema>;
