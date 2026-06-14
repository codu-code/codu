import type { Metadata } from "next";
import { SpeakersClient } from "./_client";
import { ogMainImage } from "@/lib/og/url";

const OG_IMAGE = ogMainImage("home");

const PAGE_URL = "https://www.codu.co/speakers";
const PAGE_TITLE = "Speak at Codú — Pitch a Talk for Our Meetups";
const PAGE_DESCRIPTION =
  "Pitch a talk at a Codú meetup. First-time speakers welcome. We run regular developer meetups across Ireland and are always looking for people to share what they've built, learned, or broken.";

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  keywords: [
    "Codú speaker",
    "tech meetup speaker Ireland",
    "developer meetup Dublin",
    "first time speaker",
    "web development talk",
    "speak at meetup Ireland",
  ],
  alternates: { canonical: PAGE_URL },
  robots: { index: true, follow: true },
  openGraph: {
    title: "Speak at Codú",
    description: PAGE_DESCRIPTION,
    url: PAGE_URL,
    type: "website",
    images: [OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: "Speak at Codú",
    description: PAGE_DESCRIPTION,
    images: [OG_IMAGE],
  },
};

export default function SpeakersPage() {
  return <SpeakersClient />;
}
