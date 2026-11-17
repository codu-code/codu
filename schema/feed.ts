import z from "zod";

// Get Feed Schema (for RSS aggregated content)
export const GetFeedSchema = z.object({
  limit: z.number().min(1).max(100).optional(),
  cursor: z
    .object({
      id: z.string(),
      publishedAt: z.string().optional(),
      score: z.number().optional(),
    })
    .nullish(),
  sort: z.enum(["recent", "trending", "popular"]).default("recent"),
  sourceId: z.number().optional(),
  category: z.string().optional(),
});

export type GetFeedInput = z.TypeOf<typeof GetFeedSchema>;

// Bookmark Article Schema
export const BookmarkArticleSchema = z.object({
  articleId: z.string(),
  setBookmarked: z.boolean(),
});

export type BookmarkArticleInput = z.TypeOf<typeof BookmarkArticleSchema>;

// Track Click Schema
export const TrackClickSchema = z.object({
  articleId: z.string(),
});

export type TrackClickInput = z.TypeOf<typeof TrackClickSchema>;

// Get Article by Slug Schema
export const GetArticleBySlugSchema = z.object({
  slug: z.string().min(1).max(350),
});

export type GetArticleBySlugInput = z.TypeOf<typeof GetArticleBySlugSchema>;

// Get Article by Source and Article Slug
export const GetArticleBySourceAndArticleSlugSchema = z.object({
  sourceSlug: z.string().min(1).max(100),
  articleSlug: z.string().min(1).max(350),
});

export type GetArticleBySourceAndArticleSlugInput = z.TypeOf<
  typeof GetArticleBySourceAndArticleSlugSchema
>;

// Feed Source Schemas (RSS source management)
export const CreateFeedSourceSchema = z.object({
  name: z.string().min(1).max(100),
  url: z.string().url(),
  websiteUrl: z.string().url().optional(),
  logoUrl: z.string().url().optional(),
  category: z.string().max(50).optional(),
  description: z.string().max(500).optional(),
});

export type CreateFeedSourceInput = z.TypeOf<typeof CreateFeedSourceSchema>;

export const UpdateFeedSourceSchema = z.object({
  id: z.number(),
  name: z.string().min(1).max(100).optional(),
  status: z.enum(["ACTIVE", "PAUSED", "ERROR"]).optional(),
  category: z.string().max(50).optional(),
  logoUrl: z.string().url().optional(),
  websiteUrl: z.string().url().optional(),
  description: z.string().max(500).optional(),
});

export type UpdateFeedSourceInput = z.TypeOf<typeof UpdateFeedSourceSchema>;

// Delete Source Schema
export const DeleteFeedSourceSchema = z.object({
  id: z.number(),
});

export type DeleteFeedSourceInput = z.TypeOf<typeof DeleteFeedSourceSchema>;
