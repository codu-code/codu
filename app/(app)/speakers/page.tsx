import type { Metadata } from "next";
import { JsonLd } from "@/components/JsonLd";
import { SpeakersClient } from "./_client";

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
  },
  twitter: {
    card: "summary_large_image",
    title: "Speak at Codú",
    description: PAGE_DESCRIPTION,
  },
};

const speakerJsonLd = {
  "@context": "https://schema.org",
  "@type": "JobPosting",
  title: "Speaker — Codú Meetups",
  description: PAGE_DESCRIPTION,
  employmentType: "VOLUNTEER",
  hiringOrganization: {
    "@type": "Organization",
    name: "Codú",
    sameAs: "https://www.codu.co",
    logo: "https://www.codu.co/images/codu-logo.png",
  },
  jobLocation: {
    "@type": "Place",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Dublin",
      addressCountry: "IE",
    },
  },
  applicantLocationRequirements: { "@type": "Country", name: "Worldwide" },
  jobLocationType: "TELECOMMUTE",
  datePosted: new Date().toISOString().split("T")[0],
  url: PAGE_URL,
};

export default function SpeakersPage() {
  return (
    <>
      <JsonLd data={speakerJsonLd} />
      <SpeakersClient />
    </>
  );
}
