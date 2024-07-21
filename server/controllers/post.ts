import { db } from "../db";
import { post } from "@/server/db/schema";
import { desc, lte, and, isNotNull } from "drizzle-orm";

export async function getAllPosts() {
  // TODO: Obfuscate unused fields in the response
  const response = await db.query.post.findMany({
    with: {
      tags: { with: { tag: true } },
      user: true,
    },
    where: and(
      lte(post.published, new Date().toISOString()),
      isNotNull(post.published),
    ),
    orderBy: [desc(post.updatedAt), desc(post.published)],
  });

  return response;
}
