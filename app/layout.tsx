import { headers } from "next/headers";
import { SITE_ORIGIN } from "@/config/site";
import { getServerAuthSession } from "@/server/auth";
import "@/styles/globals.css";
import Fathom from "@/components/Fathom/Fathom";
import A11yProvider from "@/components/A11yProvider/A11yProvider";
import { Toaster } from "sonner";
import { CSPostHogProvider } from "./providers";
import PostHogPageView from "@/components/PageViews/PageViews";

import ThemeProvider from "@/components/Theme/ThemeProvider";
import { TRPCReactProvider } from "@/server/trpc/react";
import AuthProvider from "@/context/AuthProvider";
import ProgressBar from "@/components/ProgressBar/ProgressBar";
import { PromptProvider } from "@/components/PromptService";
import { ReportModalProvider } from "@/components/ReportModal/ReportModal";
import { Suspense } from "react";
import {
  Bricolage_Grotesque,
  Hanken_Grotesk,
  JetBrains_Mono,
} from "next/font/google";

// Relaunch type system: characterful display, clean body, mono for labels/code.
const fontDisplay = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});
const fontSans = Hanken_Grotesk({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});
const fontMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

// @TODO layout app in way that doesn't need to use client session check
export const metadata = {
  title: "Codú — The community for AI builders & indie hackers",
  description:
    "Codú is the community for AI builders and indie hackers. Learn to build with AI, share what you ship, and grow with people doing the same.",
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
  metadataBase: new URL(SITE_ORIGIN),
  openGraph: {
    title: "Codú — The community for AI builders & indie hackers",
    description:
      "Codú is the community for AI builders and indie hackers. Learn to build with AI, share what you ship, and grow with people doing the same.",
    url: SITE_ORIGIN,
    siteName: "Codú",
    images: [
      {
        url: `${SITE_ORIGIN}/images/og/home-og.png`,
        width: 1200,
        height: 630,
        alt: "Codú — the community for AI builders & indie hackers",
      },
    ],
    locale: "en_US",
    type: "website",
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Serialize headers for client component
  const headersList = await headers();
  const headersObject: Record<string, string> = {};
  headersList.forEach((value, key) => {
    headersObject[key] = value;
  });

  // Request-deduped (React cache) — the app layout/pages reuse this lookup.
  const session = await getServerAuthSession();

  return (
    <html
      lang="en"
      className={`dark h-full ${fontDisplay.variable} ${fontSans.variable} ${fontMono.variable}`}
      suppressHydrationWarning
    >
      <link
        rel="alternate"
        type="application/rss+xml"
        href="/feed.xml"
        title="RSS Feed"
      />
      <Fathom />
      <CSPostHogProvider>
        <body className="h-full">
          <PostHogPageView />
          <A11yProvider>
            <ProgressBar />
            <AuthProvider session={session}>
              <ThemeProvider>
                <Toaster />
                <TRPCReactProvider headers={headersObject}>
                  <PromptProvider>
                    {children}
                    <Suspense fallback={null}>
                      <ReportModalProvider />
                    </Suspense>
                  </PromptProvider>
                </TRPCReactProvider>
              </ThemeProvider>
            </AuthProvider>
          </A11yProvider>
        </body>
      </CSPostHogProvider>
    </html>
  );
}
