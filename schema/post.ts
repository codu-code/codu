import z from "zod";

// Post type enum matching the database (lowercase)
export const PostTypeSchema = z.enum([
  "article",
  "discussion",
  "link",
  "resource",
]);
export type PostType = z.TypeOf<typeof PostTypeSchema>;

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

// Get Feed Schema - unified feed with type filtering
export const GetFeedSchema = z.object({
  limit: z.number().min(1).max(100).nullish(),
  cursor: z
    .object({
      id: z.string().uuid(),
      publishedAt: z.string().optional(),
      score: z.number().optional(),
    })
    .nullish(),
  sort: z.enum(["recent", "trending", "popular"]).default("recent"),
  type: PostTypeSchema.nullish(), // Filter by post type
  category: z.string().nullish(),
  tag: z.string().nullish(),
  sourceId: z.number().nullish(),
  authorId: z.string().nullish(), // Filter by author
});

export type GetFeedInput = z.TypeOf<typeof GetFeedSchema>;

// Get Post by ID
export const GetPostByIdSchema = z.object({
  id: z.string().uuid(),
});

export type GetPostByIdInput = z.TypeOf<typeof GetPostByIdSchema>;

// Get Post by Slug
export const GetPostBySlugSchema = z.object({
  slug: z.string().min(1).max(300),
});

export type GetPostBySlugInput = z.TypeOf<typeof GetPostBySlugSchema>;

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

// Get User's Posts Schema
export const GetUserPostsSchema = z.object({
  authorId: z.string(),
  type: PostTypeSchema.nullish(),
  limit: z.number().min(1).max(100).default(20),
  cursor: z
    .object({
      id: z.string(),
      publishedAt: z.string().optional(),
    })
    .nullish(),
});

export type GetUserPostsInput = z.TypeOf<typeof GetUserPostsSchema>;

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

// Get Posts Schema
export const GetPostsSchema = z.object({
  userId: z.string().optional(),
  limit: z.number().min(1).max(100).nullish(),
  cursor: z
    .object({
      id: z.string(),
      published: z.string(),
      likes: z.number(),
      hotScore: z.number().optional(),
    })
    .nullish(),
  sort: z.enum(["newest", "oldest", "top", "trending"]),
  tag: z.string().nullish(),
});

export type GetPostsInput = z.TypeOf<typeof GetPostsSchema>;

// Get Single Post Schema
export const GetSinglePostSchema = z.object({
  slug: z.string(),
});

export type GetSinglePostInput = z.TypeOf<typeof GetSinglePostSchema>;

// Get Limit Side Posts
export const GetLimitSidePosts = z.object({
  limit: z.number().optional(),
});

export type GetLimitSidePostsInput = z.TypeOf<typeof GetLimitSidePosts>;

// Feature Post Schema (admin only)
export const FeaturePostSchema = z.object({
  postId: z.string(),
  featured: z.boolean(),
});

export type FeaturePostInput = z.TypeOf<typeof FeaturePostSchema>;

// Pin Post Schema (admin only)
export const PinPostSchema = z.object({
  postId: z.string(),
  pinnedUntil: z.date().nullable(), // null to unpin
});

export type PinPostInput = z.TypeOf<typeof PinPostSchema>;

// Legacy schemas (for backward compatibility)
export const LikePostSchema = z.object({
  postId: z.string(),
  setLiked: z.boolean(),
});

export type LikePostInput = z.TypeOf<typeof LikePostSchema>;
