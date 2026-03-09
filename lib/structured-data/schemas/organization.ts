import type { Organization, WithContext } from "../types";
import {
  discordInviteUrl,
  githubUrl,
  twitterUrl,
  youtubeUrl,
  linkedinUrl,
} from "@/config/site_settings";

const BASE_URL = "https://www.codu.co";

/**
 * Codu organization schema - used as publisher for articles
 * and for site-wide organization structured data
 */
const CODU_ORGANIZATION: Organization = {
  "@type": "Organization",
  name: "Codu",
  url: BASE_URL,
  logo: {
    "@type": "ImageObject",
    url: `${BASE_URL}/images/codu-logo.png`,
    width: 512,
    height: 512,
  },
  sameAs: [discordInviteUrl, githubUrl, twitterUrl, youtubeUrl, linkedinUrl],
  description:
    "A free network and community for web developers. Learn and grow together.",
};

/**
 * Get the full Organization schema with @context for standalone use
 */
export function getOrganizationSchema(): WithContext<Organization> {
  return {
    "@context": "https://schema.org",
    ...CODU_ORGANIZATION,
  };
}

/**
 * Get the Organization object for use within other schemas (e.g., as publisher)
 */
export function getOrganizationRef(): Organization {
  return CODU_ORGANIZATION;
}
