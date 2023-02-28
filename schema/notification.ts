import z from "zod";

export const DeleteNotificationSchema = z.object({
  id: z.number(),
});

export const GetNotificationsSchema = z.object({
  limit: z.number().min(1).max(100).nullish(),
  cursor: z.number().nullish(),
});
