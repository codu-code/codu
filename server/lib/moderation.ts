/**
 * Auto-moderation helpers, gated behind MODERATION_ENABLED (default OFF). When
 * off, publishing goes straight to published; when on, a user's first publish
 * sets the post to `in_review` until an admin approves it to `published`.
 */

import sendEmail from "@/utils/sendEmail";
import { getAppOrigin } from "@/server/lib/url";
import { autoReview } from "@/server/lib/autoReview";
import { normalizeUrl } from "@/server/lib/normalizeUrl";

/** Escape user-controlled text before interpolating into email HTML. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

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
  const base = getAppOrigin();
  const title = escapeHtml(opts.title?.trim() || "Untitled post");
  const by = opts.authorName ? ` by ${escapeHtml(opts.authorName)}` : "";
  try {
    await sendEmail({
      recipient: adminEmail,
      subject: `Codú: post awaiting review — ${title}`,
      htmlMessage: `
        <p>A new post is waiting in the review queue.</p>
        <p><strong>${title}</strong>${by}</p>
        <p><a href="${base}/admin/moderation?item=${opts.postId}">Review it in the moderation queue →</a></p>
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

export interface GateResult {
  status: "published" | "in_review";
  publishedAt: string | null;
  moderationNote: string | null;
  externalUrlNormalized: string | null;
}

/**
 * Decide the stored status for a post the author is trying to publish.
 *  - moderation disabled -> published immediately
 *  - the synchronous screenContent() heuristic flags -> in_review with the
 *    reasons as the note (runs before any model call)
 *  - articles ALWAYS go to in_review (human editorial gate); auto-review still
 *    runs so its verdict is recorded as an advisory note for the reviewer
 *  - forceInReview (set by the caller for a "very similar" discussion) -> in_review
 *  - everything else -> autoReview verdict decides: allow->published, review->in_review
 *
 * NOTE: hard-duplicate rejection (CONFLICT) is done by the CALLER before this,
 * because it needs to surface the existing post to the user. This helper only
 * decides published-vs-in_review and computes the note + normalized url.
 *
 * Kept DB-free on purpose: it only imports autoReview (no db) and normalizeUrl,
 * so it can be unit tested without booting the env/db layer. The DB-backed
 * dedupe pre-checks live in `dedupe.ts` (`runDedupeAndGate`).
 */
export async function gatePublish(input: {
  type: string;
  title: string;
  body?: string | null;
  externalUrl?: string | null;
  forceInReview?: boolean;
}): Promise<GateResult> {
  const externalUrlNormalized = input.externalUrl
    ? normalizeUrl(input.externalUrl)
    : null;
  const nowIso = new Date().toISOString();

  if (!isModerationEnabled()) {
    return {
      status: "published",
      publishedAt: nowIso,
      moderationNote: null,
      externalUrlNormalized,
    };
  }

  // Cheap synchronous screen runs before the model call. A flag routes straight
  // to review (note matches autoReview's heuristic fallback), so obvious spam
  // can't slip through a fail-open Bedrock error — and skips the model cost.
  const screen = screenContent(input);
  if (!screen.ok) {
    return {
      status: "in_review",
      publishedAt: null,
      moderationNote: `heuristic: ${screen.reasons.join(", ")}`.slice(0, 500),
      externalUrlNormalized,
    };
  }

  if (input.type === "article") {
    // Articles are always human-reviewed; auto-review is advisory only here.
    const v = await autoReview(input);
    return {
      status: "in_review",
      publishedAt: null,
      moderationNote: noteFrom(v),
      externalUrlNormalized,
    };
  }

  if (input.forceInReview) {
    return {
      status: "in_review",
      publishedAt: null,
      moderationNote: "similar-existing",
      externalUrlNormalized,
    };
  }

  const v = await autoReview(input);
  if (v.verdict === "review") {
    return {
      status: "in_review",
      publishedAt: null,
      moderationNote: noteFrom(v),
      externalUrlNormalized,
    };
  }
  return {
    status: "published",
    publishedAt: nowIso,
    moderationNote: null,
    externalUrlNormalized,
  };
}

/**
 * Copy the gate decision onto a drizzle insert/update values object.
 *
 * Writes all four gate fields (status, publishedAt, moderationNote,
 * externalUrlNormalized) so call sites stop hand-copying them and can't drift
 * (e.g. forgetting moderationNote on one path). Handlers with their own
 * publishedAt scheduling (post.publish/update, content.publish) set publishedAt
 * explicitly AFTER calling this — see those handlers.
 */
export function applyGate(
  values: Record<string, unknown>,
  gate: GateResult,
): void {
  values.status = gate.status;
  values.publishedAt = gate.publishedAt;
  values.moderationNote = gate.moderationNote;
  values.externalUrlNormalized = gate.externalUrlNormalized;
}

/** Turn a review verdict into a short reviewer note; null for an allow. */
function noteFrom(v: {
  verdict: string;
  category: string;
  reason: string;
}): string | null {
  return v.verdict === "review"
    ? `${v.category}: ${v.reason}`.slice(0, 500)
    : null;
}
