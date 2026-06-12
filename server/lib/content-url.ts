// Pure helpers for parsing and building content URLs. No db/next imports — safe
// to use from any layer (routing, middleware, components, tests).

/**
 * Extract the trailing urlId from a slug-with-id segment. The urlId is always
 * the last hyphen-delimited token; a bare urlId (no slug prefix) maps to itself.
 */
export function parseUrlId(slugWithId: string): string {
  return slugWithId.split("-").pop() ?? slugWithId;
}

/**
 * Produce the hyphenated lowercase base of a slug, with no id suffix. The
 * trailing token of a slug must be the post's urlId, so callers append it.
 */
export function slugifyTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .substring(0, 80);
}

/**
 * Build a slug whose trailing token IS the post's urlId, guaranteeing
 * parseUrlId(slug) === urlId for all new/re-slugged posts.
 */
export function buildSlug(title: string, urlId: string): string {
  return `${slugifyTitle(title)}-${urlId}`;
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

/**
 * Path to a comment anchor on its parent content, per the live URL scheme.
 * The stored `slug` already carries the trailing urlId, so it's used as-is.
 * - discussion / question → /d/{slug}#comment-{id}
 * - aggregated (sourceSlug set) → /s/{sourceSlug}/{slug}#comment-{id}
 * - member content → /{authorUsername}/{slug}#comment-{id}
 */
export function buildCommentHref(input: {
  commentId: string;
  parentType: string;
  parentSlug: string;
  sourceSlug?: string | null;
  authorUsername?: string | null;
}): string {
  const { commentId, parentType, parentSlug, sourceSlug, authorUsername } =
    input;
  const anchor = `#comment-${commentId}`;
  if (parentType === "discussion" || parentType === "question") {
    return `/d/${parentSlug}${anchor}`;
  }
  if (sourceSlug) {
    return `/s/${sourceSlug}/${parentSlug}${anchor}`;
  }
  return `/${authorUsername ?? ""}/${parentSlug}${anchor}`;
}

/**
 * Path to a content row from its stored fields, per the live URL scheme.
 * The stored `slug` already carries the trailing urlId, so it's used as-is.
 * - discussion / question → /d/{slug}
 * - aggregated (sourceSlug set) → /s/{sourceSlug}/{slug}
 * - member content → /{authorUsername}/{slug}; null without a username, so
 *   callers skip the link rather than emit a broken one.
 */
export function buildContentHref(input: {
  type: string;
  slug: string;
  sourceSlug?: string | null;
  authorUsername?: string | null;
}): string | null {
  const { type, slug, sourceSlug, authorUsername } = input;
  if (type === "discussion" || type === "question") {
    return `/d/${slug}`;
  }
  if (sourceSlug) {
    return `/s/${sourceSlug}/${slug}`;
  }
  if (!authorUsername) return null;
  return `/${authorUsername}/${slug}`;
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
