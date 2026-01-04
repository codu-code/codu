import z from "zod";

// Content Type enum matching the database
export const ContentTypeSchema = z.enum([
  "ARTICLE",
  "LINK",
  "QUESTION",
  "VIDEO",
  "DISCUSSION",
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
  category: z.string().nullish(),
  tag: z.string().nullish(),
  sourceId: z.number().nullish(),
  userId: z.string().nullish(), // Filter by author
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
  externalUrl: z.string().url().max(2000).nullish(), // Required for LINK, VIDEO
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
  externalUrl: z.string().url().max(2000).nullish(),
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
  voteType: z.enum(["UP", "DOWN"]).nullable(), // null removes the vote
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
