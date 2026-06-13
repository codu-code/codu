export type FeedSort = "recent" | "trending" | "popular";
export type FeedContentType =
  | "ARTICLE"
  | "LINK"
  | "TIL"
  | "QUESTION"
  | "VIDEO"
  | "DISCUSSION"
  | null;

export const VALID_FEED_SORTS: FeedSort[] = ["recent", "trending", "popular"];
// Lowercase type values for URL params (converted to uppercase for the API)
export const VALID_FEED_TYPES_LOWER: string[] = [
  "article",
  "link",
  "til",
  "question",
  "video",
  "discussion",
];

export type FeedSearchParams = {
  sort?: string | null;
  category?: string | null;
  tag?: string | null;
  type?: string | null;
  view?: string | null;
};

/**
 * One derivation of the getFeed input shared by the server page (which SSRs
 * the first feed page) and the client infinite query — the inputs must be
 * identical for the server-fetched page to attach as initialData.
 */
export function deriveFeedInput(
  params: FeedSearchParams,
  isSignedIn: boolean,
): {
  limit: number;
  sort: FeedSort;
  type: Exclude<FeedContentType, null> | null;
  category: string | null;
  tag: string | null;
  following: boolean;
} {
  const sort: FeedSort = VALID_FEED_SORTS.includes(params.sort as FeedSort)
    ? (params.sort as FeedSort)
    : "recent";

  const typeLower = params.type?.toLowerCase();
  const type: FeedContentType = VALID_FEED_TYPES_LOWER.includes(typeLower || "")
    ? (typeLower?.toUpperCase() as Exclude<FeedContentType, null>)
    : null;

  const category = typeof params.category === "string" ? params.category : null;
  const tag = typeof params.tag === "string" ? params.tag : null;
  const following = isSignedIn && params.view === "following";

  return { limit: 25, sort, type, category, tag, following };
}
