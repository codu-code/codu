import z from "zod";
import { httpUrl } from "./shared";

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

// Create Post Schema
export const CreatePostSchema = z.object({
  type: PostTypeSchema,
  title: z.string().min(1).max(500),
  body: z.string().nullish(), // Required for article, optional for others
  excerpt: z.string().max(300).nullish(),
  externalUrl: httpUrl().max(2000).nullish(), // Required for link, resource
  coverImage: z.string().url().nullish(),
  tags: z.array(z.string()).max(5).optional(),
  status: PostStatusSchema.default("draft"),
  showComments: z.boolean().default(true),
  canonicalUrl: z.string().url().nullish(),
});

export type CreatePostInput = z.TypeOf<typeof CreatePostSchema>;

// Update/Save Post Schema
export const SavePostSchema = z.object({
  id: z.string(),
  title: z.string().trim().max(500, "Max title length is 500 characters."),
  body: z.string().trim(),
  excerpt: z.optional(
    z.string().trim().max(300, "Max length is 300 characters."),
  ),
  canonicalUrl: z.optional(z.string().trim().url()),
  tags: z.string().array().max(5).optional(),
  status: PostStatusSchema.optional(),
  publishedAt: z.string().datetime().optional(),
});

export type SavePostInput = z.TypeOf<typeof SavePostSchema>;

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

// Publish Post Schema
export const PublishPostSchema = z.object({
  id: z.string(),
  published: z.boolean(),
  publishTime: z.date().optional(),
});

export type PublishPostInput = z.TypeOf<typeof PublishPostSchema>;

// Confirm Post Schema - validation before publishing
export const ConfirmPostSchema = z.object({
  body: z
    .string()
    .trim()
    .min(50, "Content is too short. Minimum of 50 characters."),
  title: z
    .string()
    .trim()
    .max(500)
    .min(10, "Title is too short. Minimum of 10 characters."),
  excerpt: z.string().trim().max(300).optional(),
  canonicalUrl: z.string().trim().url().optional().or(z.literal("")),
  tags: z.string().array().max(5).optional(),
});

export type ConfirmPostInput = z.TypeOf<typeof ConfirmPostSchema>;

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
