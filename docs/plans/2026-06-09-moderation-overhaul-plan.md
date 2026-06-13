# Moderation Overhaul Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. When implementing the Bedrock call (Phase 3), REQUIRED SUB-SKILL: read the claude-api skill first for the correct Bedrock model id / Messages API shape.

**Goal:** Add Bedrock Haiku auto-review + freshness dedupe + a real flag button + a working admin queue to Codú's publish flow, fix the broken moderation-email link, and guarantee content is only ever hidden (never deleted).

**Architecture:** Auto-review runs synchronously inside the publish path (no queue exists). The currently-duplicated moderation gate (in `content.ts` create/update/publish AND `post.ts` create/update) is unified into one `server/lib/moderation.ts` helper that all paths call. Pure logic (URL normalize, verdict parse, link fetch, policy) is extracted into small, unit-tested functions. Everything is gated behind `MODERATION_ENABLED`; Bedrock is independently gated by its env vars and fails open.

**Tech Stack:** Next.js, tRPC, Drizzle ORM (Postgres), AWS SDK v3 (`@aws-sdk/client-bedrock-runtime`), Bedrock (Claude Haiku), DynamoDB rate limiter, SES email, Vitest (new, pure-logic units), Playwright (E2E flows).

**Design doc:** `docs/plans/2026-06-09-moderation-overhaul-design.md`

---

## Conventions for the executor

- The **active editor publish path is `api.content.*`** (`server/api/router/content.ts`): `content.create` (~529), `content.update` (~655), `content.publish` (~1264). `post.ts` create/update (~447/~549) are a parallel copy. Both write the `posts` table. The unified helper must be wired into **all five** call sites.
- The DB post-status enum already has `in_review` and `rejected` (`server/db/schema.ts:38-47`). The my-posts badges (`app/(app)/my-posts/_client.tsx:152-161`) and `content.myDrafts` filter (`content.ts:1180`) already surface them.
- Credentials: runtime AWS uses `process.env.ACCESS_KEY`/`SECRET_KEY` (NOT standard AWS names), region per-service. Mirror `utils/s3helpers.ts`.
- Commit after every task. Run `npm run lint` before each commit.

---

## Phase 0 — Tooling & schema foundations

### Task 0.1: Add Vitest for pure-logic unit tests

**Files:**
- Modify: `package.json` (devDeps + scripts)
- Create: `vitest.config.ts`
- Create: `server/lib/__tests__/smoke.test.ts` (temporary, deleted in Task 0.2)

**Step 1:** Install: `npm i -D vitest`

**Step 2:** Create `vitest.config.ts`:
```ts
import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["**/*.test.ts"],
    exclude: ["**/node_modules/**", "e2e/**", "**/*.spec.ts"],
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, ".") },
  },
});
```
Note: `include` is `*.test.ts` only (not `.tsx`) so it never collides with Playwright's `*.spec.ts` or the abandoned `.test.tsx` component files. Confirm Playwright's test glob in `playwright.config.ts` is `*.spec.ts` / an `e2e` dir; if Playwright also matches `*.test.ts`, narrow Vitest's include to `server/**` + `utils/**` and exclude in Playwright.

**Step 3:** Add scripts to `package.json`:
```json
"test:unit": "vitest run",
"test:unit:watch": "vitest"
```

**Step 4:** Create smoke test `server/lib/__tests__/smoke.test.ts`:
```ts
import { describe, it, expect } from "vitest";
describe("vitest", () => {
  it("runs", () => expect(1 + 1).toBe(2));
});
```

**Step 5:** Run `npm run test:unit` → expect 1 passing test.

**Step 6:** Commit: `git add -A && git commit -m "chore(test): add vitest for unit tests"`

---

### Task 0.2: Schema migration — moderation columns + pg_trgm

**Files:**
- Modify: `server/db/schema.ts` (posts table ~325-400; content_report ~1691-1758)
- Modify: `schema/post.ts:14-20` (PostStatusSchema)
- Generate: `drizzle/00XX_*.sql` via `npm run db:generate`
- Delete: `server/lib/__tests__/smoke.test.ts`

**Step 1:** In `server/db/schema.ts` `posts` table, add two columns (mirror existing `externalUrl` text column):
```ts
moderationNote: text("moderationNote"),
externalUrlNormalized: text("externalUrlNormalized"),
```
And in the posts index block, add:
```ts
externalUrlNormalizedIdx: index("posts_external_url_normalized_idx").on(
  table.externalUrlNormalized,
),
```

**Step 2:** In `content_report` table (~1691), add a nullable FK mirroring `contentId`:
```ts
postId: text("postId").references(() => posts.id, {
  onDelete: "cascade",
  onUpdate: "cascade",
}),
```
Add index in its `(table) => ({...})` block:
```ts
postIdIndex: index("ContentReport_postId_index").on(table.postId),
```
And in `contentReportRelations` add:
```ts
post: one(posts, {
  fields: [content_report.postId],
  references: [posts.id],
}),
```

**Step 3:** Update `schema/post.ts:14-20` PostStatusSchema to include the moderation states (so update mutations can carry them and types line up):
```ts
export const PostStatusSchema = z.enum([
  "draft", "published", "scheduled", "unlisted", "in_review", "rejected",
]);
```

**Step 4:** Generate migration: `npm run db:generate`. Then **hand-edit the generated SQL** to prepend the trigram extension + index (drizzle won't emit these):
```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;
-- after the columns are added:
CREATE INDEX IF NOT EXISTS posts_title_trgm_idx ON "posts" USING gin (lower("title") gin_trgm_ops);
```
(The GIN trigram index makes the discussion-similarity query in Task 2.3 fast.)

**Step 5:** Apply locally: `npm run db:migrate`. Verify columns exist (psql or drizzle studio).

**Step 6:** Delete the smoke test. Run `npm run lint`.

**Step 7:** Commit: `git add -A && git commit -m "feat(db): moderation columns, post report FK, pg_trgm"`

---

## Phase 1 — Email link bug fix (isolated quick win)

### Task 1.1: `getAppOrigin()` helper (Vitest TDD)

**Files:**
- Create: `server/lib/url.ts`
- Create: `server/lib/url.test.ts`

**Step 1 (failing test):** `server/lib/url.test.ts`:
```ts
import { describe, it, expect, afterEach } from "vitest";
import { getAppOrigin } from "./url";

const save = { ...process.env };
afterEach(() => { process.env = { ...save }; });

describe("getAppOrigin", () => {
  it("strips a path like /api/auth from NEXTAUTH_URL", () => {
    process.env.NEXTAUTH_URL = "http://localhost:3000/api/auth";
    expect(getAppOrigin()).toBe("http://localhost:3000");
  });
  it("prefers DOMAIN_NAME as https origin", () => {
    process.env.DOMAIN_NAME = "www.codu.co";
    expect(getAppOrigin()).toBe("https://www.codu.co");
  });
  it("falls back to localhost", () => {
    delete process.env.DOMAIN_NAME; delete process.env.VERCEL_URL;
    delete process.env.NEXTAUTH_URL; delete process.env.AUTH_URL;
    expect(getAppOrigin()).toBe("http://localhost:3000");
  });
});
```

**Step 2:** `npm run test:unit -- url` → FAIL (module missing).

**Step 3:** Implement `server/lib/url.ts`:
```ts
/**
 * The app's public origin (scheme + host, NO path). Use this for app-facing
 * links in emails. NEXTAUTH_URL carries a /api/auth path which must be stripped
 * — interpolating it directly produced .../api/auth/admin/moderation (bug).
 */
export function getAppOrigin(): string {
  const domain = process.env.DOMAIN_NAME || process.env.VERCEL_URL;
  if (domain) return `https://${domain.replace(/^https?:\/\//, "")}`;
  const raw = process.env.NEXTAUTH_URL || process.env.AUTH_URL;
  if (raw) {
    try { return new URL(raw).origin; } catch { /* fall through */ }
  }
  return "http://localhost:3000";
}
```

**Step 4:** `npm run test:unit -- url` → PASS.

**Step 5:** Commit: `git commit -am "feat: getAppOrigin helper (origin-only, no path)"`

---

### Task 1.2: Use `getAppOrigin` in moderation email

**Files:** Modify `server/lib/moderation.ts:28-53`

**Step 1:** Replace the broken base (`moderation.ts:35-36`) and link (`:46`):
```ts
import { getAppOrigin } from "@/server/lib/url";
// ...
const base = getAppOrigin();
// ...
<p><a href="${base}/admin/moderation?item=${opts.postId}">Review it in the moderation queue →</a></p>
```

**Step 2:** Manual verify: with `NEXTAUTH_URL=http://localhost:3000/api/auth`, trigger a review email (or unit-test the URL build). Confirm link is `http://localhost:3000/admin/moderation?item=<id>`.

**Step 3:** Commit: `git commit -am "fix(email): moderation link points to /admin/moderation page (was /api/auth/...)"`

---

### Task 1.3: Audit other email builders for the same bug

**Files:** `server/api/router/report.ts` (getBaseUrl ~44), `utils/createArticleReportEmailTemplate.ts` (~19), any password-less auth email.

**Step 1:** Grep: `grep -rn "NEXTAUTH_URL\|getBaseUrl" server utils app | grep -iv test`. The two `getBaseUrl()` copies use `DOMAIN_NAME||VERCEL_URL` (already correct-ish but duplicated). Replace both with `getAppOrigin()` and delete the duplicates (DRY).

**Step 2:** Manual/grep verify no remaining `${...NEXTAUTH_URL...}/` app-link interpolation.

**Step 3:** Commit: `git commit -am "refactor(email): single getAppOrigin, drop duplicated getBaseUrl"`

---

## Phase 2 — URL normalize + freshness dedupe

### Task 2.1: `normalizeUrl()` (Vitest TDD)

**Files:** Create `server/lib/normalizeUrl.ts` + `server/lib/normalizeUrl.test.ts`

**Step 1 (failing test):**
```ts
import { describe, it, expect } from "vitest";
import { normalizeUrl } from "./normalizeUrl";

describe("normalizeUrl", () => {
  it("lowercases host, strips www and trailing slash", () => {
    expect(normalizeUrl("https://WWW.Example.com/Path/"))
      .toBe("https://example.com/Path");
  });
  it("drops tracking params but keeps meaningful ones", () => {
    expect(normalizeUrl("https://x.com/a?utm_source=t&id=5&fbclid=z"))
      .toBe("https://x.com/a?id=5");
  });
  it("drops the fragment", () => {
    expect(normalizeUrl("https://x.com/a#section")).toBe("https://x.com/a");
  });
  it("returns null for non-http input", () => {
    expect(normalizeUrl("javascript:alert(1)")).toBeNull();
    expect(normalizeUrl("not a url")).toBeNull();
  });
});
```

**Step 2:** Run → FAIL.

**Step 3:** Implement `normalizeUrl.ts`:
```ts
const TRACKING = /^(utm_|ref$|ref_|fbclid$|gclid$|mc_|igshid$)/i;

/** Normalise an external URL for dedupe. Returns null if not http(s). */
export function normalizeUrl(input: string): string | null {
  let u: URL;
  try { u = new URL(input.trim()); } catch { return null; }
  if (u.protocol !== "http:" && u.protocol !== "https:") return null;
  u.hostname = u.hostname.toLowerCase().replace(/^www\./, "");
  u.hash = "";
  const keep = new URLSearchParams();
  for (const [k, v] of u.searchParams) if (!TRACKING.test(k)) keep.append(k, v);
  // stable order
  keep.sort();
  u.search = keep.toString();
  let out = u.toString();
  if (out.endsWith("/") && u.pathname !== "/") out = out.slice(0, -1);
  return out;
}
```

**Step 4:** Run → PASS. (Adjust expected test strings to the impl's exact output if param-ordering differs — keep tests and impl in sync.)

**Step 5:** Commit: `git commit -am "feat: normalizeUrl for link dedupe"`

---

### Task 2.2: Link freshness dedupe (6-month window)

**Files:** Create `server/lib/dedupe.ts` + `server/lib/dedupe.test.ts` (pure predicate); wire into `content.ts` create/update and `post.ts`.

**Step 1 (failing test for the pure predicate):** Extract the decision as a pure function so it's unit-testable without a DB:
```ts
import { describe, it, expect } from "vitest";
import { isWithinFreshnessWindow } from "./dedupe";

describe("isWithinFreshnessWindow", () => {
  const now = new Date("2026-06-09T00:00:00Z");
  it("true when existing post is < 6 months old", () => {
    expect(isWithinFreshnessWindow(new Date("2026-03-01T00:00:00Z"), now)).toBe(true);
  });
  it("false when existing post is > 6 months old", () => {
    expect(isWithinFreshnessWindow(new Date("2025-01-01T00:00:00Z"), now)).toBe(false);
  });
});
```

**Step 2:** Run → FAIL.

**Step 3:** Implement in `server/lib/dedupe.ts`:
```ts
export const FRESHNESS_MONTHS = 6;

export function isWithinFreshnessWindow(publishedAt: Date, now: Date): boolean {
  const cutoff = new Date(now);
  cutoff.setMonth(cutoff.getMonth() - FRESHNESS_MONTHS);
  return publishedAt >= cutoff;
}

/** Query helper: returns an existing fresh post sharing this normalized URL. */
export async function findFreshDuplicateLink(
  db: typeof import("@/server/db").db,
  normalized: string,
): Promise<{ id: string; slug: string | null } | null> {
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - FRESHNESS_MONTHS);
  const { posts } = await import("@/server/db/schema");
  const { and, eq, gte } = await import("drizzle-orm");
  const rows = await db
    .select({ id: posts.id, slug: posts.slug })
    .from(posts)
    .where(and(
      eq(posts.externalUrlNormalized, normalized),
      eq(posts.status, "published"),
      gte(posts.publishedAt, cutoff.toISOString()),
    ))
    .limit(1);
  return rows[0] ?? null;
}
```
(Adjust imports to match the repo's existing import style at the top of the file rather than dynamic import if the executor prefers; dynamic import shown only to keep the snippet self-contained.)

**Step 4:** Run unit test → PASS.

**Step 5:** Wire into `content.create` (~554, the `link`/`resource` branch) and `content.update`/`content.publish` going-live, and `post.create`/`post.update`. For `link`/`resource` with an `externalUrl`:
```ts
const normalized = normalizeUrl(input.externalUrl);
if (normalized) {
  const dupe = await findFreshDuplicateLink(ctx.db, normalized);
  if (dupe) {
    throw new TRPCError({
      code: "CONFLICT",
      message: "This link was already shared recently. Find it on Codú instead of reposting.",
    });
  }
}
// store the normalized value:
externalUrlNormalized: normalized,
```
**DRY note:** these checks belong in the unified gate helper from Phase 4 — if doing Phase 4 first, add this there. Otherwise add here and migrate.

**Step 6:** Verify via E2E in Phase 10 (post a link twice → second is rejected). For now manual check.

**Step 7:** Commit: `git commit -am "feat(moderation): 6-month link freshness dedupe"`

---

### Task 2.3: Discussion/question similarity dedupe (pg_trgm)

**Files:** Add to `server/lib/dedupe.ts`; wire into the `discussion`/`question` branch of create.

**Step 1:** Implement a query using the trigram index from Task 0.2:
```ts
/** Find a recent same/very-similar discussion or question by title. */
export async function findSimilarDiscussion(
  db: typeof import("@/server/db").db,
  title: string,
): Promise<{ id: string; slug: string | null; similarity: number } | null> {
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - FRESHNESS_MONTHS);
  const { sql } = await import("drizzle-orm");
  // similarity() from pg_trgm; threshold tuned below.
  const rows = await db.execute(sql`
    SELECT id, slug, similarity(lower(title), lower(${title})) AS sim
    FROM "posts"
    WHERE type IN ('discussion','question')
      AND status = 'published'
      AND "publishedAt" >= ${cutoff.toISOString()}
      AND similarity(lower(title), lower(${title})) > 0.5
    ORDER BY sim DESC
    LIMIT 1
  `);
  const r = (rows as unknown as { rows: any[] }).rows?.[0];
  return r ? { id: r.id, slug: r.slug, similarity: Number(r.sim) } : null;
}
```
(Confirm the drizzle `db.execute` return shape in this codebase — adjust `.rows` access accordingly.)

**Step 2:** Wire into create for `discussion`/`question`:
```ts
if (input.type === "discussion" || input.type === "question") {
  const similar = await findSimilarDiscussion(ctx.db, input.title);
  if (similar && similar.similarity >= 0.8) {
    throw new TRPCError({ code: "CONFLICT",
      message: "This has already been asked recently — join the existing discussion." });
  }
  if (similar) {
    // very similar but not near-identical → let a human decide
    forceInReview = true; // consumed by the gate to set status in_review
  }
}
```

**Step 3:** Tune thresholds (0.5 candidate / 0.8 block / between → review) against real titles during verification; document chosen values in a comment.

**Step 4:** Commit: `git commit -am "feat(moderation): discussion/question similarity dedupe via pg_trgm"`

---

## Phase 3 — Bedrock Haiku auto-review

### Task 3.1: Bedrock client (mockable)

**Files:** `package.json`; create `server/lib/bedrock.ts`

**Step 1:** `npm i @aws-sdk/client-bedrock-runtime`

**Step 2:** Create `server/lib/bedrock.ts` mirroring `s3helpers.ts` + the email mock pattern:
```ts
import { BedrockRuntimeClient } from "@aws-sdk/client-bedrock-runtime";

const hasKeys = process.env.ACCESS_KEY && process.env.SECRET_KEY;

export const bedrockClient = new BedrockRuntimeClient({
  region: process.env.BEDROCK_REGION || "eu-west-1",
  ...(hasKeys ? {
    credentials: {
      accessKeyId: process.env.ACCESS_KEY || "",
      secretAccessKey: process.env.SECRET_KEY || "",
    },
  } : {}),
});

export function isBedrockEnabled(): boolean {
  return Boolean(process.env.BEDROCK_MODEL_ID && process.env.ACCESS_KEY);
}
```

**Step 3:** Commit: `git commit -am "feat: bedrock runtime client"`

---

### Task 3.2: `parseVerdict()` (Vitest TDD)

**Files:** `server/lib/autoReview.ts` (start it) + `server/lib/autoReview.test.ts`

**Step 1 (failing test):**
```ts
import { describe, it, expect } from "vitest";
import { parseVerdict } from "./autoReview";

describe("parseVerdict", () => {
  it("parses an allow verdict", () => {
    expect(parseVerdict('{"verdict":"allow","category":"none","reason":""}'))
      .toEqual({ verdict: "allow", category: "none", reason: "" });
  });
  it("parses a review verdict with reason", () => {
    const v = parseVerdict('{"verdict":"review","category":"crypto","reason":"token shill"}');
    expect(v.verdict).toBe("review");
    expect(v.category).toBe("crypto");
  });
  it("defaults to allow (fail-open) on garbage", () => {
    expect(parseVerdict("not json").verdict).toBe("allow");
  });
  it("treats unknown verdict string as review (fail-safe for content)", () => {
    expect(parseVerdict('{"verdict":"banana"}').verdict).toBe("review");
  });
});
```
Design note for the executor: parsing **garbage/empty** (model/infra failure) fails **open** (allow — never block on infra failure), but a successfully-parsed-but-unexpected verdict value fails **safe** (review). Encode exactly that.

**Step 2:** Run → FAIL.

**Step 3:** Implement `parseVerdict` in `autoReview.ts`:
```ts
export type Verdict = { verdict: "allow" | "review"; category: string; reason: string };

export function parseVerdict(raw: string): Verdict {
  let obj: any;
  try { obj = JSON.parse(extractJson(raw)); }
  catch { return { verdict: "allow", category: "none", reason: "unparseable" }; }
  const v = obj?.verdict;
  if (v === "allow") return { verdict: "allow", category: obj.category ?? "none", reason: obj.reason ?? "" };
  // any explicit non-allow (including unknown) → review
  return { verdict: "review", category: obj?.category ?? "unknown", reason: obj?.reason ?? "" };
}

function extractJson(raw: string): string {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  return start >= 0 && end > start ? raw.slice(start, end + 1) : raw;
}
```

**Step 4:** Run → PASS. Commit: `git commit -am "feat: parseVerdict for auto-review"`

---

### Task 3.3: Link page fetch util (Vitest TDD with injected fetch)

**Files:** `server/lib/fetchPage.ts` + `server/lib/fetchPage.test.ts`

**Step 1 (failing test, inject fetch):**
```ts
import { describe, it, expect } from "vitest";
import { extractReadableText } from "./fetchPage";

describe("extractReadableText", () => {
  it("pulls title and strips tags/scripts", () => {
    const html = "<html><head><title>Hi</title></head><body><script>x</script><p>Hello world</p></body></html>";
    const out = extractReadableText(html);
    expect(out).toContain("Hi");
    expect(out).toContain("Hello world");
    expect(out).not.toContain("script");
  });
  it("caps length", () => {
    const out = extractReadableText("<p>" + "a".repeat(10000) + "</p>");
    expect(out.length).toBeLessThanOrEqual(4000);
  });
});
```

**Step 2:** Run → FAIL.

**Step 3:** Implement `fetchPage.ts`:
```ts
const MAX_TEXT = 4000;

export function extractReadableText(html: string): string {
  const title = /<title[^>]*>([^<]*)<\/title>/i.exec(html)?.[1]?.trim() ?? "";
  const body = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return `${title}\n${body}`.slice(0, MAX_TEXT);
}

/** Fetch a URL with a hard timeout + size cap; returns readable text or "". Never throws. */
export async function fetchPageText(url: string, timeoutMs = 4000): Promise<string> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: ctrl.signal, redirect: "follow",
      headers: { "user-agent": "CoduModerationBot/1.0" } });
    if (!res.ok) return "";
    const html = (await res.text()).slice(0, 200_000);
    return extractReadableText(html);
  } catch { return ""; }
  finally { clearTimeout(t); }
}
```

**Step 4:** Run → PASS. Commit: `git commit -am "feat: fetchPageText link pre-visit util"`

---

### Task 3.4: `autoReview()` — Haiku call (REQUIRED SUB-SKILL: claude-api)

**Files:** finish `server/lib/autoReview.ts`

**Step 1:** READ the claude-api skill to confirm: the correct Bedrock Haiku model id / regional inference-profile for `BEDROCK_MODEL_ID`, and the Bedrock `InvokeModel` Messages API request/response JSON shape. Default to the latest Haiku.

**Step 2:** Implement, gated + fail-open, returning a `Verdict`:
```ts
import { bedrockClient, isBedrockEnabled } from "./bedrock";
import { InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";
import { fetchPageText } from "./fetchPage";
import { screenContent } from "./moderation";

const SYSTEM = `You are the content moderator for Codú, a community for AI builders and indie hackers.
Be LOOSE AND FAIR. Allow by default — including people sharing their own projects, launches, and side-projects.
Only return "review" for the obvious: pornographic/NSFW content, crypto/token/coin shilling, malicious or scam links,
dead or fake sources, or content plainly off-theme for a developer community.
Reply ONLY with JSON: {"verdict":"allow"|"review","category":string,"reason":string}.`;

export async function autoReview(input: {
  type: string; title: string; body?: string | null; externalUrl?: string | null;
}): Promise<Verdict> {
  if (!isBedrockEnabled()) {
    // Fall back to the cheap heuristic; never block.
    const s = screenContent({ title: input.title, body: input.body });
    return s.ok ? { verdict: "allow", category: "none", reason: "" }
                : { verdict: "review", category: "heuristic", reason: s.reasons.join(",") };
  }
  let pageText = "";
  if (input.externalUrl) pageText = await fetchPageText(input.externalUrl);
  const userMsg = [
    `Type: ${input.type}`,
    `Title: ${input.title}`,
    input.body ? `Body: ${input.body.slice(0, 4000)}` : "",
    input.externalUrl ? `URL: ${input.externalUrl}` : "",
    pageText ? `Fetched page:\n${pageText}` : "",
  ].filter(Boolean).join("\n");

  try {
    const res = await bedrockClient.send(new InvokeModelCommand({
      modelId: process.env.BEDROCK_MODEL_ID!,
      contentType: "application/json",
      accept: "application/json",
      body: JSON.stringify({
        anthropic_version: "bedrock-2023-05-31", // confirm via claude-api skill
        max_tokens: 200,
        system: SYSTEM,
        messages: [{ role: "user", content: userMsg }],
      }),
    }));
    const decoded = JSON.parse(new TextDecoder().decode(res.body));
    const text = decoded?.content?.[0]?.text ?? ""; // confirm shape via claude-api skill
    return parseVerdict(text);
  } catch (err) {
    // Fail OPEN on infra error — never block publishing.
    Sentry.captureException(err);
    return { verdict: "allow", category: "none", reason: "bedrock-error" };
  }
}
```

**Step 3:** No live Bedrock call in unit tests; `parseVerdict`/`fetchPageText` cover the pure parts. Add a Vitest test that `autoReview` returns `allow` when `isBedrockEnabled()` is false and content is clean (set env accordingly).

**Step 4:** Commit: `git commit -am "feat(moderation): bedrock haiku auto-review (gated, fail-open)"`

---

## Phase 4 — Unify the moderation gate

### Task 4.1: Single `gatePublish()` helper; wire all 5 call sites

**Files:** `server/lib/moderation.ts`; modify `content.ts` (create/update/publish), `post.ts` (create/update)

**Step 1:** Add a single async helper that encapsulates the whole decision, so the five call sites stop duplicating logic:
```ts
export interface GateResult {
  status: "published" | "in_review";
  publishedAt: string | null;
  moderationNote: string | null;
  externalUrlNormalized: string | null;
}

/**
 * Decide the stored status for a would-be-published post.
 * - articles ALWAYS go to in_review (editorial gate)
 * - everything else: auto-review verdict decides (allow→published, review→in_review)
 * - dedupe (link freshness / discussion similarity) handled by callers BEFORE this
 *   (they throw CONFLICT) or pass forceInReview.
 * Returns published if moderation disabled.
 */
export async function gatePublish(input: {
  type: string; title: string; body?: string | null;
  externalUrl?: string | null; forceInReview?: boolean;
}): Promise<GateResult> {
  const normalized = input.externalUrl ? normalizeUrl(input.externalUrl) : null;
  if (!isModerationEnabled()) {
    return { status: "published", publishedAt: new Date().toISOString(),
             moderationNote: null, externalUrlNormalized: normalized };
  }
  if (input.type === "article") {
    const v = await autoReview(input); // advisory note for the human editor
    return { status: "in_review", publishedAt: null,
             moderationNote: noteFrom(v), externalUrlNormalized: normalized };
  }
  if (input.forceInReview) {
    return { status: "in_review", publishedAt: null,
             moderationNote: "similar-existing", externalUrlNormalized: normalized };
  }
  const v = await autoReview(input);
  if (v.verdict === "review") {
    return { status: "in_review", publishedAt: null,
             moderationNote: noteFrom(v), externalUrlNormalized: normalized };
  }
  return { status: "published", publishedAt: new Date().toISOString(),
           moderationNote: null, externalUrlNormalized: normalized };
}

function noteFrom(v: Verdict): string | null {
  return v.verdict === "review" ? `${v.category}: ${v.reason}`.slice(0, 500) : null;
}
```

**Step 2:** In each of the 5 call sites, replace the inline `moderated = ... ; screenContent(...); dbStatus = ...` block with: run dedupe checks (Task 2.2/2.3, throwing CONFLICT or setting forceInReview), then `const gate = await gatePublish({...})`, then write `status: gate.status, publishedAt: gate.publishedAt, moderationNote: gate.moderationNote, externalUrlNormalized: gate.externalUrlNormalized`. Keep the existing `notifyAdminOfReview` call when `gate.status === "in_review"`. Keep the points-award only when `gate.status === "published"`.

**Step 3:** Delete the now-unused inline `screenContent`/`isModerationEnabled` branches in those handlers (they live inside `gatePublish` now). Keep `screenContent` exported (used as the Bedrock fallback).

**Step 4:** Run `npm run lint` + `npm run test:unit`. Manual smoke: publish an article with `MODERATION_ENABLED=true` → `in_review`; publish a clean `til` with Bedrock disabled → `published`.

**Step 5:** Commit: `git commit -am "refactor(moderation): unify publish gate across content & post routers"`

---

## Phase 5 — Flag/report into the DB queue

### Task 5.1: `report.create` accepts posts (postId)

**Files:** `schema/report.ts` (CreateReportSchema), `server/api/router/report.ts` (create ~202)

**Step 1:** Add `postId: z.string().optional()` to `CreateReportSchema` alongside `contentId`/`discussionId`. Require exactly one target.

**Step 2:** In `report.create`, when `postId` is provided: validate the post exists (`db.query` on `posts`), **dedupe per reporter+post** (one open report per user per post), insert `content_report` with `postId`, and email the admin via `getAppOrigin()` → `/admin/moderation?item=<postId>`. Content stays live (no status change).

**Step 3:** Commit: `git commit -am "feat(report): store post reports in DB queue + notify admin"`

---

### Task 5.2: Route post reports through the DB mutation

**Files:** `components/ReportModal/ReportModal.tsx:152-178`

**Step 1:** Change the `type === "post"` branch from `sendReport(...)` (legacy email) to:
```ts
createReport({ postId: id as string, reason: "OTHER", details: reportBody || undefined });
```
Leave `comment`/`article` legacy paths as-is unless they also target `posts` (verify; if articles are `posts`-table, route them through `postId` too).

**Step 2:** Commit: `git commit -am "feat(report): post flags land in admin DB queue, not email-only"`

---

### Task 5.3: Flag button on every content surface

**Files:** feed card (`components/UnifiedContentCard/UnifiedContentCard.tsx`), detail components (`_feedArticleContent.tsx`, `_linkContentDetail.tsx`, `_userLinkDetail.tsx`), confirm `ArticleActionBar`/`ContentDetail/ActionBar` already have it.

**Step 1:** Add `<ReportButton type="post" id={postId} variant="menu" />` (or `icon`) to any surface missing it. Reuse the existing component — do not build a new one.

**Step 2:** Manual check each surface renders the flag affordance and opens the modal.

**Step 3:** Commit: `git commit -am "feat(report): flag button on feed cards and all detail pages"`

---

## Phase 6 — Admin moderation queue

### Task 6.1: Merge in_review + reported-live into the queue

**Files:** `server/api/router/admin.ts` (`listInReview` ~218 → extend/add), `server/api/router/report.ts` (`getAll`/`getCounts`)

**Step 1:** Provide the admin page two lists (or one unified list): (a) posts with `status = in_review` (include `moderationNote`), (b) **live** posts that have open `content_report` rows (join `content_report.postId`, `status = PENDING`), with report count + latest reason. Keep within `adminOnlyProcedure`.

**Step 2:** Commit: `git commit -am "feat(admin): moderation queue shows in-review + reported-live posts"`

---

### Task 6.2: Decline-with-note, hide-live, dismiss-report actions

**Files:** `server/api/router/admin.ts` (`moderatePost` ~239)

**Step 1:** Extend `moderatePost`:
- `approve` → `published` + publishedAt + award (exists).
- `reject` (decline) → `rejected`, set `moderationNote` from an optional `note` input ("Hidden by moderator" reason). **Do not delete.**
- New `hide` decision (for a live reported post) → `in_review` (or `rejected`), allowed when `status = published`. Loosen the current `status !== "in_review"` guard to also allow `published` for `hide`.

**Step 2:** Add `report.review` usage so dismissing a report sets `content_report.status = DISMISSED`/`ACTIONED` and stamps `reviewedById`/`reviewedAt` (the procedure already exists — wire the UI to it).

**Step 3:** Commit: `git commit -am "feat(admin): decline-with-note, hide-live, dismiss-report"`

---

### Task 6.3: Admin queue UI

**Files:** `app/(app)/admin/moderation/_client.tsx`

**Step 1:** Render both lists; show `moderationNote` (why auto-flagged) and report details. Wire Approve / Decline(+note) / Hide / Dismiss buttons to the mutations. Honour the `?item=<postId>` query param from the email to scroll/highlight that item.

**Step 2:** Manual verify the full loop: flag a post → appears in queue → decline → author sees "Hidden by moderator".

**Step 3:** Commit: `git commit -am "feat(admin): moderation queue UI actions + deep-link"`

---

## Phase 7 — Loader UX + author visibility

### Task 7.1: "Reviewing your post" loader

**Files:** `app/(editor)/create/[[...paramsArr]]/_client.tsx` (publish flow ~204-249, loading ~195-198)

**Step 1:** While `publishStatus === "pending"`, show a themed overlay "Reviewing your post…" with 3-4 rotating playful lines (auto-review can take a few seconds). On resolve, branch on returned `status`: `published` → go to the post; `in_review` → a "Submitted for review" confirmation explaining it's awaiting approval (don't route to a 404'd detail page).

**Step 2:** Manual verify both branches (toggle `MODERATION_ENABLED`).

**Step 3:** Commit: `git commit -am "feat(editor): auto-review loader + submitted-for-review state"`

---

### Task 7.2: Author can view their own hidden post

**Files:** `app/(app)/[username]/[slug]/page.tsx` (`getUserPost` where-clause ~75-91)

**Step 1:** The detail fetcher hard-filters `status = published`, so an author hitting their own `in_review`/`rejected` post gets a 404. Add an **owner bypass**: if the viewing session user is the author, allow `in_review`/`rejected` and render a banner ("Awaiting review" / "Hidden by moderator" + `moderationNote`). Public visitors still get 404.

**Step 2:** Manual verify: author sees banner; logged-out visitor gets 404; feed still excludes it (already does).

**Step 3:** Commit: `git commit -am "feat: authors can view their own in-review/hidden posts with status banner"`

---

## Phase 8 — CDK + env

### Task 8.1: Grant `bedrock:InvokeModel` to the app IAM user

**Files:** `cdk/lib/iam-stack.ts` (~33-47)

**Step 1:** Add a PolicyStatement to `appUser`, scoped to the Haiku model / regional inference-profile ARN(s) in `BEDROCK_REGION` (not `*`):
```ts
appUser.addToPolicy(new iam.PolicyStatement({
  sid: "AppBedrockInvoke",
  actions: ["bedrock:InvokeModel"],
  resources: [
    // e.g. arn:aws:bedrock:<region>::foundation-model/<haiku-model-id>
    // and the inference-profile ARN if using a regional profile.
    `arn:aws:bedrock:${props.region ?? "eu-west-1"}::foundation-model/*`,
  ],
}));
```
Tighten `resources` to the exact model/profile ARNs once confirmed (claude-api skill / Bedrock console).

**Step 2:** `cd cdk && npx cdk diff` (with the provided CDK keys exported) to confirm only the policy changes. **User runs `cdk deploy`** per account.

**Step 3:** Commit: `git commit -am "feat(cdk): grant app IAM user bedrock:InvokeModel"`

---

### Task 8.2: Declare env vars

**Files:** `config/env.js`, `.env.example` (if present)

**Step 1:** Add to `server` AND `runtimeEnv` blocks: `BEDROCK_REGION`, `BEDROCK_MODEL_ID`, `MODERATION_ENABLED` (`z.enum(["true","false"]).optional()`), `ADMIN_EMAIL` (`z.string().email().optional()`). Document required values in `.env.example`.

**Step 2:** `npm run build` to confirm env validation passes (with vars set/optional).

**Step 3:** Commit: `git commit -am "chore(env): declare bedrock + moderation env vars"`

---

## Phase 9 — Account-block regression test (E2E)

### Task 9.1: Lock in ban-hides-posts

**Files:** `e2e/` (new spec, match existing Playwright conventions)

**Step 1:** E2E: admin bans a user who has a published post → that post 404s on its detail page and is absent from the feed; unban restores it. (Confirms `admin.ban`/`unban` + `banned_users` feed joins still work.)

**Step 2:** `npm test -- <spec>` → PASS.

**Step 3:** Commit: `git commit -am "test(e2e): banning an author hides their posts"`

---

## Phase 10 — E2E flows

### Task 10.1: Publish → auto-review → in_review

E2E with `MODERATION_ENABLED=true`, Bedrock disabled (heuristic path): publish an article → lands `in_review`, not on the feed; author's my-posts shows "In review". Commit.

### Task 10.2: Flag → queue → decline → hidden

E2E: user flags a live post → admin queue shows it → admin declines with note → post 404s for public, author sees "Hidden by moderator". Commit.

### Task 10.3: Link dedupe

E2E: post a link, then post the same link again → second submit shows the "already shared recently" error. Commit.

---

## Final verification (superpowers:verification-before-completion)

- `npm run test:unit` green; targeted Playwright specs green; `npm run lint` clean; `npm run build` clean.
- Manual: moderation email link resolves to `/admin/moderation?item=…` (the original bug).
- Confirm Bedrock works end-to-end in a deployed/preview env with real keys (unit tests can't cover the live call).

## Notes / risks

- **Secrets:** the pasted CDK keys are temporary STS (deploy-only); never commit them. Runtime Bedrock uses the app IAM user's `ACCESS_KEY`/`SECRET_KEY`.
- **Bedrock region:** Haiku must be enabled in `BEDROCK_REGION` for the account; may require requesting model access in the Bedrock console + a regional inference profile id.
- **Bedrock model id (confirmed enabled in dev+prod, 2026-06-09):** `anthropic.claude-haiku-4-5-20251001-v1:0`. Use as `BEDROCK_MODEL_ID`. At implementation, check whether the region requires a cross-region inference-profile prefix (e.g. `eu.anthropic.claude-haiku-4-5-20251001-v1:0` / `us.anthropic...`) vs the bare foundation-model id; the IAM grant (Task 8.1) must cover whichever ARN form is used.
- **Latency:** synchronous link-fetch (≤4s) + Haiku (~1-2s) on publish is acceptable per design; loader covers it; all fail open.
- **Dedupe TOCTOU:** link/discussion dedupe is check-then-insert, and `posts_external_url_normalized_idx` is non-unique, so two concurrent publishes of the same URL can both pass the check and both publish. Acceptable as spam-friction (moderation is default-off); the real fix, if dedupe is ever treated as authoritative, is a partial unique index `(externalUrlNormalized) WHERE status = 'published'`.
