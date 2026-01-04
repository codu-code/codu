import { notFound } from "next/navigation";
import { db } from "@/server/db";
import { aggregated_article, feed_source } from "@/server/db/schema";
import { eq, and } from "drizzle-orm";
import type { Metadata } from "next";
import FeedArticlePage from "./_client";

type Props = {
  params: Promise<{ sourceSlug: string; shortId: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { sourceSlug, shortId } = await params;

  // Find the source by slug
  const source = await db.query.feed_source.findFirst({
    where: eq(feed_source.slug, sourceSlug),
  });

  if (!source) {
    return { title: "Article Not Found" };
  }

  // Find the article by shortId and sourceId
  const article = await db.query.aggregated_article.findFirst({
    where: and(
      eq(aggregated_article.shortId, shortId),
      eq(aggregated_article.sourceId, source.id),
    ),
    with: {
      source: true,
    },
  });

  if (!article) {
    return { title: "Article Not Found" };
  }

  return {
    title: `${article.title} | Codú Feed`,
    description: article.excerpt || `Discussion about ${article.title}`,
    openGraph: {
      title: article.title,
      description: article.excerpt || `Discussion about ${article.title}`,
      images: article.ogImageUrl || article.imageUrl ? [article.ogImageUrl || article.imageUrl!] : undefined,
    },
  };
}

export default async function Page({ params }: Props) {
  const { sourceSlug, shortId } = await params;

  // Verify source exists
  const source = await db.query.feed_source.findFirst({
    where: eq(feed_source.slug, sourceSlug),
  });

  if (!source) {
    notFound();
  }

  // Verify article exists
  const article = await db.query.aggregated_article.findFirst({
    where: and(
      eq(aggregated_article.shortId, shortId),
      eq(aggregated_article.sourceId, source.id),
    ),
  });

  if (!article) {
    notFound();
  }

  return <FeedArticlePage sourceSlug={sourceSlug} shortId={shortId} />;
}
