// Shared URL helpers. Consolidates logic that was previously copy-pasted across
// feed/content/profile components (ensureHttps, getFaviconUrl, getHostname) and
// adds a scheme guard for user-supplied href values.

/**
 * Returns `url` only if it is an absolute http(s) URL, otherwise `undefined`.
 *
 * Use this for `href` attributes built from user-supplied URLs (profile
 * website, job application link, link-post external URL). React does not treat
 * `href` as HTML, so escaping is not the concern here — the danger is a
 * `javascript:` / `data:` scheme executing on click. `z.string().url()` does
 * NOT reject those schemes, so the guard must live at the render boundary too.
 * `http://` is upgraded to `https://`.
 */
export function safeExternalHref(
  url: string | null | undefined,
): string | undefined {
  if (!url) return undefined;
  let parsed: URL;
  try {
    parsed = new URL(url.trim());
  } catch {
    return undefined;
  }
  if (parsed.protocol === "http:") {
    parsed.protocol = "https:";
    return parsed.toString();
  }
  return parsed.protocol === "https:" ? url.trim() : undefined;
}

// `https://host[:port]/<absolute-url>` — an upstream feed prefixed its own
// origin onto an already-absolute URL. Anchored so the embedded scheme must sit
// immediately after the host's first slash: this is the precise shape of the
// bug and avoids mangling a scheme that legitimately appears deeper in the path
// (path-based image proxies, a slug containing `http://`) or in a query string.
const DOUBLED_ORIGIN = /^https?:\/\/[^/]+\/(https?:\/\/.+)$/i;

/**
 * Unwraps a URL that an upstream feed prefixed with its own origin, leaving an
 * already-absolute URL doubled up — e.g. HackerNoon's `media:thumbnail` serves
 * `https://hackernoon.com/https://cdn.hackernoon.com/x.png`, which 404s. Returns
 * the inner URL; a normal URL is returned unchanged.
 */
export function unwrapDoubledUrl(
  url: string | null | undefined,
): string | null {
  if (!url) return null;
  return DOUBLED_ORIGIN.exec(url)?.[1] ?? url;
}

/** Upgrades an `http://` URL to `https://`. Returns null for empty input. */
export function ensureHttps(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith("http://")) {
    return url.replace("http://", "https://");
  }
  return url;
}

/** Builds a Google s2 favicon URL for the given site, or null if unparseable. */
export function getFaviconUrl(
  websiteUrl: string | null | undefined,
  size = 32,
): string | null {
  if (!websiteUrl) return null;
  try {
    const { hostname } = new URL(websiteUrl);
    return `https://www.google.com/s2/favicons?domain=${hostname}&sz=${size}`;
  } catch {
    return null;
  }
}

/** Extracts the hostname from a URL string, or null if unparseable. */
export function getHostname(
  urlString: string | null | undefined,
): string | null {
  if (!urlString) return null;
  try {
    return new URL(urlString).hostname;
  } catch {
    return null;
  }
}
