import z from "zod";

export const emailTokenReqSchema = z.object({
  newEmail: z.string().email(),
});

export const TokenSchema = z.object({
  id: z.string().uuid(),
  userId: z.string(),
  token: z.string(),
  createdAt: z.date().default(() => new Date()),
  expiresAt: z.date(),
});

export type TokenInput = z.TypeOf<typeof TokenSchema>;
