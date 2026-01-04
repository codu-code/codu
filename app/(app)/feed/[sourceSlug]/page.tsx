import { notFound } from "next/navigation";
import { db } from "@/server/db";
import { feed_source } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import type { Metadata } from "next";
import SourceProfilePage from "./_client";

type Props = {
  params: Promise<{ sourceSlug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { sourceSlug } = await params;

  const source = await db.query.feed_source.findFirst({
    where: eq(feed_source.slug, sourceSlug),
  });

  if (!source) {
    return { title: "Source Not Found" };
  }

  return {
    title: `${source.name} | Codú Feed`,
    description:
      source.description || `Articles from ${source.name} on Codú Feed`,
    openGraph: {
      title: source.name,
      description:
        source.description || `Articles from ${source.name} on Codú Feed`,
      images: source.logoUrl ? [source.logoUrl] : undefined,
    },
  };
}

export default async function Page({ params }: Props) {
  const { sourceSlug } = await params;

  // Verify source exists
  const source = await db.query.feed_source.findFirst({
    where: eq(feed_source.slug, sourceSlug),
  });

  if (!source) {
    notFound();
  }

  return <SourceProfilePage sourceSlug={sourceSlug} />;
}
