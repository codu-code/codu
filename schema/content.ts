import z from "zod";
import { httpUrl } from "./shared";

// Content Type enum matching the database
// POST/ARTICLE = user-created articles, LINK = external/RSS content
// ARTICLE is an alias for POST (frontend uses ARTICLE, backend uses POST)
export const ContentTypeSchema = z.enum([
  "POST",
  "LINK",
  "TIL",
  "QUESTION",
  "VIDEO",
  "DISCUSSION",
  "ARTICLE", // Alias for POST
]);
export type ContentType = z.TypeOf<typeof ContentTypeSchema>;

// Get Feed Schema - unified feed with type filtering
export const GetUnifiedFeedSchema = z.object({
  limit: z.number().min(1).max(100).nullish(),
  cursor: z
    .object({
      id: z.string(),
      publishedAt: z.string().optional(),
      score: z.number().optional(),
    })
    .nullish(),
  sort: z.enum(["recent", "trending", "popular"]).default("recent"),
  type: ContentTypeSchema.nullish(), // Filter by content type
  kinds: z.array(ContentTypeSchema).nullish(), // Filter by multiple kinds (e.g. Discussions = discussion + question)
  category: z.string().nullish(),
  tag: z.string().nullish(),
  sourceId: z.number().nullish(),
  userId: z.string().nullish(), // Filter by author
  following: z.boolean().nullish(), // Only authors the current user follows
});

export type GetUnifiedFeedInput = z.TypeOf<typeof GetUnifiedFeedSchema>;

// Get Content by ID
export const GetContentByIdSchema = z.object({
  id: z.string(),
});

export type GetContentByIdInput = z.TypeOf<typeof GetContentByIdSchema>;

// Get Content by Slug
export const GetContentBySlugSchema = z.object({
  slug: z.string().min(1).max(300),
});

export type GetContentBySlugInput = z.TypeOf<typeof GetContentBySlugSchema>;

// Create Content Schema
export const CreateContentSchema = z.object({
  type: ContentTypeSchema,
  title: z.string().min(1).max(500),
  body: z.string().nullish(), // Required for ARTICLE, optional for others
  excerpt: z.string().max(300).nullish(),
  externalUrl: httpUrl().max(2000).nullish(), // Required for LINK, VIDEO
  imageUrl: z.string().url().nullish(),
  tags: z.array(z.string()).max(5).optional(),
  published: z.boolean().default(false),
  showComments: z.boolean().default(true),
  canonicalUrl: z.string().url().nullish(),
  coverImage: z.string().url().nullish(),
});

export type CreateContentInput = z.TypeOf<typeof CreateContentSchema>;

// Update Content Schema
export const UpdateContentSchema = z.object({
  id: z.string(),
  title: z.string().min(1).max(500).optional(),
  body: z.string().nullish(),
  excerpt: z.string().max(300).nullish(),
  externalUrl: httpUrl().max(2000).nullish(),
  imageUrl: z.string().url().nullish(),
  tags: z.array(z.string()).max(5).optional(),
  published: z.boolean().optional(),
  showComments: z.boolean().optional(),
  canonicalUrl: z.string().url().nullish(),
  coverImage: z.string().url().nullish(),
});

export type UpdateContentInput = z.TypeOf<typeof UpdateContentSchema>;

// Delete Content Schema
export const DeleteContentSchema = z.object({
  id: z.string(),
});

export type DeleteContentInput = z.TypeOf<typeof DeleteContentSchema>;

// Vote Schema
export const VoteContentSchema = z.object({
  contentId: z.string(),
  voteType: z.enum(["up", "down"]).nullable(), // null removes the vote
});

export type VoteContentInput = z.TypeOf<typeof VoteContentSchema>;

// Bookmark Schema
export const BookmarkContentSchema = z.object({
  contentId: z.string(),
  setBookmarked: z.boolean(),
});

export type BookmarkContentInput = z.TypeOf<typeof BookmarkContentSchema>;

// Track Click Schema
export const TrackClickContentSchema = z.object({
  contentId: z.string(),
});

export type TrackClickContentInput = z.TypeOf<typeof TrackClickContentSchema>;

// Get User's Content Schema
export const GetUserContentSchema = z.object({
  userId: z.string(),
  type: ContentTypeSchema.nullish(),
  limit: z.number().min(1).max(100).default(20),
  cursor: z
    .object({
      id: z.string(),
      publishedAt: z.string().optional(),
    })
    .nullish(),
});

export type GetUserContentInput = z.TypeOf<typeof GetUserContentSchema>;

// Get Saved Content Schema
export const GetSavedContentSchema = z.object({
  limit: z.number().min(1).max(100).default(20),
  cursor: z
    .object({
      id: z.string(),
      createdAt: z.string().optional(),
    })
    .nullish(),
});

export type GetSavedContentInput = z.TypeOf<typeof GetSavedContentSchema>;

// Edit Draft Schema - get user's own content by ID for editing
export const EditDraftContentSchema = z.object({
  id: z.string(),
});

export type EditDraftContentInput = z.TypeOf<typeof EditDraftContentSchema>;

// Publish Content Schema - separate publish action
export const PublishContentSchema = z.object({
  id: z.string(),
  published: z.boolean(),
  publishTime: z.date().optional(), // For scheduling
});

export type PublishContentInput = z.TypeOf<typeof PublishContentSchema>;

// Confirm Content Schema - validation before publishing
export const ConfirmContentSchema = z.object({
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

export type ConfirmContentInput = z.TypeOf<typeof ConfirmContentSchema>;

// My Drafts Schema
export const MyDraftsContentSchema = z.object({
  limit: z.number().min(1).max(100).default(20),
});

export type MyDraftsContentInput = z.TypeOf<typeof MyDraftsContentSchema>;

// My Published Schema
export const MyPublishedContentSchema = z.object({
  limit: z.number().min(1).max(100).default(20),
});

export type MyPublishedContentInput = z.TypeOf<typeof MyPublishedContentSchema>;

// My Scheduled Schema
export const MyScheduledContentSchema = z.object({
  limit: z.number().min(1).max(100).default(20),
});

export type MyScheduledContentInput = z.TypeOf<typeof MyScheduledContentSchema>;
