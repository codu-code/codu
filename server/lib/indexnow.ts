// IndexNow ping — tells Bing to crawl a published/updated URL without waiting
// for the next sitemap sweep. Fire-and-forget: never throws, never blocks. The
// key is PUBLIC (verified via /{key}.txt), so it lives in source. Keep this file
// dependency-light (no db/next imports) — it's called from hot mutation paths.
import * as Sentry from "@sentry/nextjs";

import { SITE_HOST as HOST } from "@/config/site";

const KEY = "71c1d9ae86d395b88bdfeee926f49863";
const KEY_LOCATION = `https://${HOST}/${KEY}.txt`;
const ENDPOINT = "https://api.indexnow.org/indexnow";

/**
 * Submit one or more absolute Codú URLs to IndexNow. Fire-and-forget — callers
 * should `void submitToIndexNow(...)` and not await it on the response path.
 *
 * Guarded to production only: dev/local edits would otherwise spam IndexNow
 * with localhost / unreachable URLs (which the service rejects and which can
 * harm the key's standing). Any non-www.codu.co host is also dropped.
 */
export async function submitToIndexNow(urls: string | string[]): Promise<void> {
  try {
    if (process.env.NODE_ENV !== "production") return;

    const list = (Array.isArray(urls) ? urls : [urls])
      .filter((u): u is string => typeof u === "string" && u.length > 0)
      .filter((u) => {
        try {
          return new URL(u).host === HOST;
        } catch {
          return false;
        }
      });

    if (list.length === 0) return;

    await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        host: HOST,
        key: KEY,
        keyLocation: KEY_LOCATION,
        urlList: list,
      }),
    });
  } catch (error) {
    // Never let an SEO ping break a publish. Swallow + report.
    Sentry.captureException(error);
  }
}
