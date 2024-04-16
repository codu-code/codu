import z from "zod";

export const getEventsSchema = z.object({
  limit: z.number().min(1).max(100).nullish(),
  cursor: z.string().nullish(),
  filter: z.string().nullish(),
});

export const createEventSchema = z.object({
  body: z.string().trim(),
  title: z.string().trim().max(100, "Max title length is 100 characters."),
});

export const upsertEventSchema = z.object({
  id: z.string().nullish(),
  communityId: z.string(),
  name: z.string().trim().max(100, "Max title length is 100 characters."),
  address: z.string().trim().max(200, "Max title length is 100 characters."),
  eventDate: z.string(),
  capacity: z.number(),
  description: z.string().trim(),
  coverImage: z.string().url(),
});

export type upsertEventInput = z.TypeOf<typeof upsertEventSchema>;

export const deleteEventSchema = z.object({
  id: z.string(),
});

export const uploadPhotoUrlSchema = z.object({
  type: z.string(),
  size: z.number(),
});
