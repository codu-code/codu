import type { WebSite, WithContext } from "../types";
import { getOrganizationRef } from "./organization";

import { SITE_ORIGIN as BASE_URL } from "@/config/site";

/**
 * Generate WebSite schema for the homepage.
 * (No SearchAction — Google's sitelinks search box is deprecated.)
 */
export function getWebSiteSchema(): WithContext<WebSite> {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Codu",
    url: BASE_URL,
    description:
      "Codú is the community for AI builders and indie hackers. Learn to build with AI, share what you ship, and grow with people doing the same.",
    publisher: getOrganizationRef(),
  };
}
