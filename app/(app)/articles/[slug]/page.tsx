import { permanentRedirect, notFound } from "next/navigation";
import { db } from "@/server/db";
import { post, user } from "@/server/db/schema";
import { eq } from "drizzle-orm";

type Props = { params: Promise<{ slug: string }> };

// This page exists only to redirect from legacy /articles/[slug] URLs to the new /[username]/[slug] pattern
export default async function ArticlePage(props: Props) {
  const params = await props.params;
  const { slug } = params;

  const postRecord = await db
    .select({
      slug: post.slug,
      username: user.username,
    })
    .from(post)
    .leftJoin(user, eq(post.userId, user.id))
    .where(eq(post.slug, slug))
    .limit(1);

  if (!postRecord.length || !postRecord[0].username) {
    return notFound();
  }

  const { username } = postRecord[0];

  // Permanent redirect (308) to the new URL pattern
  permanentRedirect(`/${username}/${slug}`);
}
