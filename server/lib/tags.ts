import * as Sentry from "@sentry/nextjs";
import "server-only";
import { z } from "zod";
import { db } from "../db";
import { post_tag, tag } from "../db/schema";
import { count, desc, eq } from "drizzle-orm";

export const GetTagsSchema = z.object({
  take: z.number(),
});

export async function GetTags({ take }: z.infer<typeof GetTagsSchema>) {
  try {
    GetTagsSchema.parse({ take });

    const response = await db
      .select({
        title: tag.title,
        count: count(tag.title),
      })
      .from(tag)
      .groupBy(tag.title)
      .leftJoin(post_tag, eq(post_tag.tagId, tag.id))
      .limit(take)
      .orderBy(desc(count(tag.title)));

    if (!response) {
      return null;
    }

    return response;
  } catch (error) {
    Sentry.captureException(error);
    throw new Error("Error fetching tags");
  }
}
