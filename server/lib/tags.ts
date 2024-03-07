import db from "@/server/db/client";
import * as Sentry from "@sentry/nextjs";
import "server-only";
import { z } from "zod";

export const GetTagsSchema = z.object({
  take: z.number(),
});

type GetTags = z.infer<typeof GetTagsSchema>;

export async function GetTags({ take }: GetTags) {
  try {
    GetTagsSchema.parse({ take });

    const response = await db.tag.findMany({
      orderBy: {
        PostTag: {
          _count: "desc",
        },
      },
      take: take,
    });

    if (!response) {
      return null;
    }

    return response;
  } catch (error) {
    Sentry.captureException(error);
    throw new Error("Error fetching tags");
  }
}
