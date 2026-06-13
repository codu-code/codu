import { test, expect, type Page } from "@playwright/test";
import {
  E2E_ROUTING_ARTICLE_SLUG,
  E2E_ROUTING_ARTICLE_TITLE,
  E2E_ROUTING_ARTICLE_URL_ID,
  E2E_ROUTING_DISCUSSION_SLUG,
  E2E_ROUTING_DISCUSSION_TITLE,
  E2E_ROUTING_SOURCE_SLUG,
  E2E_ROUTING_SOURCE_ARTICLE_SLUG,
  E2E_ROUTING_SOURCE_ARTICLE_TITLE,
} from "./constants";

// Regression safety net for the large content-URL restructure. All content now
// lives under stable, urlId-suffixed slugs:
//   - member article/link : /{username}/{slug}
//   - discussion/question  : /d/{slug}            (canonical)
//   - aggregated/source    : /s/{sourceSlug}/{slug} ; profile /s/{sourceSlug}
// with 301/308 self-correcting redirects from legacy/stale URLs. Fixtures with
// fixed slugs + urlIds are seeded in e2e/setup.ts (E2E_ROUTING_* constants).

const BASE = "http://localhost:3000";
const USER = "e2e-test-user-one-111";

// Navigate, retrying on a transient 5xx. Under fullyParallel the Next DEV server
// compiles each route on its first concurrent hit; that first-compile can
// momentarily 500 purely as a dev artifact (production `next build` precompiles,
// so it can't happen there). A short settle + re-goto hits the now-warm route.
// The returned status feeds expectOk; URL + content assertions in each test are
// the real proof the right page rendered.
async function gotoOk(page: Page, url: string): Promise<number | undefined> {
  let status: number | undefined;
  for (let attempt = 0; attempt < 4; attempt++) {
    const res = await page.goto(url);
    status = res?.status();
    if (status === undefined || status < 500) return status;
    // Give the dev compiler a moment before retrying the same route.
    await page.waitForTimeout(750);
  }
  return status;
}

// A successful navigation. We assert "not an error status" rather than a strict
// 200 because the Next dev server legitimately answers an already-compiled,
// unchanged route with 304 Not Modified on warm runs. This just guards against
// 4xx/5xx (the 404 regression we care about).
function expectOk(status: number | undefined) {
  expect(status, `expected a successful status, got ${status}`).toBeDefined();
  expect(status, `unexpected error status ${status}`).toBeLessThan(400);
}

test.describe("Content URL routing", () => {
  test("member article renders at /{username}/{slug}", async ({ page }) => {
    const status = await gotoOk(
      page,
      `${BASE}/${USER}/${E2E_ROUTING_ARTICLE_SLUG}`,
    );

    expectOk(status);
    await expect(page).toHaveURL(`${BASE}/${USER}/${E2E_ROUTING_ARTICLE_SLUG}`);
    await expect(
      page.getByRole("heading", { name: E2E_ROUTING_ARTICLE_TITLE }),
    ).toBeVisible({ timeout: 30000 });
  });

  test("discussion renders at /d/{slug}", async ({ page }) => {
    const status = await gotoOk(
      page,
      `${BASE}/d/${E2E_ROUTING_DISCUSSION_SLUG}`,
    );

    expectOk(status);
    await expect(page).toHaveURL(`${BASE}/d/${E2E_ROUTING_DISCUSSION_SLUG}`);
    await expect(
      page.getByRole("heading", { name: E2E_ROUTING_DISCUSSION_TITLE }),
    ).toBeVisible({ timeout: 30000 });
  });

  test("profile renders at /{username}", async ({ page }) => {
    const status = await gotoOk(page, `${BASE}/${USER}`);

    expectOk(status);
    await expect(
      page.getByRole("heading", { name: "E2E Test User One", exact: true }),
    ).toBeVisible({ timeout: 30000 });
  });

  test("profile Replies tab at /{username}?tab=replies", async ({ page }) => {
    await page.goto(`${BASE}/${USER}?tab=replies`);

    await expect(
      page.getByRole("heading", { name: "E2E Test User One", exact: true }),
    ).toBeVisible({ timeout: 30000 });

    // The Replies tab is selected by the ?tab=replies query (URL is the source
    // of truth) and rendered as a tab button.
    await expect(page.getByRole("button", { name: "Replies" })).toBeVisible();
    await expect(page).toHaveURL(`${BASE}/${USER}?tab=replies`);
  });

  test("source profile renders at /s/{sourceSlug}", async ({ page }) => {
    const status = await gotoOk(page, `${BASE}/s/${E2E_ROUTING_SOURCE_SLUG}`);

    expectOk(status);
    await expect(page).toHaveURL(`${BASE}/s/${E2E_ROUTING_SOURCE_SLUG}`);
  });

  test("source article renders at /s/{sourceSlug}/{slug}", async ({ page }) => {
    const status = await gotoOk(
      page,
      `${BASE}/s/${E2E_ROUTING_SOURCE_SLUG}/${E2E_ROUTING_SOURCE_ARTICLE_SLUG}`,
    );

    expectOk(status);
    await expect(page).toHaveURL(
      `${BASE}/s/${E2E_ROUTING_SOURCE_SLUG}/${E2E_ROUTING_SOURCE_ARTICLE_SLUG}`,
    );
    await expect(
      page
        .getByText(E2E_ROUTING_SOURCE_ARTICLE_TITLE, { exact: false })
        .first(),
    ).toBeVisible({ timeout: 30000 });
  });
});

test.describe("Content URL redirects", () => {
  test("wrong-words + real urlId 301s to canonical member slug", async ({
    page,
  }) => {
    // Right urlId, deliberately wrong title words -> self-correct to canonical.
    await page.goto(
      `${BASE}/${USER}/totally-wrong-words-${E2E_ROUTING_ARTICLE_URL_ID}`,
    );

    await expect(page).toHaveURL(`${BASE}/${USER}/${E2E_ROUTING_ARTICLE_SLUG}`);
    await expect(
      page.getByRole("heading", { name: E2E_ROUTING_ARTICLE_TITLE }),
    ).toBeVisible({ timeout: 30000 });
  });

  test("legacy discussion URL /{username}/{slug} 301s to /d/{slug}", async ({
    page,
  }) => {
    await page.goto(`${BASE}/${USER}/${E2E_ROUTING_DISCUSSION_SLUG}`);

    await expect(page).toHaveURL(`${BASE}/d/${E2E_ROUTING_DISCUSSION_SLUG}`);
    await expect(
      page.getByRole("heading", { name: E2E_ROUTING_DISCUSSION_TITLE }),
    ).toBeVisible({ timeout: 30000 });
  });

  test("legacy /{sourceSlug} 301s to /s/{sourceSlug}", async ({ page }) => {
    await page.goto(`${BASE}/${E2E_ROUTING_SOURCE_SLUG}`);

    await expect(page).toHaveURL(`${BASE}/s/${E2E_ROUTING_SOURCE_SLUG}`);
  });

  test("legacy /feed/{sourceSlug} 308s to /s/{sourceSlug}", async ({
    page,
  }) => {
    await page.goto(`${BASE}/feed/${E2E_ROUTING_SOURCE_SLUG}`);

    await expect(page).toHaveURL(`${BASE}/s/${E2E_ROUTING_SOURCE_SLUG}`);
  });
});

test.describe("No routeless /[id] regression", () => {
  test("home feed content cards link to a real page, not a routeless /[id] 404", async ({
    page,
  }) => {
    await page.goto(`${BASE}/`);

    const firstCardLink = page
      .locator('[data-testid="content-card"] a')
      .first();
    await expect(firstCardLink).toBeVisible({ timeout: 30000 });
    await expect(firstCardLink).toHaveAttribute("href", /.+/);

    const href = (await firstCardLink.getAttribute("href")) ?? "";
    expect(href, "content card should have an href").toBeTruthy();

    // External LINK posts open their source (http...) — only internal paths are
    // subject to the routeless-/[id] regression. Normalize so the assertions
    // below run unconditionally: external hrefs map to a known-good sentinel.
    const isInternal = href.startsWith("/");
    const segments = href
      .split("?")[0]
      .split("#")[0]
      .split("/")
      .filter(Boolean);

    // The regression shape: a bare single-segment internal path ("/abc123")
    // with no known namespace prefix (/feed/:id used to 301 to a routeless
    // /:id that 404s). Allowed namespaces: /{username}/..., /d/..., /s/...
    const knownNamespaces = ["d", "s", "feed", "discussions", "articles"];
    const isBareIdShape =
      isInternal &&
      segments.length === 1 &&
      !knownNamespaces.includes(segments[0]);
    expect(
      isBareIdShape,
      `content card href "${href}" looks like a routeless /[id] page`,
    ).toBe(false);

    // Following an internal link must not land on a 404. For external links we
    // re-visit the (already-200) feed home so the navigation assertion still
    // runs without a conditional.
    const target = isInternal ? `${BASE}${href}` : `${BASE}/`;
    const res = await page.goto(target);
    expect(res?.status(), `following ${href} should not 404`).not.toBe(404);
  });
});
