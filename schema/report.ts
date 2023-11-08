import z from "zod";

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
]);

export type ReportInput = z.TypeOf<typeof ReportSchema>;
