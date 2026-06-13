/**
 * Canonical production origin. SEO artifacts (canonicals, JSON-LD, sitemap,
 * RSS, IndexNow) always point here regardless of the serving host, so preview
 * deploys never mint preview-domain URLs into the index. App-facing links that
 * should follow the current environment use getAppOrigin() from
 * server/lib/url.ts instead.
 */
export const SITE_ORIGIN = "https://www.codu.co";
export const SITE_HOST = "www.codu.co";
