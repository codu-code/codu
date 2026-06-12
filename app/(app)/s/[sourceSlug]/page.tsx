import React from "react";
import { notFound } from "next/navigation";
import { type Metadata } from "next";
import { getSourceProfile } from "./_resolvers";
import SourceProfileContent from "./_sourceProfileClient";

type Props = { params: Promise<{ sourceSlug: string }> };

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { sourceSlug } = await props.params;

  const source = await getSourceProfile(sourceSlug);

  if (!source) {
    return { title: "Publication Not Found" };
  }

  return {
    title: `${source.name} | Codú Feed`,
    description:
      source.tagline || `Articles from ${source.name} on Codú Feed`,
    alternates: { canonical: `/s/${source.slug}` },
    openGraph: {
      title: source.name,
      description:
        source.tagline || `Articles from ${source.name} on Codú Feed`,
      images: source.logoUrl ? [source.logoUrl] : undefined,
    },
  };
}

export default async function Page(props: Props) {
  const { sourceSlug } = await props.params;

  if (!sourceSlug) {
    notFound();
  }

  // Resolved once per request (React cache) and shared with generateMetadata.
  // Passing it down as initialData means the profile header and first page of
  // articles are in the server-rendered HTML for crawlers that don't run JS.
  const profile = await getSourceProfile(sourceSlug);

  if (!profile) {
    notFound();
  }

  return (
    <SourceProfileContent sourceSlug={sourceSlug} initialProfile={profile} />
  );
}
