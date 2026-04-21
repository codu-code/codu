import { z } from "zod";

export const talkLengths = [
  "LIGHTNING_5",
  "STANDARD_20",
  "LONG_30",
  "FLEXIBLE",
] as const;

export const talkLengthLabels: Record<(typeof talkLengths)[number], string> = {
  LIGHTNING_5: "Lightning (5 min)",
  STANDARD_20: "Standard (20 min)",
  LONG_30: "Long (30 min)",
  FLEXIBLE: "Flexible",
};

export const speakerFormats = [
  "IN_PERSON_DUBLIN",
  "REMOTE",
  "EITHER",
] as const;

export const speakerFormatLabels: Record<
  (typeof speakerFormats)[number],
  string
> = {
  IN_PERSON_DUBLIN: "In person (Dublin)",
  REMOTE: "Remote",
  EITHER: "Either",
};

export const speakerExperiences = [
  "FIRST_TIME",
  "A_FEW",
  "EXPERIENCED",
] as const;

export const speakerExperienceLabels: Record<
  (typeof speakerExperiences)[number],
  string
> = {
  FIRST_TIME: "First time — would love support",
  A_FEW: "A few talks under my belt",
  EXPERIENCED: "Experienced speaker",
};

const optionalString = (max: number) =>
  z
    .string()
    .max(max, `Must be ${max} characters or less`)
    .optional()
    .or(z.literal(""));

export const TalkSchema = z.object({
  title: z
    .string()
    .min(1, "Talk title is required")
    .max(200, "Title must be 200 characters or less"),
  length: z.enum(talkLengths, { error: "Pick a length" }),
  abstract: z
    .string()
    .min(1, "Give us a short abstract")
    .max(2000, "Abstract must be 2000 characters or less"),
});

export type TalkInput = z.infer<typeof TalkSchema>;

export const SpeakerApplicationSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name must be 100 characters or less"),
  email: z
    .string()
    .email("Please enter a valid email address")
    .max(255, "Email must be 255 characters or less"),
  link: z
    .union([
      z.literal(""),
      z.string().url("Please enter a valid URL").max(500),
    ])
    .optional(),
  location: z
    .string()
    .min(1, "Please tell us where you're based")
    .max(120, "Must be 120 characters or less"),
  bio: z
    .string()
    .min(1, "A short bio helps us introduce you")
    .max(1000, "Bio must be 1000 characters or less"),
  format: z.enum(speakerFormats, { error: "Pick a format" }),
  talks: z
    .array(TalkSchema)
    .min(1, "Pitch at least one talk")
    .max(3, "Max 3 talks per submission"),
  experience: z
    .enum(speakerExperiences)
    .optional()
    .or(z.literal("").transform(() => undefined)),
  other: optionalString(2000),
  // Honeypot — must be empty
  website: z.string().max(0).optional().or(z.literal("")),
});

export type SpeakerApplicationInput = z.infer<typeof SpeakerApplicationSchema>;
