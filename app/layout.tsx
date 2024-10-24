import { headers } from "next/headers";
import "@/styles/globals.css";
import Fathom from "@/components/Fathom/Fathom";
import A11yProvider from "@/components/A11yProvider/A11yProvider";
import { Toaster } from "sonner";
import { CSPostHogProvider } from "./providers";
import dynamic from "next/dynamic";

import ThemeProvider from "@/components/Theme/ThemeProvider";
import { TRPCReactProvider } from "@/server/trpc/react";
import AuthProvider from "@/context/AuthProvider";
import ProgressBar from "@/components/ProgressBar/ProgressBar";
import { PromptProvider } from "@/components/PromptService";

const PostHogPageView = dynamic(
  () => import("@/components/PageViews/PageViews"),
  {
    ssr: false,
  },
);

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
    images: "/images/og/home-og.png",
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
          <Toaster />
          <A11yProvider>
            <ProgressBar />
            <AuthProvider>
              <ThemeProvider>
                <TRPCReactProvider headers={headers()}>
                  <PromptProvider>{children}</PromptProvider>
                </TRPCReactProvider>
              </ThemeProvider>
            </AuthProvider>
          </A11yProvider>
        </body>
      </CSPostHogProvider>
    </html>
  );
}
