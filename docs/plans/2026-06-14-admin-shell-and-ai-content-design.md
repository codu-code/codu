# Admin shell + AI content pipeline — design

Date: 2026-06-14
Status: design approved (brainstormed with founder); admin shell to be built first.

## Why

Two problems, one foundation:

1. **The admin dashboard is crushed.** Admin pages live at `app/(app)/admin/*`, so
   they inherit `(app)/layout.tsx` → `AppShell`, which wraps every child in the
   public 3-column rail grid (`LeftRail` / narrow center / `RightRail`). Management
   tables get the ~600px center column the feed uses. Admin is private — it should
   not share the public member chrome at all.
2. **Managing the platform is manual.** As a solo founder, auditing content,
   moderation, users, and quality needs to be a glance, not a dig. We also want
   AI-derived topic/sentiment/quality signals so the feed can be personalized.

These connect: the admin shell becomes the cockpit for the AI content pipeline.

## Scope decision

- Write this one design doc covering all three efforts (admin shell, AI review
  cron, personalization).
- **Build the admin shell now.** The cron, AI metadata, and personalized ranking
  are designed here and built as later phases.

---

## 1. Admin shell — route-group as layout boundary

### The mental model

Next.js route groups are already the "back out of a layout" mechanism. The top
level already has siblings, each its own layout world:

```
app/
  (app)/        ← the rail shell (LeftRail / center / RightRail). The social surface.
  (auth)/       ← auth chrome
  (editor)/     ← editor chrome
  (marketing)/  ← marketing chrome
  (admin)/      ← NEW: AdminShell. Private management. Full width, own nav.
```

`AppShell` is **not global** — it is scoped to `(app)`. A sibling group escapes it
structurally, with no runtime flag. The only reason it _feels_ global is that
nearly everything was dropped into `(app)`, and the two pages that wanted no rails
(`/speakers`, `/volunteer`) used a runtime hack: the `BARE_ROUTES` array inside
`AppShell` that conditionally drops the rails. That hack is the smell — a page in
the shell group that doesn't want the shell.

**Rule going forward:** a page that does not want the rail shell does not live in
`(app)`. Pick the sibling group whose chrome fits, or add a new group. No runtime
flags, no fighting a parent layout.

Future non-shell pages ("other things I'll want up") are deferred — but the pattern
is documented so adding a `(bare)` public group or more admin tools later is a
structural 2-minute move with no rework. Optional cleanup (not in this work):
retire `BARE_ROUTES` by moving `/speakers` + `/volunteer` into a `(bare)` group.

### The structure to build

```
app/(admin)/
  layout.tsx                 ← AdminShell + admin-gate (role check) enforced ONCE here
  admin/
    page.tsx                 ← Overview dashboard (moved)
    users/        page.tsx + _client.tsx   (moved)
    sources/      page.tsx + _client.tsx   (moved)
    tags/         page.tsx + _client.tsx   (moved)
    moderation/   page.tsx + _client.tsx   (moved)
```

Route groups don't change URLs — every `/admin/*` link, bookmark, and redirect
keeps working. The page files move from `(app)/admin/*` to `(admin)/admin/*`.

### AdminShell

- **Left sidebar** (persistent): Overview, Moderation, Users, Sources, Tags,
  and placeholders for the new surfaces — Content, Insights, Settings. Active-state
  styling mirrors `LeftRail`.
- **Slim top bar**: page title / breadcrumb, "← Back to site" link, founder avatar.
- **Full-width fluid content** (`max-w-screen-2xl`, real padding) so tables breathe.
- Reuses existing design tokens (`bg-canvas`, `border-hairline`, `font-display`,
  the `eyebrow` / `slash` motifs) so it reads as Codú, not a bolted-on admin theme.

### Auth

The `session.user.role !== "ADMIN"` → `redirect("/")` gate moves into
`(admin)/layout.tsx`, enforced once for the whole section. Each `page.tsx` drops
its own gate. No engagement side-effects (`recordDailyActivity`, `ensureReferral`)
or public rails run here — it's private.

---

## 2. AI metadata data model (provenance-aware)

Metadata is a general layer that BOTH the founder (manual) and the cron (AI) write
to. Provenance is tracked via a `source` field so manual tags are authoritative and
the nightly job never overwrites them.

### `post_metadata` (1:1 with posts) — per-post signal envelope

```
postId         uuid  PK/FK → posts.id (cascade)
sentiment      varchar      -- nullable; "positive" | "neutral" | "negative"
sentimentScore real         -- -1..1
qualityScore   real         -- 0..1 (spam / low-effort signal)
qualityReason  text         -- short model rationale
modelId        text         -- Bedrock model that produced it; null if human-set
analyzedAt     timestamptz  -- last AI pass; THIS IS THE INCREMENTAL WATERMARK
schemaVersion  integer      -- bump to force re-analysis of everything
```

A separate 1:1 table (not columns on `posts`) keeps the hot `posts` row lean and
lets the cron write without bumping `posts.updatedAt`.

### Controlled topic vocabulary

LLM free-text drifts ("RAG" / "rag" / "retrieval-augmented"). Topics resolve
against a curated list so manual + AI tags share one clean namespace.

```
topic        id, slug, label, status(active|pending), createdAt
             -- seeded: rag, agents, prompting, evals, nextjs, indie-hacking,
             --         fundraising, ... ; model picks from the list, may propose
             --         new ones into `pending` for founder approval in admin.

post_topic   postId uuid FK, topicId int FK, confidence real (nullable for manual),
             source varchar ("ai" | "manual"), createdAt timestamptz,
             PRIMARY KEY (postId, topicId)
```

`post_metadata` = per-post AI verdict; `post_topic` = normalized, queryable topic
edges that power ranking. Human `Tag` / `post_tags` stays untouched.

> Note: a `profile.myInterests` query + `openTopics` action already exist in the
> rail ("Your topics"). The personalization layer should reconcile with / build on
> that existing interest concept rather than introduce a parallel one.

### The coexistence rule (manual + AI)

- The cron only ever **deletes and rewrites `source = 'ai'`** rows in `post_topic`.
  `source = 'manual'` edges are never touched.
- For `post_metadata`, a manually-set field leaves a marker (e.g. `modelId = null`)
  that tells the cron to skip overwriting it.
- So the founder can hand-tag a post; the nightly job fills the blanks around it.

---

## 3. Nightly review cron — incremental, comment-aware

One route, **`/api/cron/daily-review`** (Bearer `CRON_SECRET`, same auth as
`promote-scheduled`), invoked by an EventBridge rule + Lambda invoker — the
established pattern in `cdk/lib/cron-stack.ts`.

### Incremental worklist ("never re-tag unchanged content")

`analyzedAt` per row IS the watermark — no fragile global cursor.

- **Posts to analyze:** `posts LEFT JOIN post_metadata` where
  `analyzedAt IS NULL` **OR** `posts.updatedAt > analyzedAt` **OR**
  `schemaVersion < N`. Unchanged-since-last-analysis posts are not in the worklist.
  Editing a post re-enters it; bumping `schemaVersion` re-enters everything.
- **Comments to moderate:** same idea via a `moderatedAt` column on comments —
  only new/edited comments are screened.
- **Empty worklist → no-op.** Nothing new, nothing runs, near-zero cost.

### Robustness

- **Capped per run** (e.g. 100 posts / 200 comments), like `promote-scheduled`'s
  `limit(100)`. Leftovers roll to the next run — a backfill can't blow the Lambda
  timeout.
- **Per-item try/catch + Sentry** — one bad row never kills the batch (fail-open,
  matching `autoReview`).
- **Bedrock gate** — `isBedrockEnabled()` false → moderation falls back to the
  `screenContent` heuristic; tagging/quality passes are skipped gracefully.

### The four passes

1. **Topic + sentiment tagging** (posts) → writes `post_metadata` + `source='ai'`
   edges in `post_topic`, never touching manual edges. Reuses the Bedrock
   `InvokeModel` plumbing from `autoReview.ts`.
2. **Re-screen moderation** (posts AND comments) → anything flagged becomes a row
   in the existing `reports` queue (see below), surfacing in the moderation UI.
3. **Quality / spam scoring** (posts) → fills `qualityScore` / `qualityReason`.
4. **Daily digest** → counts the day (new users / posts / comments, flags raised,
   pending queue) and **emails the founder only when something needs attention**;
   otherwise just updates a dashboard widget. No daily noise.

### AI flags → existing moderation queue (schema change)

Extend `reports` so AI flags share the one queue the founder already checks:

```
reports.source        varchar  default "user"   -- "user" | "system"
reports.reporterId     -> make NULLABLE          -- system flags have no human reporter
```

AI-raised reports render in the existing moderation UI tagged "auto-flagged."
One queue, one place to look.

---

## 4. Personalized feed ranking (last phase)

Built on transparent, explicit signals first — not an opaque model — so it stays
debuggable for a solo founder.

### Interest profile — two sources

1. **Explicit (ship first):** users follow / mute topics.
   `user_topic_pref (userId, topicId, pref: follow|mute)`. Reconcile with the
   existing `myInterests` / "Your topics" UI. Followed topics boost; muted are
   filtered out. Predictable, user-controlled.
2. **Implicit affinity (layer after):**
   `user_topic_affinity (userId, topicId, score, updatedAt)`, computed by an
   incremental job from existing interactions — `post_votes` (strong),
   `bookmarks` (strong), `comments` (medium), views (weak) — mapped through each
   post's `post_topic` edges, with time decay so interests stay current.

### Ranking = transparent weighted blend (server-side)

```
score = w1·recency
      + w2·baseQuality (votes / existing signals)
      + w3·topicAffinity (explicit follows + implicit score)
      − muteFilter
```

Weights in config so they're tunable. A sum of named terms means "why did this
rank here?" is always answerable.

### Cold start & safety

No profile (logged-out / new user) → today's chronological/trending feed,
unchanged. Personalization is purely additive. Everything keys off the
`post_topic` edges from §2 — no new content analysis needed. Per-user ranked feed
cached with a short TTL; affinity recompute is incremental (active users only).

**Recommendation:** build explicit follow/mute first (most of the value, a
fraction of the complexity), add implicit affinity once topics are flowing.

---

## 5. Phasing + "robust to manage as a solo founder"

### Phases

- **Phase 1 (this work): admin shell.** `(admin)` route group, AdminShell, move
  pages, centralize auth. Unblocks everything else by giving the cockpit room.
- **Phase 2: AI metadata + nightly cron.** Schema (`post_metadata`, `topic`,
  `post_topic`, `comments.moderatedAt`, `reports.source`/nullable reporter),
  `/api/cron/daily-review`, EventBridge + Lambda, admin **Content** + **Insights**
  views (review AI tags, approve pending topics, see flags/quality).
- **Phase 3: personalization.** Explicit follow/mute → ranked feed; then implicit
  affinity.

### Robustness ideas to fold into the admin cockpit

- **One moderation queue** — user reports + AI flags together (§3).
- **Daily digest** — the day on one screen; email only when action is needed.
- **Audit log** — record admin actions (bans, deletes, topic approvals) so a solo
  founder has a paper trail.
- **Quality/spam surfacing** — sort the Content view by `qualityScore` to find
  low-effort content fast; down-rank rather than delete where possible.
- **Pending-topic approval** — keep the topic vocabulary clean with one click.
- **Everything incremental + fail-open** — jobs skip when there's nothing to do and
  never block the platform on an AI/infra failure.

---

## Implementation notes (Phase 1)

- Create `app/(admin)/layout.tsx` (server component): fetch session, gate on
  `role === "ADMIN"`, render `AdminShell`.
- Create `components/Admin/AdminShell.tsx` (+ sidebar nav, top bar) reusing tokens.
- `git mv` the five page directories from `app/(app)/admin/` to `app/(admin)/admin/`.
- Strip the per-page `getServerAuthSession` + redirect gate from the moved
  `page.tsx` files (now handled by the layout); keep any page-specific data
  fetching.
- Verify: `next build` / typecheck, and that `/admin` + each subroute renders
  full-width without the public rails.
