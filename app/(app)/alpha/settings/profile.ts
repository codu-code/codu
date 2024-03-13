import z from "zod";

export const saveSettingsSchema = z.object({
  name: z.string().min(1).max(50),
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

export const saveSettingsFormOneSchema = z.object({
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
  username: z
    .string()
    .trim()
    .min(3, "Min username length is 3 characters.")
    .max(40, "Max username length is 40 characters.")
    .regex(
      /^[a-zA-Z0-9-]+$/,
      "Username can only contain alphanumerics and dashes.",
    ),
  location: z.string().min(1, "Location is required"),
  bio: z.string().max(200).optional(),
  websiteUrl: z.string().url().optional().or(z.literal("")),
  emailNotifications: z.boolean().optional(),
  newsletter: z.boolean().optional(),
});

export const saveSettingsFormTwoSchema = z.object({
  gender: z.string().min(1, "Gender is required"),
  dateOfBirth: z.date(),
  employmentStatus: z
    .object({
      professionalOrStudent: z.string().min(1, "Select an option"),
      workplace: z.string().max(30, "Max length is 30 characters."),
      jobTitle: z.string().max(30, "Max length is 30 characters."),
      levelOfStudy: z.string(),
      course: z.string().max(30, "Max name length is 30 characters."),
    })
    .superRefine((val, ctx) => {
      if (
        val.professionalOrStudent === "Current student" &&
        val.levelOfStudy === ""
      ) {
        ctx.addIssue({
          path: ["levelOfStudy"],
          code: "custom",
          message: "required",
        });
      }
      if (
        val.professionalOrStudent === "Current student" &&
        val.course === ""
      ) {
        ctx.addIssue({
          path: ["course"],
          code: "custom",
          message: "required",
        });
      }
      if (
        val.professionalOrStudent === "Working professional" &&
        val.workplace === ""
      ) {
        ctx.addIssue({
          path: ["workplace"],
          code: "custom",
          message: "required",
        });
      }
      if (
        val.professionalOrStudent === "Working professional" &&
        val.jobTitle === ""
      ) {
        ctx.addIssue({
          path: ["jobTitle"],
          code: "custom",
          message: "required",
        });
      }
    }),
});

export type saveSettingsFormOneInput = z.TypeOf<
  typeof saveSettingsFormOneSchema
>;

export type saveSettingsFormTwoInput = z.TypeOf<
  typeof saveSettingsFormTwoSchema
>;
