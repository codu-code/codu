import z from "zod";

// Feed Query Schema
export const GetFeedSchema = z.object({
  limit: z.number().min(1).max(100).nullish(),
  cursor: z
    .object({
      id: z.number(),
      publishedAt: z.string().optional(),
      score: z.number().optional(),
    })
    .nullish(),
  sort: z.enum(["recent", "trending", "popular"]),
  category: z.string().nullish(),
  tag: z.string().nullish(),
  sourceId: z.number().nullish(),
  includeCommunity: z.boolean().default(true),
});

export type GetFeedInput = z.TypeOf<typeof GetFeedSchema>;

// Vote Schema
export const VoteArticleSchema = z.object({
  articleId: z.number(),
  voteType: z.enum(["UP", "DOWN"]).nullable(),
});

export type VoteArticleInput = z.TypeOf<typeof VoteArticleSchema>;

// Bookmark Schema
export const BookmarkArticleSchema = z.object({
  articleId: z.number(),
  setBookmarked: z.boolean(),
});

export type BookmarkArticleInput = z.TypeOf<typeof BookmarkArticleSchema>;

// Track Click Schema
export const TrackClickSchema = z.object({
  articleId: z.number(),
});

export type TrackClickInput = z.TypeOf<typeof TrackClickSchema>;

// Get Article by ID Schema
export const GetArticleByIdSchema = z.object({
  id: z.number(),
});

// Feed Source Schemas
export const CreateFeedSourceSchema = z.object({
  name: z.string().min(1).max(100),
  url: z.string().url(),
  websiteUrl: z.string().url().optional(),
  logoUrl: z.string().url().optional(),
  category: z.string().max(50).optional(),
});

export type CreateFeedSourceInput = z.TypeOf<typeof CreateFeedSourceSchema>;

export const UpdateFeedSourceSchema = z.object({
  id: z.number(),
  name: z.string().min(1).max(100).optional(),
  status: z.enum(["ACTIVE", "PAUSED", "ERROR"]).optional(),
  category: z.string().max(50).optional(),
  logoUrl: z.string().url().optional(),
  websiteUrl: z.string().url().optional(),
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

// Get Article by Slug and ShortId (Reddit-style URL)
export const GetArticleBySlugSchema = z.object({
  sourceSlug: z.string().min(1).max(100),
  shortId: z.string().min(1).max(7),
});

export type GetArticleBySlugInput = z.TypeOf<typeof GetArticleBySlugSchema>;

// Get Source Profile by Slug
export const GetSourceBySlugSchema = z.object({
  slug: z.string().min(1).max(100),
});

export type GetSourceBySlugInput = z.TypeOf<typeof GetSourceBySlugSchema>;

// Get Articles by Source (paginated)
export const GetArticlesBySourceSchema = z.object({
  sourceSlug: z.string().min(1).max(100),
  limit: z.number().min(1).max(100).default(20),
  cursor: z
    .object({
      id: z.number(),
      publishedAt: z.string().optional(),
    })
    .nullish(),
  sort: z.enum(["recent", "trending", "popular"]).default("recent"),
});

export type GetArticlesBySourceInput = z.TypeOf<
  typeof GetArticlesBySourceSchema
>;
