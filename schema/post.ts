import z from "zod";

// Post status enum matching the database
export const PostStatusSchema = z.enum([
  "draft",
  "published",
  "scheduled",
  "unlisted",
  "in_review",
  "rejected",
]);
export type PostStatus = z.TypeOf<typeof PostStatusSchema>;

// Vote type enum (lowercase)
export const VoteTypeSchema = z.enum(["up", "down"]);
export type VoteType = z.TypeOf<typeof VoteTypeSchema>;

// Delete Post Schema
export const DeletePostSchema = z.object({
  id: z.string(),
});

export type DeletePostInput = z.TypeOf<typeof DeletePostSchema>;

// Vote Schema
export const VotePostSchema = z.object({
  postId: z.string(),
  voteType: VoteTypeSchema.nullable(), // null removes the vote
});

export type VotePostInput = z.TypeOf<typeof VotePostSchema>;

// Bookmark Schema
export const BookmarkPostSchema = z.object({
  postId: z.string(),
  setBookmarked: z.boolean(),
});

export type BookmarkPostInput = z.TypeOf<typeof BookmarkPostSchema>;

// Track View Schema
export const TrackViewPostSchema = z.object({
  postId: z.string(),
});

export type TrackViewPostInput = z.TypeOf<typeof TrackViewPostSchema>;

// Get Bookmarked Posts Schema
export const GetBookmarkedPostsSchema = z.object({
  limit: z.number().min(1).max(100).default(20),
  cursor: z
    .object({
      id: z.string(),
      createdAt: z.string().optional(),
    })
    .nullish(),
});

export type GetBookmarkedPostsInput = z.TypeOf<typeof GetBookmarkedPostsSchema>;

// Get Draft by ID Schema - get user's own post for editing
export const GetByIdSchema = z.object({
  id: z.string(),
});

export type GetByIdInput = z.TypeOf<typeof GetByIdSchema>;

// Get Single Post Schema
export const GetSinglePostSchema = z.object({
  slug: z.string(),
});

export type GetSinglePostInput = z.TypeOf<typeof GetSinglePostSchema>;

// Legacy schemas (for backward compatibility)
export const LikePostSchema = z.object({
  postId: z.string(),
  setLiked: z.boolean(),
});

export type LikePostInput = z.TypeOf<typeof LikePostSchema>;
