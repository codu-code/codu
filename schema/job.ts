import z from "zod";

export const saveJobsSchema = z.object({
  companyName: z
    .string()
    .min(1, "Company name should contain atleast 1 character")
    .max(50, "Company name should contain atmost 50 characters"),
  jobTitle: z
    .string()
    .min(3, "Job title should contain atleast 3 character")
    .max(50, "Job title should contain atmost 50 characters"),
  jobDescription: z
    .string()
    .min(100, "Job Description should contain atleast 100 characters")
    .max(2000, "Job Description should contain atmost 2000 characters")
    .optional(),
  jobLocation: z
    .string()
    .min(3, "Location should contain atleast 3 characters")
    .max(40, "Max location length is 40 characters."),
  applicationUrl: z
    .string()
    .url("Provide a valid url")
    .optional()
    .or(z.literal("")),
  companyLogo: z.string().optional(),
  remote: z.boolean().optional().default(false),
  relocation: z.boolean().optional().default(false),
  visa_sponsorship: z.boolean().optional().default(false),
  jobType: z.enum(["full-time", "part-time", "freelancer", "other"]),
  aiNative: z.boolean().optional().default(false),
  tags: z.array(z.string().max(30)).max(8).optional().default([]),
});

export type saveJobsInput = z.TypeOf<typeof saveJobsSchema>;

export const GetJobsSchema = z.object({
  limit: z.number().min(1).max(50).nullish(),
  cursor: z
    .object({ id: z.string().uuid(), publishedAt: z.string().optional() })
    .nullish(),
  remote: z.boolean().nullish(),
  jobType: z.enum(["full-time", "part-time", "freelancer", "other"]).nullish(),
  aiNative: z.boolean().nullish(),
  tag: z.string().nullish(),
});
export type GetJobsInput = z.TypeOf<typeof GetJobsSchema>;

export const GetJobBySlugSchema = z.object({
  slug: z.string().min(1).max(300),
});

export const GetJobByIdSchema = z.object({ id: z.string().uuid() });

export const ModerateJobSchema = z.object({
  id: z.string().uuid(),
  action: z.enum(["approve", "reject"]),
  rejectionReason: z.string().max(500).optional(),
});

export const FeatureJobSchema = z.object({
  id: z.string().uuid(),
  featured: z.boolean(),
});
