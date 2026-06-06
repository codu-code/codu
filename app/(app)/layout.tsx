import { getServerAuthSession } from "@/server/auth";
import React from "react";
import { db } from "@/server/db";
import { eq } from "drizzle-orm";
import { user } from "@/server/db/schema";
import { SidebarAppLayout } from "@/components/Layout/SidebarAppLayout";
import { JsonLd } from "@/components/JsonLd";
import { getOrganizationSchema } from "@/lib/structured-data";

export const metadata = {
  title: "Codú — Build and ship with AI, together",
  description:
    "Join AI builders and indie hackers learning to build with AI. Share what you ship and grow with people doing the same. Sign up free.",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
  publisher: "Codú",
  applicationName: "Codú",
  keywords: [
    "AI builders",
    "indie hackers",
    "building with AI",
    "AI engineering",
    "LLM apps",
    "AI agents",
    "RAG",
    "prompt engineering",
    "vector databases",
    "vibe coding",
    "AI coding tools",
    "ship AI products",
    "build in public",
    "SaaS",
    "MVP",
    "bootstrapping",
    "side projects",
    "startups",
    "Next.js",
    "TypeScript",
    "Python",
  ],
  metadataBase: new URL("https://www.codu.co"),
  openGraph: {
    images: "/images/og/home-og.png",
  },
};

const ALGOLIA_APP_ID = process.env.ALGOLIA_APP_ID || "";
const ALGOLIA_SEARCH_API = process.env.ALGOLIA_SEARCH_API || "";
const ALGOLIA_SOURCE_IDX = process.env.ALGOLIA_SOURCE_IDX || "";

if (!ALGOLIA_APP_ID || !ALGOLIA_SEARCH_API) {
  console.error(
    ".env values required for Algolia search (ALGOLIA_APP_ID and ALGOLIA_SEARCH_API). Visit https://www.algolia.com/ to create a free account and get your API keys.",
  );
}

if (!ALGOLIA_SOURCE_IDX) {
  console.error(
    ".env value required for Algolia source ID (ALGOLIA_SOURCE_IDX). Create an index in your Algolia account and set the value to the index name.",
  );
}

const algoliaSearchConfig = {
  ALGOLIA_APP_ID,
  ALGOLIA_SEARCH_API,
  ALGOLIA_SOURCE_IDX,
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerAuthSession();
  const userData = session?.user?.id
    ? await db.query.user.findFirst({
        where: eq(user.id, session.user.id),
        columns: { username: true },
      })
    : null;

  return (
    <>
      {/* Organization JSON-LD for site-wide SEO */}
      <JsonLd data={getOrganizationSchema()} />

      <SidebarAppLayout
        session={session}
        algoliaSearchConfig={algoliaSearchConfig}
        username={userData?.username || null}
      >
        {children}
      </SidebarAppLayout>
    </>
  );
}
