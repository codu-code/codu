import { headers } from "next/headers";
import ThemeProvider from "@/components/Theme/ThemeProvider";
import { TRPCReactProvider } from "@/server/trpc/react";
import Footer from "@/components/Footer/Footer";
import Nav from "@/components/Nav/Nav";
import { getServerAuthSession } from "@/server/auth";
import AuthProvider from "@/context/AuthProvider";
import ProgressBar from "@/components/ProgressBar/ProgressBar";
import React from "react";
import { PromptProvider } from "@/components/PromptService";
import { db } from "@/server/db";
import { eq } from "drizzle-orm";
import { user } from "@/server/db/schema";

export const metadata = {
  title: "Codú - Join Our Web Developer Community",
  description:
    "Connect with fellow web developers, learn new skills, and grow together in the supportive Codú community. Sign up now for free!",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
  publisher: "Codú",
  applicationName: "Codú",
  keywords: [
    "programming",
    "frontend",
    "community",
    "learn",
    "programmer",
    "article",
    "Python",
    "JavaScript",
    "AWS",
    "HTML",
    "CSS",
    "Tailwind",
    "React",
    "Angular",
    "backend",
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
      <Nav
        session={session}
        algoliaSearchConfig={algoliaSearchConfig}
        username={userData?.username || null}
      />
      {children}
      <Footer />
    </>
  );
}
