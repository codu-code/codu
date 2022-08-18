import z from "zod";

export const createPostSchema = z.object({
  body: z.string(),
  title: z.string().max(100, "Max title length is 100 characters."),
});

export const savePostSchema = z.object({
  body: z.string(),
  id: z.string(),
  title: z.string().max(100, "Max title length is 100 characters."),
});

export const publishPostSchema = z.object({
  id: z.string(),
  published: z.boolean(),
});

export const ConfirmPostSchema = z.object({
  body: z.string().min(50, "Content is too short. Minimum of 50 characters."),
  excerpt: z.string().min(4, "Excerpt too short. Minimum of 4 characters."),
  id: z.string(),
  published: z.boolean(),
  title: z
    .string()
    .max(100, "Max title length is 100 characters.")
    .min(4, "Title is too short. Minimum of 4 characters."),
});

export const DeletePostSchema = z.object({
  id: z.string(),
});

export const GetPostsSchema = z.object({
  userId: z.string().optional(),
});

export type SavePostInput = z.TypeOf<typeof savePostSchema>;

export const getSinglePostSchema = z.object({
  id: z.string(),
});
