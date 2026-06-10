// Pure helpers for parsing and building content URLs. No db/next imports — safe
// to use from any layer (routing, middleware, components, tests).

/**
 * Extract the trailing urlId from a slug-with-id segment. The urlId is always
 * the last hyphen-delimited token; a bare urlId (no slug prefix) maps to itself.
 */
export function parseUrlId(slugWithId: string): string {
  return slugWithId.split("-").pop() ?? slugWithId;
}

/** Path to a member's content: /username/slug-urlId */
export function buildMemberPath(
  username: string,
  slug: string,
  urlId: string,
): string {
  return `/${username}/${slug}-${urlId}`;
}

/** Path to a discussion: /d/slug-urlId */
export function buildDiscussionPath(slug: string, urlId: string): string {
  return `/d/${slug}-${urlId}`;
}

/** Path to imported source content: /s/source/slug-urlId */
export function buildSourcePath(
  source: string,
  slug: string,
  urlId: string,
): string {
  return `/s/${source}/${slug}-${urlId}`;
}

function stripQuery(path: string): string {
  const queryIndex = path.indexOf("?");
  return queryIndex === -1 ? path : path.slice(0, queryIndex);
}

/**
 * True when the requested path does not match the canonical path (so a redirect
 * is warranted). Querystrings are ignored — only the path is compared.
 */
export function canonicalMismatch(
  requested: string,
  canonical: string,
): boolean {
  return stripQuery(requested) !== stripQuery(canonical);
}
