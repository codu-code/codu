import z from "zod";

export const CreatePostSchema = z.object({
  body: z.string().trim(),
  title: z.string().trim().max(100, "Max title length is 100 characters."),
});

export const LikePostSchema = z.object({
  postId: z.string(),
  setLiked: z.boolean(),
});

export const BookmarkPostSchema = z.object({
  postId: z.string(),
  setBookmarked: z.boolean(),
});

export const SavePostSchema = z.object({
  body: z.string().trim(),
  id: z.string(),
  title: z.string().trim().max(100, "Max title length is 100 characters."),
  excerpt: z.optional(
    z.string().trim().max(156, "Max length is 156 characters."),
  ),
  canonicalUrl: z.optional(z.string().trim().url()),
  tags: z.string().array().max(5).optional(),
  showComments: z.boolean().optional(),
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
  limit: z.number().min(1).max(100).nullish(),
  cursor: z.string().nullish(),
  sort: z.enum(["newest", "oldest", "top"]),
  tag: z.string().nullish(),
  searchTerm: z.string().nullish(),
});

export type SavePostInput = z.TypeOf<typeof SavePostSchema>;
export type ConfirmPostInput = z.TypeOf<typeof ConfirmPostSchema>;

export const GetSinglePostSchema = z.object({
  slug: z.string(),
});

export const GetByIdSchema = z.object({
  id: z.string(),
});
