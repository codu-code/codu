# Moderation Overhaul — Design

**Date:** 2026-06-09
**Branch:** feat/relaunch-repositioning
**Status:** Approved (brainstorm complete)

## Goal

Tighten content moderation for the Codú relaunch ("community for AI builders &
indie hackers"). Fix the broken moderation-email link, add a real flag button
everywhere, add Bedrock Haiku auto-review at publish time, dedupe links and
discussions for freshness, and make sure nothing a user posts is ever deleted —
only hidden, recoverably.

This builds on infrastructure that **already exists** on this branch:
`MODERATION_ENABLED` gate, `screenContent()` heuristic, `posts.status` enum
(`in_review`/`rejected`), `admin.moderatePost`, `admin.ban`/`unban`,
`ReportModal`/`ReportButton`, DynamoDB `rateLimit.ts`, SES email via
`utils/sendEmail.ts`.

## Decisions (from brainstorm)

- **Review scope:** every post type runs auto-review at publish (the "loader"
  moment), then goes live unless flagged. **Articles additionally** always pass
  through the human editorial gate (`in_review`), never auto-publishing.
- **Auto-mod action on a hit:** hide + queue (`in_review`), email admin, human
  decides. Never auto-delete.
- **User flags:** any flag notifies the admin; content stays live until a human
  hides it. No threshold/auto-hide.
- **Decline ≠ delete:** decline moves content to `rejected` ("Hidden by
  moderator"); the author keeps the content and sees the status.
- **Auto-review policy:** loose and fair. Allow by default, including people
  posting their own projects/launches. Only flag the obvious — porn/NSFW,
  crypto/token shilling, malicious/scam links, dead/fake sources, plainly
  off-theme content.
- **Dedupe:** content must be fresh. Links and discussions/questions are deduped
  globally within a **6-month** window.

## Section 1 — Status model, author states, email fix

Reuse the existing `posts.status` enum. No new enum.

| Status | Public sees | Author sees on their own post |
|---|---|---|
| `published` | Live | Live |
| `in_review` | Hidden | "Awaiting review" badge |
| `rejected` | Hidden | "Hidden by moderator" badge (+ reason) |

**Principle:** nothing is ever deleted. Decline = `→ rejected`. Author keeps
content, sees it in dashboard/profile with a badge. Same for `in_review`.

**New column:** `posts.moderationNote` (nullable text) — stores the auto-review
verdict/reasons (for the admin queue) and an optional decline note (for the
author).

**Email bug fix:** `server/lib/moderation.ts` builds links from
`process.env.NEXTAUTH_URL`, which carries the `/api/auth` path → produced
`…/api/auth/admin/moderation`. Centralise a `getAppOrigin()` helper (origin
only, no path) and use it for all app-facing email links. Moderation email →
`…/admin/moderation?item=<postId>`. Audit other email builders (`report.ts`,
password-less auth) for the same `NEXTAUTH_URL`-as-base mistake.

## Section 2 — Publish flow + Bedrock auto-review + loader

Auto-review runs **synchronously** in `post.create` / `post.update`
(going-live), behind `MODERATION_ENABLED`. No queue exists; this mirrors the
existing inline `screenContent()`.

1. **Links/resources** — "pre-visit" the URL: follow redirects, size cap, ~4s
   timeout, extract `<title>`/meta/visible text. Validates the source is real
   and gives Haiku real page content.
2. **Bedrock Haiku** — post (or fetched page text) + philosophy prompt →
   structured JSON `{ verdict: "allow" | "review", category, reason }`.
3. **Decision:**
   - `article` → always `in_review` (editorial). Auto-review still runs; verdict
     stored in `moderationNote` for the queue.
   - everything else → `allow` ⇒ live; `review` ⇒ `in_review` (hidden), admin
     emailed.

**Policy / prompt:** loose and fair. Allow self-promotion of own projects. Flag
only the obvious (porn, crypto, malicious/scam links, dead sources, plainly
off-theme).

**Resilience:** Bedrock or fetch error/timeout → fail-open: fall back to the
heuristic screen; if clean, publish. Never block publishing on infra failure
(log to Sentry). Bedrock independently gated by its env vars.

**Loader UX:** the editor awaits the mutation; show a themed "Reviewing your
post…" loader with rotating playful lines. On resolve → live post, or a
"Submitted for review" confirmation.

## Section 3 — Freshness dedupe (links + discussions)

**Links/resources — global 6-month freshness window:**
- New `posts.externalUrlNormalized` column (+ index). `normalizeUrl()`:
  lowercase host, strip `www.`, drop tracking params (`utm_*`, `fbclid`,
  `gclid`, ref), trim trailing slash/fragment.
- Normalised URL already present **within 6 months** (any author) → **blocked**,
  with a pointer to the existing post. Older → allowed (stale, refresh fine).

**Discussions/questions — no same/very-similar recent post:**
- Text similarity on normalised title via Postgres **`pg_trgm`** (enable
  extension via Drizzle migration). Scoped to last 6 months.
- Exact/near-exact → **blocked**, pointing to the existing thread.
- Very similar (softer threshold) → **`in_review`** (human decides), not a hard
  block — fuzzy matching shouldn't reject a borderline-distinct question.

**Rate limiting:** reuse `enforceRateLimit` already on create; add a tighter
link-submission throttle. Checks run **before** Bedrock so we don't fetch/screen
a URL we'll reject as a dupe.

## Section 4 — Flags, admin queue, infra, account-block

**Flag/report (any flag → notify, stays live, admin hides):**
- Add nullable `postId` FK to `content_report` (+ relation) so reports on the new
  `posts` table land in the DB queue. Keep `contentId`/`discussionId` for legacy.
- `report.create` handles `post`: insert, dedupe per user per post, email admin
  (fixed origin, link to `…/admin/moderation?item=<id>`). Content stays live.
- Ensure `ReportButton`/`ReportModal` is on every surface (feed cards + all
  detail pages + discussions), routing to the DB `report.create`, not the
  legacy email-only `report.send`. Retire the email-only path for posts.

**Admin moderation queue (`/admin/moderation`):**
- One view merging `in_review` posts (auto-mod/articles/dedupe-borderline) +
  live-but-reported posts.
- Actions: Approve → `published`; Decline → `rejected` ("hidden by moderator" +
  optional note); Hide a reported-live post → `in_review`/`rejected`; Dismiss
  report. Show `moderationNote` reasons + report details/counts.
- Extend `admin.moderatePost` (or add `hidePost`/`reviewReport`) to act on live
  posts, not just `in_review`.
- Optional convenience: "Ban author" from the queue (reuses `admin.ban`).

**Author-facing states:** badges on the author's own post page + dashboard list
for `in_review` ("Awaiting review") and `rejected` ("Hidden by moderator" +
note). Public/feed queries already exclude non-published.

**Bedrock infra (CDK + env + SDK):**
- Add `@aws-sdk/client-bedrock-runtime`.
- `server/lib/bedrock.ts` client mirroring `s3helpers.ts` (region from
  `BEDROCK_REGION`, creds from `ACCESS_KEY`/`SECRET_KEY`).
- `cdk/lib/iam-stack.ts`: `bedrock:InvokeModel` PolicyStatement scoped to the
  Haiku model / regional inference-profile ARN(s), granted to `appUser`.
- Env: `BEDROCK_REGION`, `BEDROCK_MODEL_ID` (Haiku via regional inference
  profile). Confirm exact model id via the claude-api skill at implementation.
- `server/lib/autoReview.ts`: link-fetch + Haiku call + verdict; gated;
  fail-open.

**Account blocking:** already present (`admin.ban`/`unban` flips published→draft
and feed queries `LEFT JOIN banned_users`). Add a regression test to lock it in.

## Out of scope / YAGNI

- No SQS/queue — auto-review stays synchronous (acceptable few-second lag).
- No embeddings infra — discussion similarity uses `pg_trgm`, not vectors.
- No new status enum values — reuse `in_review`/`rejected`.
