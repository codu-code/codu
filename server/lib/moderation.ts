/**
 * Auto-moderation helpers for the "write → auto-moderation → In review" flow.
 *
 * The whole flow is gated behind a server env flag (MODERATION_ENABLED),
 * DEFAULT OFF. When off, publishing behaves exactly as before (straight to
 * published + points). When on, a user's first publish sets the post to
 * `in_review` and an admin approves it to flip it to `published`.
 */

import sendEmail from "@/utils/sendEmail";

/** True only when MODERATION_ENABLED is explicitly the string "true". */
export function isModerationEnabled(): boolean {
  return process.env.MODERATION_ENABLED === "true";
}

/**
 * Email the admin that a post has entered the review queue. Fire-and-forget:
 * never throws, so it can't block publishing. No-op if ADMIN_EMAIL is unset.
 */
export async function notifyAdminOfReview(opts: {
  postId: string;
  title?: string | null;
  authorName?: string | null;
}): Promise<void> {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) return;
  const base =
    process.env.NEXTAUTH_URL || process.env.AUTH_URL || "https://www.codu.co";
  const title = opts.title?.trim() || "Untitled post";
  const by = opts.authorName ? ` by ${opts.authorName}` : "";
  try {
    await sendEmail({
      recipient: adminEmail,
      subject: `Codú: post awaiting review — ${title}`,
      htmlMessage: `
        <p>A new post is waiting in the review queue.</p>
        <p><strong>${title}</strong>${by}</p>
        <p><a href="${base}/admin/moderation">Review it in the moderation queue →</a></p>
        <p style="color:#777;font-size:12px;">Keeping Codú's feed worth reading. Less theory, more shipping.</p>
      `,
    });
  } catch (err) {
    console.error("Failed to email admin about a post in review:", err);
  }
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
