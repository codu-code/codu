# Content URL Restructure for SEO/AEO Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Move all content to stable, id-resolved, SEO/AEO-optimized URLs (`/{username}/{slug}-{urlId}` for member content, `/d/{slug}-{urlId}` for discussions/questions, `/s/{sourceSlug}/...` for aggregated links), with 301 self-correction, forum/profile structured data, AI-crawler access, and full test + redirect coverage — without losing existing SEO.

**Architecture:** Every content URL resolves on a short immutable `urlId`; the slug and username segments are decorative and 301-corrected to canonical on any mismatch (safe title edits + username renames forever). Discussions/questions get a dedicated `/d/` forum namespace. Structured data (`DiscussionForumPosting`, `ProfilePage`, `Article`, `BreadcrumbList`, `Organization`) extends the existing `lib/structured-data/` builders. AEO work hardens `robots.ts`, splits sitemaps by type, and wires Bing IndexNow.

**Tech Stack:** Next.js App Router (RSC), Drizzle ORM (Postgres), tRPC v11, Playwright (e2e), Vitest (unit), `next/font`, nanoid, schema.org JSON-LD.

**Decisions locked (flip any before starting):**
- Questions == discussions → single `/d/` namespace, `DiscussionForumPosting` schema.
- Feed sources move to `/s/{sourceSlug}` (frees top-level namespace).
- `urlId`: backfill from each post's existing trailing slug-hash (old links resolve unchanged).
- Google-Extended stays allowed.
- `/tag/{slug}` pages: reserve namespace now, build as a fast-follow (out of scope here).
- Member link-posts canonical = Codú; aggregated RSS links canonical = original source URL.

---

## Phase 0 — Foundations

### Task 1: `urlId` column + migration + backfill

**Files:**
- Modify: `server/db/schema.ts` (posts table, ~line 332)
- Create: `drizzle/00XX_add_post_url_id.sql` (via `npm run db:generate`)
- Create: `drizzle/backfill-url-id.ts`

**Step 1:** Add the column to the `posts` table (after `slug`):

```ts
// Short, immutable, URL-safe id — the canonical resolver for content URLs.
// The slug/username in the path are decorative and 301-corrected to match this.
urlId: varchar("url_id", { length: 16 }),
```

Add a unique index in the table's index block:

```ts
urlIdKey: uniqueIndex("posts_url_id_key").on(table.urlId),
```

**Step 2:** Generate the migration: `npm run db:generate` → confirm a single `ADD COLUMN "url_id"` + unique index.

**Step 3:** Write `drizzle/backfill-url-id.ts`: for every `posts` row with `urlId IS NULL`, set `urlId` to the trailing hex of the existing slug (regex `/-([0-9a-f]{4,})$/`); if no match or a collision, mint `nanoid(8)` (lowercase alphanumeric alphabet). Idempotent (skip rows that already have one). Use the `dotenv/config` + `postgres-js` pattern from `drizzle/migrate.ts`.

**Step 4:** Make `urlId` `NOT NULL` in a follow-up migration once backfill has run in every environment (separate task at deploy time — do not block).

**Step 5:** Update `generateSlug` usage in `server/api/router/content.ts` (~line 559): on create, mint `urlId = nanoid(8)` and insert it; keep `generateSlug(title)` for the decorative slug.

**Step 6:** Commit: `feat(db): add immutable urlId to posts for stable content URLs`.

---

### Task 2: Reserved-namespace list + username validation

**Files:**
- Create: `server/lib/reserved-usernames.ts`
- Create: `server/lib/reserved-usernames.test.ts`
- Modify: `schema/profile.ts:7-14` (saveSettingsSchema.username)

**Step 1 (TDD):** Write `server/lib/reserved-usernames.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { isReservedUsername } from "./reserved-usernames";

describe("isReservedUsername", () => {
  it("blocks live route names", () => {
    expect(isReservedUsername("settings")).toBe(true);
    expect(isReservedUsername("d")).toBe(true);
    expect(isReservedUsername("articles")).toBe(true);
  });
  it("blocks single letters and impersonation handles", () => {
    expect(isReservedUsername("x")).toBe(true);
    expect(isReservedUsername("codu")).toBe(true);
    expect(isReservedUsername("admin")).toBe(true);
  });
  it("is case-insensitive", () => {
    expect(isReservedUsername("Settings")).toBe(true);
  });
  it("allows real handles", () => {
    expect(isReservedUsername("niall-maher")).toBe(false);
  });
});
```

**Step 2:** Run → fails (module missing).

**Step 3:** Create `server/lib/reserved-usernames.ts` — a `Set<string>` of all reserved names (categories from the plan review: live routes, infra/well-known, auth/account, future sections, legal, impersonation/safety, all single letters `a`–`z`), plus `export function isReservedUsername(name: string): boolean { return RESERVED.has(name.trim().toLowerCase()); }`.

**Step 4:** Run → passes.

**Step 5:** Wire into `schema/profile.ts` username field with `.refine((u) => !isReservedUsername(u), "That username is reserved.")`. (Import is server-safe; if a client bundle complains, move the refine into the `profile.updateProfile` mutation in `server/api/router/profile.ts` instead.)

**Step 6:** Commit: `feat(profile): reserve top-level namespaces from usernames`.

---

### Task 3: Pure URL helpers (the heart of routing)

**Files:**
- Create: `server/lib/content-url.ts`
- Create: `server/lib/content-url.test.ts`

**Step 1 (TDD):** Write `server/lib/content-url.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import {
  parseUrlId,
  buildMemberPath,
  buildDiscussionPath,
  canonicalMismatch,
} from "./content-url";

describe("parseUrlId", () => {
  it("extracts the trailing url id from a decorated path segment", () => {
    expect(parseUrlId("why-rag-beats-finetuning-a1b2c3d4")).toBe("a1b2c3d4");
  });
  it("returns the whole segment when there is no slug prefix", () => {
    expect(parseUrlId("a1b2c3d4")).toBe("a1b2c3d4");
  });
});

describe("path builders", () => {
  it("builds the canonical member path", () => {
    expect(buildMemberPath("niall-maher", "why-rag-x", "a1b2c3d4")).toBe(
      "/niall-maher/why-rag-x-a1b2c3d4",
    );
  });
  it("builds the canonical discussion path", () => {
    expect(buildDiscussionPath("how-do-you-test", "7x8y9z01")).toBe(
      "/d/how-do-you-test-7x8y9z01",
    );
  });
});

describe("canonicalMismatch", () => {
  it("is true when the requested path differs from canonical", () => {
    expect(canonicalMismatch("/niall/old-a1b2c3d4", "/niall-maher/new-a1b2c3d4")).toBe(true);
  });
  it("is false when they match", () => {
    expect(canonicalMismatch("/d/x-7x8y9z01", "/d/x-7x8y9z01")).toBe(false);
  });
});
```

**Step 2:** Run → fails.

**Step 3:** Implement `server/lib/content-url.ts`: `parseUrlId` (split on last `-`, return last token), `buildMemberPath`, `buildDiscussionPath`, `buildSourcePath`, `canonicalMismatch` (string-equality ignoring querystring). Pure, no imports of `db`/`next`.

**Step 4:** Run → passes.

**Step 5:** Commit: `feat(url): pure helpers for content url parsing + canonicalization`.

---

## Phase 1 — Routing & redirects

### Task 4: Member content route resolves on `urlId` + self-corrects

**Files:**
- Modify: `app/(app)/[username]/[slug]/page.tsx` (resolvers ~470-960)

**Step 1:** Change resolution to: `parseUrlId(params.slug)` → look up post by `urlId` (+ that it's a member, non-discussion type). If found, compute canonical `buildMemberPath(author.username, post.slug, post.urlId)`; if `canonicalMismatch(requestedPath, canonical)` → `permanentRedirect(canonical)` (handles both wrong slug AND renamed username). If not found by id, fall back to the existing slug+username lookup (legacy links) and `permanentRedirect` to the new canonical.

**Step 2:** Keep the page a **server component** (content in initial HTML — required for AEO). No client-only data fetching for the body.

**Step 3:** Deleted/unpublished member content → return **410 Gone** via a dedicated `not-found`/status path rather than soft-404.

**Step 4:** Manual verify (dev server): create an article, edit its title, hit the old URL → 301 to new; rename the username → old author path 301s to new.

**Step 5:** Commit: `feat(routing): resolve member content by urlId with 301 canonicalization`.

---

### Task 5: New `/d/` discussion namespace + SSR detail page

**Files:**
- Create: `app/(app)/d/[slug]/page.tsx`
- Reuse: the existing discussion detail rendering (currently reached via `[username]/[slug]`)

**Step 1:** New server-component route `app/(app)/d/[slug]/page.tsx`: `parseUrlId` → look up discussion/question by `urlId` → 301-correct slug → render OP + comments **server-side** (full thread in initial HTML).

**Step 2:** Emit `DiscussionForumPosting` JSON-LD (Task 10) with nested `Comment[]`.

**Step 3:** Comment anchors: each rendered comment gets `id="comment-{commentId}"`; the page supports `#comment-{id}` scroll. No standalone comment route.

**Step 4:** Old discussion URLs (`/{username}/{discussion-slug}`) → 301 to `/d/{slug}-{urlId}` (handled in Task 8 + the Task 4 fallback when the resolved type is a discussion).

**Step 5:** Commit: `feat(routing): dedicated /d/ namespace for discussions + questions (SSR)`.

---

### Task 6: Fix the broken `/feed/${id}` card fallback (#4)

**Files:**
- Modify: `components/UnifiedContentCard/UnifiedContentCard.tsx:109-117`
- Modify: `components/SavedItemCard/SavedItemCard.tsx:63-68`

**Step 1 (TDD where possible):** Build `cardUrl` via the Task 3 helpers from `urlId` + kind:
- discussion/question → `buildDiscussionPath(slug, urlId)`
- aggregated link (has `source`) → `buildSourcePath(source.slug, slug, urlId)`
- member content → `buildMemberPath(author.username, slug, urlId)`
- If `urlId` is somehow missing → render the card **without** a broken link (no `/feed/${id}`); log to Sentry.

**Step 2:** Ensure `content.getFeed` and `discussion.*` queries **select `urlId`** and pass it to the card (modify the tRPC selects + the `_client.tsx` prop mapping at `app/(app)/feed/_client.tsx:226-262` and `app/(app)/discussions/_client.tsx:165-173`).

**Step 3:** Manual verify: the screenshot's link card now navigates to a real page, never `/[id]`.

**Step 4:** Commit: `fix(feed): build content urls from urlId; kill /feed/:id fallback`.

---

### Task 7: Feed sources → `/s/{sourceSlug}`

**Files:**
- Create: `app/(app)/s/[sourceSlug]/page.tsx` (move from `[username]` source branch)
- Create: `app/(app)/s/[sourceSlug]/[slug]/page.tsx` (aggregated article; canonical = original source URL)
- Modify: `app/(app)/[username]/page.tsx` (drop the source-slug fallback; `[username]` = users only)

**Step 1:** Aggregated link detail page emits `<link rel="canonical" href={originalSourceUrl}>` (NOT Codú) — we republish, we don't outrank the source.

**Step 2:** Source profile + aggregated article 301s handled in Task 8.

**Step 3:** Commit: `feat(routing): move feed sources under /s/ namespace`.

---

### Task 8: Redirect map (one hop) + comment anchors

**Files:**
- Modify: `next.config.js:27-54` (`redirects()`)
- Modify: `app/(app)/articles/[slug]/page.tsx` (already redirect-only — point at new canonical)

**Step 1:** Add permanent redirects (single hop, point directly at final canonical):
- `/feed/:sourceSlug` → `/s/:sourceSlug`
- `/feed/:sourceSlug/:articleId` → `/s/:sourceSlug/:articleId`
- Old `/{sourceSlug}` and `/{sourceSlug}/{slug}` source URLs → `/s/...` (route-level redirect in the `[username]` resolver when the segment resolves to a source, not a user)
- `/articles/:slug` → resolve → `/{username}/{slug}-{urlId}`

**Step 2:** Remove the now-obsolete `/feed/:sourceSlug → /:sourceSlug` rule (it caused the `/[id]` 404 chain). Verify **no redirect chains** (old → final in one hop).

**Step 3:** Commit: `feat(seo): one-hop 301 redirect map for legacy content urls`.

---

### Task 9: Global case + trailing-slash normalization

**Files:**
- Modify: `next.config.js` (`trailingSlash: false`) and/or a lightweight `middleware.ts`

**Step 1:** Enforce no trailing slash + lowercase host/path for content routes; 301 `/Niall-Maher/...` → lowercase. Keep middleware minimal (it runs on every request).

**Step 2:** Commit: `feat(seo): normalize trailing slash + case to canonical`.

---

## Phase 2 — Structured data (extend `lib/structured-data/`)

> JSON-LD templates for all four page types are in the **Appendix** below.

### Task 10: `DiscussionForumPosting` builder (priority #1)

**Files:**
- Create: `lib/structured-data/schemas/discussion-forum-posting.ts`
- Create: `lib/structured-data/schemas/discussion-forum-posting.test.ts`
- Modify: `lib/structured-data/index.ts` (export), `lib/structured-data/types.ts` (types)
- Wire into: `app/(app)/d/[slug]/page.tsx`

**Step 1 (TDD):** Test that the builder emits `@type: "DiscussionForumPosting"`, `headline`, `datePublished`, honest `dateModified`, `author` as `Person` with `url` → profile, `interactionStatistic` (comment/upvote counts), and `comment: Comment[]` each with `author` + `dateCreated` + `text`.

**Step 2-4:** Implement → pass.

**Step 5:** Commit: `feat(seo): DiscussionForumPosting + nested Comment JSON-LD`.

---

### Task 11: `ProfilePage` builder (priority #3)

**Files:**
- Create: `lib/structured-data/schemas/profile-page.ts` (+ test)
- Wire into: `app/(app)/[username]/page.tsx`

**Step 1 (TDD):** `@type: "ProfilePage"`, `mainEntity` = `Person` (name, url, image, sameAs socials), `dateCreated`. Establishes the author as an entity (E-E-A-T).

**Step 5:** Commit: `feat(seo): ProfilePage JSON-LD on user profiles`.

---

### Task 12: Article audit + remove SearchAction

**Files:**
- Modify: `lib/structured-data/schemas/article.ts`, `lib/structured-data/schemas/website.ts`

**Step 1:** Ensure `Article` emits honest `dateModified` (from `posts.updatedAt`), `image`, `author.url` → `/{username}`, and `BlogPosting`/`Article` type. Member link-posts use the same builder with Codú canonical.

**Step 2:** Remove `SearchAction` from `website.ts` (sitelinks search box deprecated). Drop the `SearchAction` export from `index.ts` if unused.

**Step 3:** Commit: `chore(seo): honest dateModified, author.url; drop deprecated SearchAction`.

---

### Task 13 + 14: Breadcrumbs + Organization

**Files:** `app/(app)/[username]/[slug]/page.tsx`, `app/(app)/d/[slug]/page.tsx`, homepage/marketing layout.

**Step 1:** `BreadcrumbList` on article (`Home › {username} › title`) and discussion (`Home › Discussions › title`) pages using existing `getBreadcrumbSchema`.

**Step 2:** Verify `Organization` (logo + `sameAs` socials/GitHub) on the homepage via existing `getOrganizationSchema`.

**Step 3:** Commit: `feat(seo): breadcrumbs on content + verify Organization on home`.

---

## Phase 3 — AEO

### Task 15: Harden `robots.ts`

**Files:** `app/robots.ts`

**Step 1:** Add `ClaudeBot`, `Claude-User`, `OAI-SearchBot` to the explicit allow list. **Critical fix:** give every named AI-bot rule the **same `disallow` array** as the `*` rule (a named user-agent rule overrides `*`, so the current rules expose `/settings/`, `/api/`, `/draft/`, `/notifications/` to AI crawlers). Factor the disallow list into a shared const.

**Step 2:** Commit: `fix(seo): stop leaking private routes to AI crawlers; add ClaudeBot/OAI-SearchBot`.

---

### Task 16: Rewrite sitemap, split by type

**Files:** `app/sitemap.ts` (consider `app/sitemap.xml/route.ts` for a sitemap index)

**Step 1:** Rebuild from current tables (`posts`/`user`, not legacy `post`): split sections — **articles** (`/{username}/{slug}-{urlId}`), **discussions** (`/d/{slug}-{urlId}`), **profiles** (`/{username}`, **filter `username IS NOT NULL`**), **sources** (`/s/...`). Honest `lastModified` from `updatedAt`. Exclude cross-posted (`canonicalUrl IS NOT NULL`) and aggregated-source items where canonical points off-site.

**Step 2:** Split into a sitemap index if any section exceeds ~5k URLs.

**Step 3:** Commit: `feat(seo): rebuild sitemap on new url scheme, split by type`.

---

### Task 17: Bing IndexNow

**Files:**
- Create: `public/{indexnow-key}.txt`, `server/lib/indexnow.ts`
- Wire into: publish/edit/delete in `server/api/router/content.ts`, `admin.ts` (approval)

**Step 1:** On publish/approve/edit/delete, POST the canonical URL to IndexNow (`https://api.indexnow.org/indexnow`) with the key. Fire-and-forget, wrapped in try/catch + Sentry. Verify Bing Webmaster Tools separately (ops task).

**Step 2:** Commit: `feat(aeo): IndexNow ping on content publish/edit/delete`.

---

### Task 18 + 19: llms.txt + quotable structure

**Files:** `app/llms.txt/route.ts` (or `public/llms.txt`); article rendering components.

**Step 1:** Serve `llms.txt` (site summary + key section links). Low effort, optional payoff.

**Step 2:** Guidance/UX: article pages lead with a 2–3 sentence summary; encourage H2s phrased as questions with a direct first-sentence answer (template/placeholder in the editor). Mark up nothing fake.

**Step 3:** Commit: `feat(aeo): llms.txt + quotable article summary slot`.

---

## Phase 4 — Replies tab (#3) + badge link (#1)

### Task 20 + 21: Profile "Replies" tab

**Files:**
- Modify: `server/api/router/engagement.ts` or `profile.ts` (new query: a user's comments joined to parent discussion `slug`+`urlId` for anchor links)
- Modify: `app/(app)/[username]/_usernameClient.tsx:118` (add `"Replies"` to `TABS`) + a new panel (mirror the Posts panel style)

**Step 1 (TDD on the query shape):** Query returns `{ body, createdAt, discussionTitle, href: /d/{slug}-{urlId}#comment-{id} }[]`.

**Step 2:** Add the tab + panel; each reply links to its anchor permalink.

**Step 3:** Commit: `feat(profile): Replies tab linking to comment anchors`.

---

### Task 22: Fix "See your badges" → /settings (#1)

**Files:** `app/(app)/layout.tsx:52-58`, `components/Celebrate/BadgeUnlock.tsx:31`

**Step 1:** Root cause is a null `username` (handle-less account) falling back to `/settings`. Verify the layout query threads `username` correctly; if a user can reach the celebration without a username, send them to `/settings/profile` with a toast "set a username to get your public profile" instead of a bare `/settings`. Otherwise the `/{username}?tab=achievements` link is correct.

**Step 2:** Commit: `fix(celebrate): robust See-your-badges destination when handle unset`.

---

## Phase 5 — Tests & migration

### Task 23: Playwright e2e

**Files:** `e2e/content-urls.spec.ts` (new), extend `e2e/setup.ts` seed if needed.

**Step 1:** Cover, with assertions:
- article page renders at `/{username}/{slug}-{urlId}` (200, title in HTML)
- discussion page renders at `/d/{slug}-{urlId}` (200, OP + a comment in HTML)
- profile renders at `/{username}` (200)
- **301**: old `/{username}/{old-slug}` → new canonical; junk slug + real id → canonical; old discussion path → `/d/...`; uppercase → lowercase
- broken-fallback regression: a feed/discussion card link never resolves to `/[id]`
- deleted content → 410
- `Replies` tab lists a comment and links to `#comment-{id}`

**Step 2:** Commit: `test(e2e): content url scheme, redirects, replies tab`.

---

### Task 24: Migration & launch checklist (ops, at deploy)

- [ ] Run `urlId` backfill in every env; then the `NOT NULL` migration (Task 1 Step 4).
- [ ] Build the full redirect map; confirm one hop, no chains (crawl with a tool).
- [ ] Resubmit split sitemaps in Google Search Console **and** Bing Webmaster Tools.
- [ ] Verify IndexNow key file is reachable; confirm pings in Bing.
- [ ] Watch GSC + Bing coverage for 404/410 spikes for 2 weeks.
- [ ] Confirm OG/Twitter URLs == canonical on a sample of each page type.

---

## Appendix — JSON-LD templates

### A. Article / BlogPosting (`/{username}/{slug}-{urlId}`)
```json
{
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  "headline": "Why RAG beats fine-tuning for most apps",
  "datePublished": "2026-06-01T09:00:00Z",
  "dateModified": "2026-06-09T14:12:00Z",
  "image": ["https://www.codu.co/.../cover.png"],
  "author": {
    "@type": "Person",
    "name": "Niall Maher",
    "url": "https://www.codu.co/niall-maher"
  },
  "publisher": { "@type": "Organization", "name": "Codú", "logo": { "@type": "ImageObject", "url": "https://www.codu.co/logo.png" } },
  "mainEntityOfPage": "https://www.codu.co/niall-maher/why-rag-beats-finetuning-a1b2c3d4"
}
```

### B. DiscussionForumPosting (`/d/{slug}-{urlId}`)
```json
{
  "@context": "https://schema.org",
  "@type": "DiscussionForumPosting",
  "headline": "How do you test AI agents?",
  "text": "I keep getting flaky runs...",
  "datePublished": "2026-06-08T10:00:00Z",
  "dateModified": "2026-06-09T08:00:00Z",
  "author": { "@type": "Person", "name": "Niall Maher", "url": "https://www.codu.co/niall-maher" },
  "interactionStatistic": [
    { "@type": "InteractionCounter", "interactionType": "https://schema.org/CommentAction", "userInteractionCount": 12 },
    { "@type": "InteractionCounter", "interactionType": "https://schema.org/LikeAction", "userInteractionCount": 34 }
  ],
  "comment": [
    {
      "@type": "Comment",
      "text": "We snapshot the tool-call traces and diff them.",
      "dateCreated": "2026-06-08T11:30:00Z",
      "author": { "@type": "Person", "name": "Dev Two", "url": "https://www.codu.co/dev-two" },
      "url": "https://www.codu.co/d/how-do-you-test-ai-agents-7x8y9z01#comment-5678"
    }
  ]
}
```

### C. ProfilePage (`/{username}`)
```json
{
  "@context": "https://schema.org",
  "@type": "ProfilePage",
  "dateCreated": "2025-02-01T00:00:00Z",
  "mainEntity": {
    "@type": "Person",
    "name": "Niall Maher",
    "url": "https://www.codu.co/niall-maher",
    "image": "https://www.codu.co/.../avatar.png",
    "description": "Building Codú.",
    "sameAs": ["https://github.com/NiallJoeMaher", "https://twitter.com/..."]
  }
}
```

### D. BreadcrumbList (articles + discussions)
```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Codú", "item": "https://www.codu.co/" },
    { "@type": "ListItem", "position": 2, "name": "Discussions", "item": "https://www.codu.co/discussions" },
    { "@type": "ListItem", "position": 3, "name": "How do you test AI agents?", "item": "https://www.codu.co/d/how-do-you-test-ai-agents-7x8y9z01" }
  ]
}
```
