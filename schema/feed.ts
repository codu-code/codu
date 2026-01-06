import z from "zod";

// Vote type for feed (lowercase to match new schema)
export const FeedVoteTypeSchema = z.enum(["up", "down"]);

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

// Vote on Article Schema
export const VoteArticleSchema = z.object({
  articleId: z.string(),
  voteType: FeedVoteTypeSchema.nullable(), // null to remove vote
});

export type VoteArticleInput = z.TypeOf<typeof VoteArticleSchema>;

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

// Get Article by ID Schema
export const GetArticleByIdSchema = z.object({
  id: z.string(),
});

export type GetArticleByIdInput = z.TypeOf<typeof GetArticleByIdSchema>;

// Get Article by Slug Schema
export const GetArticleBySlugSchema = z.object({
  slug: z.string().min(1).max(350),
});

export type GetArticleBySlugInput = z.TypeOf<typeof GetArticleBySlugSchema>;

// Get Article by Source Slug and ShortId Schema (Reddit-style URLs)
export const GetArticleBySlugAndShortIdSchema = z.object({
  sourceSlug: z.string().min(1).max(100),
  shortId: z.string().min(1).max(20),
});

export type GetArticleBySlugAndShortIdInput = z.TypeOf<
  typeof GetArticleBySlugAndShortIdSchema
>;

// Get Articles by Source Schema
export const GetArticlesBySourceSchema = z.object({
  sourceSlug: z.string().min(1).max(100),
  limit: z.number().min(1).max(100).optional(),
  cursor: z
    .object({
      id: z.string(),
      publishedAt: z.string().optional(),
    })
    .nullish(),
  sort: z.enum(["recent", "trending", "popular"]).default("recent"),
});

export type GetArticlesBySourceInput = z.TypeOf<
  typeof GetArticlesBySourceSchema
>;

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

// Get Sources Schema
export const GetSourcesSchema = z.object({
  status: z.enum(["ACTIVE", "PAUSED", "ERROR"]).optional(),
  category: z.string().optional(),
});

export type GetSourcesInput = z.TypeOf<typeof GetSourcesSchema>;

// Delete Source Schema
export const DeleteFeedSourceSchema = z.object({
  id: z.number(),
});

export type DeleteFeedSourceInput = z.TypeOf<typeof DeleteFeedSourceSchema>;

// Get Source Profile by Slug
export const GetSourceBySlugSchema = z.object({
  slug: z.string().min(1).max(100),
});

export type GetSourceBySlugInput = z.TypeOf<typeof GetSourceBySlugSchema>;

// Get Content by Source Slug and Content Slug (for LINK type content)
export const GetLinkContentBySourceAndSlugSchema = z.object({
  sourceSlug: z.string().min(1).max(100),
  contentSlug: z.string().min(1).max(350),
});

export type GetLinkContentBySourceAndSlugInput = z.TypeOf<
  typeof GetLinkContentBySourceAndSlugSchema
>;
