import type { Metadata } from "next";
import JobsClient from "./_client";
import { ogMainImage } from "@/lib/og/url";

const ogDescription =
  "Curated AI developer jobs — roles building with AI, LLMs, and agents. Remote, full-time, freelance, and more.";
const ogImage = ogMainImage("jobs");

export const metadata: Metadata = {
  title: "AI developer jobs — Codú",
  description: ogDescription,
  openGraph: {
    title: "AI developer jobs — Codú",
    description: ogDescription,
    images: [ogImage],
  },
  twitter: {
    card: "summary_large_image",
    title: "AI developer jobs — Codú",
    description: ogDescription,
    images: [ogImage],
  },
};

export default function JobsPage() {
  return <JobsClient />;
}
