import z from "zod";

// Report reasons (matching database enum)
export const ReportReasonSchema = z.enum([
  "SPAM",
  "HARASSMENT",
  "HATE_SPEECH",
  "MISINFORMATION",
  "COPYRIGHT",
  "NSFW",
  "OFF_TOPIC",
  "OTHER",
]);

export type ReportReason = z.TypeOf<typeof ReportReasonSchema>;

// Legacy report schema (for backwards compatibility)
export const ReportSchema = z.discriminatedUnion("type", [
  z
    .strictObject({
      type: z.literal("post"),
      id: z.string(),
      body: z.string(),
    })
    .strict(),
  z.strictObject({
    type: z.literal("comment"),
    id: z.number().int(),
    body: z.string(),
  }),
  z.strictObject({
    type: z.literal("article"),
    id: z.number().int(),
    body: z.string(),
  }),
]);

export type ReportInput = z.TypeOf<typeof ReportSchema>;

// New unified report schema
export const CreateReportSchema = z.object({
  contentId: z.string().optional(), // For legacy content reports
  discussionId: z.number().optional(), // For discussion reports
  postId: z.string().optional(), // For post reports (posts.id is a uuid)
  reason: ReportReasonSchema,
  details: z.string().max(1000).optional(), // Optional additional details
});

export type CreateReportInput = z.TypeOf<typeof CreateReportSchema>;

// Admin: Get reports schema
export const GetReportsSchema = z.object({
  status: z.enum(["PENDING", "REVIEWED", "DISMISSED", "ACTIONED"]).optional(),
  reason: ReportReasonSchema.optional(),
  limit: z.number().min(1).max(100).default(20),
  cursor: z
    .object({
      id: z.number(),
      createdAt: z.string().optional(),
    })
    .nullish(),
});

export type GetReportsInput = z.TypeOf<typeof GetReportsSchema>;

// Admin: Review report schema
export const ReviewReportSchema = z.object({
  reportId: z.number(),
  status: z.enum(["REVIEWED", "DISMISSED", "ACTIONED"]),
  actionTaken: z.string().max(500).optional(),
});

export type ReviewReportInput = z.TypeOf<typeof ReviewReportSchema>;
