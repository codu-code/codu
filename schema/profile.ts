import z from "zod";

export const saveSettingsSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(2, "Min name length is 2 characters.")
    .max(50, "Max name length is 50 characters."),
  surname: z
    .string()
    .trim()
    .min(2, "Min name length is 2 characters.")
    .max(50, "Max name length is 50 characters."),
  bio: z.string().max(200).optional(),
  username: z
    .string()
    .min(3)
    .max(40, "Max username length is 40 characters.")
    .regex(
      /^[a-zA-Z0-9-]+$/,
      "Username can only contain alphanumerics and dashes.",
    ),
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
