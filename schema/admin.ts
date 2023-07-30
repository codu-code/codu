import z from "zod";

export const BanUserSchema = z.object({
  userId: z.string(),
  note: z.string(),
});

export const UnbanUserSchema = z.object({
  userId: z.string(),
});
