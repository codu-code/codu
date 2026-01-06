import type { Metadata } from "next";
import { AdvertiseClient } from "./_client";

export const metadata: Metadata = {
  title: "Advertise with Codú - Reach Ireland's Developer Community",
  description:
    "Partner with Codú to reach 100,000+ monthly developer visits. Job postings, newsletter ads, event branding, and more. Connect with Ireland's largest web developer community.",
  openGraph: {
    title: "Advertise with Codú",
    description:
      "Connect your brand with Ireland's most engaged developer community. Sponsorship packages for job postings, newsletter advertising, and event branding.",
  },
};

export default function AdvertisePage() {
  return <AdvertiseClient />;
}
