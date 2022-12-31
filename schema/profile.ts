import z from "zod";

export const saveSettingsSchema = z.object({
  name: z.string().min(1).max(50),
  bio: z.string().max(200).optional(),
  username: z.string().min(3).max(40, "Max username length is 40 characters."),
  location: z
    .string()
    .max(100, "Max location length is 100 characters.")
    .optional(),
  websiteUrl: z.string().url().optional().or(z.literal("")),
  emailNotifications: z.boolean().optional(),
  newsletter: z.boolean().optional(),
});

export const getProfileSchema = z.object({
  username: z.string(),
});

export const uploadPhotoUrlSchema = z.object({
  type: z.string(),
  size: z.number(),
});

export const updateProfilePhotoUrlSchema = z.object({
  url: z.string().url(),
});

export type saveSettingsInput = z.TypeOf<typeof saveSettingsSchema>;
