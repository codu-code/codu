import "../styles/globals.css";
import { headers } from "next/headers";
import Fathom from "@/components/Fathom/Fathom";
import ThemeProvider from "@/components/Theme/ThemeProvider";
import { TRPCReactProvider } from "@/server/trpc/react";
import Footer from "@/components/Footer/Footer";
import Nav from "@/components/Nav/Nav";
import { getServerAuthSession } from "@/server/auth";
import AuthProvider from "@/context/AuthProvider";
import { Toaster } from "sonner";
import ProgressBar from "@/components/ProgressBar/ProgressBar";
import React from "react";
import A11yProvider from "@/components/A11yProvider/A11yProvider";
import { PromptProvider } from "@/components/PromptService";

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
  const session = await getServerAuthSession();

  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <Fathom />
      <body className="h-full">
        <A11yProvider>
          <ProgressBar />
          <AuthProvider>
            <ThemeProvider>
              <TRPCReactProvider headers={headers()}>
                <PromptProvider>
                  <Toaster />
                  <Nav session={session} />
                  {children}
                  <Footer />
                </PromptProvider>
              </TRPCReactProvider>
            </ThemeProvider>
          </AuthProvider>
        </A11yProvider>
      </body>
    </html>
  );
}
