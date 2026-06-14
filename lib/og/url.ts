// Builders for the dynamic OG route (`app/og/route.tsx`). Each returns a
// relative `/og?...` URL; metadataBase (set in the root layout) resolves it to
// an absolute one. Param names here must match what the route reads.
import { hueFromString } from "@/utils/hue";

type Param = string | number | boolean | null | undefined;

function ogUrl(params: Record<string, Param>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    search.set(key, String(value));
  }
  return `/og?${search.toString()}`;
}

// Cache-busting stamp so an edited record gets a fresh card (the route sets a
// long immutable cache-control). Seconds keep the URL short.
const version = (date?: string | Date | null): number | undefined =>
  date ? Math.floor(new Date(date).getTime() / 1000) : undefined;

export type OgMainId =
  | "home"
  | "about"
  | "advertise"
  | "articles"
  | "discussions"
  | "jobs"
  | "weekly";

export const ogMainImage = (id: OgMainId): string => ogUrl({ type: "main", id });

export type OgPostImageInput = {
  kind: "article" | "discussion" | "link";
  title: string;
  authorName: string;
  authorRole?: string | null;
  /** Stable key (username / source slug) the author hue is derived from. */
  authorKey: string;
  tags?: string[];
  publicationName?: string | null;
  publicationKey?: string | null;
  source?: string | null;
  readMins?: number | null;
  cover?: string | null;
  updatedAt?: string | Date | null;
};

export const ogPostImage = (post: OgPostImageInput): string =>
  ogUrl({
    type: "post",
    kind: post.kind,
    title: post.title,
    author: post.authorName,
    role: post.authorRole,
    hue: hueFromString(post.authorKey),
    tags: post.tags?.slice(0, 2).join(","),
    pub: post.publicationName,
    pubHue: post.publicationKey ? hueFromString(post.publicationKey) : undefined,
    source: post.source,
    read: post.readMins ? `${post.readMins} min` : undefined,
    cover: post.cover,
    v: version(post.updatedAt),
  });

export type OgProfileImageInput = {
  name: string;
  /** Stable key (username) the avatar hue is derived from. */
  key: string;
  role?: string | null;
  location?: string | null;
  bio?: string | null;
  followers?: number;
  joined?: string;
  interests?: string[];
  topHelper?: boolean;
  updatedAt?: string | Date | null;
};

export const ogProfileImage = (profile: OgProfileImageInput): string =>
  ogUrl({
    type: "profile",
    name: profile.name,
    hue: hueFromString(profile.key),
    role: profile.role,
    location: profile.location,
    bio: profile.bio,
    followers: profile.followers,
    joined: profile.joined,
    interests: profile.interests?.slice(0, 3).join(","),
    topHelper: profile.topHelper ? 1 : undefined,
    v: version(profile.updatedAt),
  });

export type OgPublicationImageInput = {
  name: string;
  /** Stable key (slug) the publication-mark hue is derived from. */
  key: string;
  tagline?: string | null;
  articleCount?: number;
  followers?: number;
  updatedAt?: string | Date | null;
};

export const ogPublicationImage = (pub: OgPublicationImageInput): string =>
  ogUrl({
    type: "publication",
    name: pub.name,
    hue: hueFromString(pub.key),
    tagline: pub.tagline,
    articles: pub.articleCount,
    followers: pub.followers,
    v: version(pub.updatedAt),
  });

export type OgJobImageInput = {
  company: string;
  role: string;
  location: string;
  jobType: string;
  tags?: string[];
  featured?: boolean;
  updatedAt?: string | Date | null;
};

export const ogJobImage = (jobListing: OgJobImageInput): string =>
  ogUrl({
    type: "job",
    company: jobListing.company,
    logo: jobListing.company.trim()[0]?.toUpperCase(),
    role: jobListing.role,
    location: jobListing.location,
    jobType: jobListing.jobType,
    tags: jobListing.tags?.slice(0, 3).join(","),
    featured: jobListing.featured ? 1 : undefined,
    v: version(jobListing.updatedAt),
  });
