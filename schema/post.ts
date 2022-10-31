import z from "zod";

export const CreatePostSchema = z.object({
  body: z.string().trim(),
  title: z.string().trim().max(100, "Max title length is 100 characters."),
});

export const SavePostSchema = z.object({
  body: z.string().trim(),
  id: z.string(),
  title: z.string().trim().max(100, "Max title length is 100 characters."),
  excerpt: z
    .string()
    .trim()
    .max(156, "Max length is 156 characters.")
    .optional(),
  canonicalUrl: z.string().trim().url().or(z.string().length(0)).optional(),
  tags: z.string().array().max(5).optional(),
});

export const PublishPostSchema = z.object({
  id: z.string(),
  published: z.boolean(),
});

export const ConfirmPostSchema = z.object({
  body: z
    .string()
    .trim()
    .min(50, "Content is too short. Minimum of 50 characters."),
  title: z
    .string()
    .trim()
    .max(100, "Max title length is 100 characters.")
    .min(10, "Title is too short. Minimum of 10 characters."),
  excerpt: z
    .string()
    .trim()
    .max(156, "Max length is 156 characters.")
    .optional(),
  canonicalUrl: z.string().trim().url().optional(),
  tags: z.string().array().max(5).optional(),
});

export const DeletePostSchema = z.object({
  id: z.string(),
});

export const GetPostsSchema = z.object({
  userId: z.string().optional(),
});

export type SavePostInput = z.TypeOf<typeof SavePostSchema>;
export type ConfirmPostInput = z.TypeOf<typeof ConfirmPostSchema>;

export const GetSinglePostSchema = z.object({
  id: z.string(),
});
