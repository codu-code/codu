import type { Person, ProfilePage, WithContext } from "../types";
import { getPersonSchema } from "./person";

interface ProfilePageInput {
  name: string | null;
  username: string | null;
  image?: string | null;
  bio?: string | null;
  /** Personal site / social URL surfaced as Person.sameAs. */
  websiteUrl?: string | null;
  /** ISO timestamp the account was created. */
  createdAt?: string | null;
}

/**
 * Generate ProfilePage schema for a user profile.
 * Reuses getPersonSchema for the Person mainEntity (name, url, image,
 * description, sameAs) and drops its @context since it's nested here.
 */
export function getProfilePageSchema(
  profile: ProfilePageInput,
): WithContext<ProfilePage> {
  // getPersonSchema carries @context; strip it since the Person is nested here.
  const personWithContext = getPersonSchema({
    name: profile.name,
    username: profile.username,
    image: profile.image,
    bio: profile.bio,
    websiteUrl: profile.websiteUrl,
  });
  const person: Person = { ...personWithContext };
  delete (person as Partial<typeof personWithContext>)["@context"];

  return {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    ...(profile.createdAt && { dateCreated: profile.createdAt }),
    mainEntity: person,
  };
}
