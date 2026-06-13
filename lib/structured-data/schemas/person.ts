import type { Person, WithContext } from "../types";

import { SITE_ORIGIN as BASE_URL } from "@/config/site";

interface PersonData {
  name: string | null;
  username: string | null;
  image?: string | null;
  bio?: string | null;
  websiteUrl?: string | null;
}

/**
 * Generate Person schema for user profiles
 */
export function getPersonSchema(profile: PersonData): WithContext<Person> {
  const sameAs: string[] = [];
  if (profile.websiteUrl) {
    sameAs.push(profile.websiteUrl);
  }

  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: profile.name || profile.username || "Codu Member",
    url: `${BASE_URL}/${profile.username}`,
    ...(profile.image && { image: profile.image }),
    ...(profile.bio && { description: profile.bio }),
    ...(sameAs.length > 0 && { sameAs }),
  };
}

/**
 * Get a Person reference for use within other schemas (e.g., as author)
 */
export function getPersonRef(profile: PersonData): Person {
  return {
    "@type": "Person",
    name: profile.name || profile.username || "Codu Member",
    // Omit the URL for handle-less users rather than emit /null.
    ...(profile.username && { url: `${BASE_URL}/${profile.username}` }),
    ...(profile.image && { image: profile.image }),
    ...(profile.bio && { description: profile.bio }),
  };
}
