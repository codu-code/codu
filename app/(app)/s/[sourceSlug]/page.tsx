import React from "react";
import { notFound } from "next/navigation";
import { type Metadata } from "next";
import { db } from "@/server/db";
import { feed_sources } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import SourceProfileContent from "./_sourceProfileClient";

type Props = { params: Promise<{ sourceSlug: string }> };

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { sourceSlug } = await props.params;

  const source = await db.query.feed_sources.findFirst({
    where: eq(feed_sources.slug, sourceSlug),
  });

  if (!source) {
    return { title: "Publication Not Found" };
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

export default async function Page(props: Props) {
  const { sourceSlug } = await props.params;

  if (!sourceSlug) {
    notFound();
  }

  const source = await db.query.feed_sources.findFirst({
    columns: { id: true },
    where: eq(feed_sources.slug, sourceSlug),
  });

  if (!source) {
    notFound();
  }

  return <SourceProfileContent sourceSlug={sourceSlug} />;
}
