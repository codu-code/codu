import { getServerAuthSession } from "@/server/auth";
import React from "react";
import { db } from "@/server/db";
import { eq } from "drizzle-orm";
import { user } from "@/server/db/schema";
import { AppShell } from "@/components/Layout/AppShell";
import { JsonLd } from "@/components/JsonLd";
import { getOrganizationSchema } from "@/lib/structured-data";
import { recordDailyActivity, ensureReferral } from "@/server/lib/engagement";

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

  // Roll the daily-activity streak forward + ensure/attribute referral
  // (both idempotent, never throw).
  if (session?.user?.id) {
    await recordDailyActivity(session.user.id);
    await ensureReferral(session.user.id);
  }

  return (
    <>
      {/* Organization JSON-LD for site-wide SEO */}
      <JsonLd data={getOrganizationSchema()} />

      <AppShell session={session} username={userData?.username || null}>
        {children}
      </AppShell>
    </>
  );
}
