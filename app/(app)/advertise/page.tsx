import type { Metadata } from "next";
import { AdvertiseClient } from "./_client";

export const metadata: Metadata = {
  title: "Advertise with Codú — Reach a global community of AI builders",
  description:
    "Partner with Codú to reach a global community of AI builders and indie hackers. Newsletter ads, job postings, event branding, and more.",
  openGraph: {
    title: "Advertise with Codú",
    description:
      "Connect your brand with a global community of AI builders and indie hackers. Sponsorship packages for newsletter advertising, job postings, and event branding.",
  },
};

export default function AdvertisePage() {
  return <AdvertiseClient />;
}
