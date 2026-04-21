import type { Metadata } from "next";
import { JsonLd } from "@/components/JsonLd";
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

const volunteerJsonLd = {
  "@context": "https://schema.org",
  "@type": "JobPosting",
  title: "Volunteer — Marketing & Events",
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
      addressCountry: "IE",
    },
  },
  applicantLocationRequirements: { "@type": "Country", name: "Worldwide" },
  jobLocationType: "TELECOMMUTE",
  datePosted: new Date().toISOString().split("T")[0],
  url: PAGE_URL,
};

export default function VolunteerPage() {
  return (
    <>
      <JsonLd data={volunteerJsonLd} />
      <VolunteerClient />
    </>
  );
}
