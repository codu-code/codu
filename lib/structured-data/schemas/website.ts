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
      "A free network and community for web developers. Learn and grow together.",
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
