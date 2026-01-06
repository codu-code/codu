import { z } from "zod";

export const sponsorInterests = [
  "NEWSLETTER",
  "EVENTS",
  "WEBSITE",
  "CONTENT",
] as const;

export const sponsorInterestLabels: Record<
  (typeof sponsorInterests)[number],
  string
> = {
  NEWSLETTER: "Newsletter Advertising",
  EVENTS: "Event Sponsorship",
  WEBSITE: "Website & Job Board",
  CONTENT: "Content Collaboration",
};

export const sponsorBudgetRanges = [
  "EXPLORING",
  "UNDER_500",
  "BETWEEN_500_2000",
  "BETWEEN_2000_5000",
  "OVER_5000",
] as const;

export const sponsorBudgetLabels: Record<
  (typeof sponsorBudgetRanges)[number],
  string
> = {
  EXPLORING: "Just exploring",
  UNDER_500: "Under €500/month",
  BETWEEN_500_2000: "€500 - €2,000/month",
  BETWEEN_2000_5000: "€2,000 - €5,000/month",
  OVER_5000: "€5,000+/month",
};

export const SponsorInquirySchema = z.object({
  // Step 1: Interests (multi-select)
  interests: z
    .array(z.enum(sponsorInterests))
    .min(1, "Please select at least one option"),

  // Step 2: Budget & Goals
  budgetRange: z.enum(sponsorBudgetRanges),
  goals: z
    .string()
    .max(2000, "Goals must be 2000 characters or less")
    .optional(),

  // Step 3: Contact details
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name must be 100 characters or less"),
  email: z
    .string()
    .email("Please enter a valid email address")
    .max(255, "Email must be 255 characters or less"),
  company: z
    .string()
    .max(100, "Company name must be 100 characters or less")
    .optional(),
  phone: z.string().max(50, "Phone must be 50 characters or less").optional(),
});

export type SponsorInquiryInput = z.infer<typeof SponsorInquirySchema>;
