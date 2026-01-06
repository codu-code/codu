import { notFound } from "next/navigation";
import { db } from "@/server/db";
import { posts, feed_sources } from "@/server/db/schema";
import { eq, and } from "drizzle-orm";
import type { Metadata } from "next";
import FeedArticlePage from "./_client";

type Props = {
  params: Promise<{ sourceSlug: string; shortId: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { sourceSlug, shortId } = await params;

  // Find the source by slug
  const source = await db.query.feed_sources.findFirst({
    where: eq(feed_sources.slug, sourceSlug),
  });

  if (!source) {
    return { title: "Post Not Found" };
  }

  // Find the post by slug (shortId is part of the slug) and sourceId
  const post = await db.query.posts.findFirst({
    where: and(eq(posts.sourceId, source.id), eq(posts.type, "link")),
    with: {
      source: true,
    },
  });

  if (!post) {
    return { title: "Post Not Found" };
  }

  return {
    title: `${post.title} | Codú Feed`,
    description: post.excerpt || `Discussion about ${post.title}`,
    openGraph: {
      title: post.title,
      description: post.excerpt || `Discussion about ${post.title}`,
      images: post.coverImage ? [post.coverImage] : undefined,
    },
  };
}

export default async function Page({ params }: Props) {
  const { sourceSlug, shortId } = await params;

  // Verify source exists
  const source = await db.query.feed_sources.findFirst({
    where: eq(feed_sources.slug, sourceSlug),
  });

  if (!source) {
    notFound();
  }

  // Verify post exists - the shortId is part of the slug
  const post = await db.query.posts.findFirst({
    where: and(eq(posts.sourceId, source.id), eq(posts.type, "link")),
  });

  if (!post) {
    notFound();
  }

  return <FeedArticlePage sourceSlug={sourceSlug} shortId={shortId} />;
}
