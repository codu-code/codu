import type { WebSite, WithContext } from "../types";
import { getOrganizationRef } from "./organization";

const BASE_URL = "https://www.codu.co";

/**
 * Generate WebSite schema for the homepage
 * Includes SearchAction for Google sitelinks search box
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
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${BASE_URL}/feed?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}
