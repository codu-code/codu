/**
 * Auto-moderation helpers for the "write → auto-moderation → In review" flow.
 *
 * The whole flow is gated behind a server env flag (MODERATION_ENABLED),
 * DEFAULT OFF. When off, publishing behaves exactly as before (straight to
 * published + points). When on, a user's first publish sets the post to
 * `in_review` and an admin approves it to flip it to `published`.
 */

/** True only when MODERATION_ENABLED is explicitly the string "true". */
export function isModerationEnabled(): boolean {
  return process.env.MODERATION_ENABLED === "true";
}

export interface ScreenResult {
  ok: boolean;
  linkCount: number;
  reasons: string[];
}

// Matches http(s):// URLs anywhere in the text — used to count external links.
const URL_REGEX = /https?:\/\/[^\s)]+/gi;

// Small, dependency-free banned-phrase list. These are common spam signals;
// human review is the real gate, this just flags for the reviewer.
const BANNED_PHRASES = ["buy now", "free crypto", "viagra"];

const MAX_LINKS = 5;
const MIN_BODY_LENGTH = 20;

/**
 * Lightweight, synchronous heuristic content screen. Never throws.
 * `ok` is true when there are no reasons. This does NOT hard-reject — a failing
 * screen still goes to `in_review`; the reasons are surfaced to reviewers.
 */
export function screenContent({
  title,
  body,
}: {
  title?: string | null;
  body?: string | null;
}): ScreenResult {
  const safeTitle = title ?? "";
  const safeBody = body ?? "";
  const reasons: string[] = [];

  const linkCount = (safeBody.match(URL_REGEX) ?? []).length;
  if (linkCount > MAX_LINKS) {
    reasons.push("excessive-links");
  }

  if (safeBody.trim().length < MIN_BODY_LENGTH) {
    reasons.push("too-short");
  }

  const haystack = `${safeTitle} ${safeBody}`.toLowerCase();
  if (BANNED_PHRASES.some((phrase) => haystack.includes(phrase))) {
    reasons.push("spam-keywords");
  }

  return { ok: reasons.length === 0, linkCount, reasons };
}
