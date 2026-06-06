import type { Metadata } from "next";
import {
  AboutHero,
  ManifestoSection,
  WhatYouGetSection,
  FounderNote,
  CtaSection,
} from "@/components/About";

export const metadata: Metadata = {
  title: "About Codú — The community for AI builders & indie hackers",
  description:
    "Codú is the community for AI builders and indie hackers. Learn to build with AI, share what you ship, and grow with people doing the same.",
  openGraph: {
    title: "About Codú — The community for AI builders & indie hackers",
    description:
      "Learn to build with AI, share what you ship, and grow with people doing the same. Free to join.",
    images: "/images/og/home-og.png",
  },
};

export default function AboutPage() {
  return (
    <>
      <AboutHero />
      <ManifestoSection />
      <WhatYouGetSection />
      <FounderNote />
      <CtaSection />
    </>
  );
}
