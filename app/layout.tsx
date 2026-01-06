import { headers } from "next/headers";
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

// @TODO layout app in way that doesn't need to use client session check
export const metadata = {
  title: "Codú - The Web Developer Community",
  description:
    "A free network and community for web developers. Learn and grow together.",
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
    title: "Codú - The Web Developer Community",
    description:
      "A free network and community for web developers. Learn and grow together.",
    url: "https://www.codu.co",
    siteName: "Codú",
    images: [
      {
        url: "https://www.codu.co/images/og/home-og.png",
        width: 1200,
        height: 630,
        alt: "Codú Community",
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

  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
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
            <AuthProvider>
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
