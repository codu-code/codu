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
  remote: z.boolean().optional().default(false),
  relocation: z.boolean().optional().default(false),
  visa_sponsership: z.boolean().optional().default(false),
  jobType: z.enum(["full-time", "part-time", "freelancer", "other"]),
});

export type saveJobsInput = z.TypeOf<typeof saveJobsSchema>;
