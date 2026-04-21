import { z } from "zod";

export const volunteerAreas = [
  "MARKETING",
  "EVENTS",
  "BOTH_OR_UNSURE",
] as const;

export const volunteerAreaLabels: Record<
  (typeof volunteerAreas)[number],
  string
> = {
  MARKETING: "Marketing",
  EVENTS: "Events",
  BOTH_OR_UNSURE: "Both or not sure",
};

export const volunteerCommitments = [
  "HOURS_2_4",
  "HOURS_5_10",
  "HOURS_10_PLUS",
  "FLEXIBLE",
] as const;

export const volunteerCommitmentLabels: Record<
  (typeof volunteerCommitments)[number],
  string
> = {
  HOURS_2_4: "2–4 hours",
  HOURS_5_10: "5–10 hours",
  HOURS_10_PLUS: "10+ hours",
  FLEXIBLE: "Flexible",
};

const optionalString = (max: number) =>
  z
    .string()
    .max(max, `Must be ${max} characters or less`)
    .optional()
    .or(z.literal(""));

export const VolunteerApplicationSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name must be 100 characters or less"),
  email: z
    .string()
    .email("Please enter a valid email address")
    .max(255, "Email must be 255 characters or less"),
  link: z
    .union([z.literal(""), z.string().url("Please enter a valid URL").max(500)])
    .optional(),
  location: z
    .string()
    .min(1, "Please tell us where you're based")
    .max(120, "Must be 120 characters or less"),
  area: z.enum(volunteerAreas, { error: "Please pick an area" }),
  workOn: z
    .string()
    .min(1, "Tell us what you'd like to work on")
    .max(2000, "Must be 2000 characters or less"),
  experience: optionalString(2000),
  whyCodu: z
    .string()
    .min(1, "Tell us why you want to volunteer")
    .max(2000, "Must be 2000 characters or less"),
  commitment: z.enum(volunteerCommitments, {
    error: "Please pick a time commitment",
  }),
  other: optionalString(2000),
  // Honeypot — must be empty. Bots fill every input, humans don't see this one.
  website: z.string().max(0).optional().or(z.literal("")),
});

export type VolunteerApplicationInput = z.infer<
  typeof VolunteerApplicationSchema
>;
