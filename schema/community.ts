import z from "zod";

export const getCommunitySchema = z.object({
  limit: z.number().min(1).max(100).nullish(),
  cursor: z.string().nullish(),
  filter: z.string().nullish(),
});

export const upsertCommunitySchema = z.object({
  id: z.string().nullish(),
  name: z.string().trim().max(100, "Max title length is 100 characters."),
  country: z.string().trim().max(100, "Max title length is 100 characters."),
  city: z.string().trim().max(100, "Max title length is 100 characters."),
  excerpt: z.string().trim().max(156, "Max length is 156 characters."),
  description: z.string().trim(),
  coverImage: z.string().url(),
});

export type upsertCommunityInput = z.TypeOf<typeof upsertCommunitySchema>;

export const deleteCommunitySchema = z.object({
  id: z.string(),
});

export const uploadPhotoUrlSchema = z.object({
  type: z.string(),
  size: z.number(),
});
