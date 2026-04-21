import type { Metadata } from "next";
import { VolunteerClient } from "./_client";

const PAGE_URL = "https://www.codu.co/volunteer";
const PAGE_TITLE = "Volunteer with Codú — Help Build Ireland's Largest Dev Community";
const PAGE_DESCRIPTION =
  "Join the team behind Codú. We're recruiting volunteer marketers and event organisers to help run meetups, newsletters, partnerships, and socials across the Irish tech ecosystem.";

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  keywords: [
    "Codú volunteer",
    "volunteer developer community",
    "Ireland tech community",
    "web developer volunteer",
    "tech meetup organiser Ireland",
    "marketing volunteer",
    "events volunteer",
  ],
  alternates: { canonical: PAGE_URL },
  robots: { index: true, follow: true },
  openGraph: {
    title: "Volunteer with Codú",
    description: PAGE_DESCRIPTION,
    url: PAGE_URL,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Volunteer with Codú",
    description: PAGE_DESCRIPTION,
  },
};

export default function VolunteerPage() {
  return <VolunteerClient />;
}
