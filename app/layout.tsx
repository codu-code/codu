import "../styles/globals.css";
import Fathom from "@/components/Fathom/Fathom";
import React from "react";
import A11yProvider from "@/components/A11yProvider/A11yProvider";
import { Toaster } from "sonner";

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
      <Fathom />
      <body className="h-full">
        <Toaster />
        <A11yProvider>{children}</A11yProvider>
      </body>
    </html>
  );
}
