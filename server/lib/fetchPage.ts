import { isHostFetchable } from "./ssrfGuard";

const MAX_TEXT_LENGTH = 4000;
const MAX_BODY_BYTES = 200 * 1024; // 200KB cap on fetched HTML
const DEFAULT_TIMEOUT_MS = 4000;

/**
 * Turn raw HTML into a short, readable plain-text snippet for moderation:
 * strip <script>/<style> blocks, strip all remaining tags, collapse
 * whitespace, prepend the <title>, and cap the result at 4000 chars.
 * Pure + synchronous (unit-tested); never throws.
 */
export function extractReadableText(html: string): string {
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : "";

  const stripped = html
    // drop script/style content entirely
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    // drop all remaining tags
    .replace(/<[^>]+>/g, " ")
    // collapse whitespace
    .replace(/\s+/g, " ")
    .trim();

  const combined = title ? `${title} ${stripped}` : stripped;
  return combined.slice(0, MAX_TEXT_LENGTH);
}

/**
 * Fetch a URL and return readable text for moderation pre-visiting. Best
 * effort only: bounded by a timeout, follows redirects, caps the body at
 * 200KB, and returns "" on ANY error (never throws). NOT unit-tested
 * (network); only extractReadableText + the SSRF guard are.
 *
 * SSRF guard: the author-supplied host is validated (incl. DNS resolution)
 * against a denylist of internal/metadata/private targets before we fetch.
 * If it's not publicly fetchable we return "" WITHOUT fetching — autoReview
 * falls back to allow when the body is empty, so failing closed is safe.
 *
 * Residual risk: we keep redirect:"follow", so only the INITIAL host is
 * validated; a redirect could still land on an internal host (redirect-based
 * DNS rebinding), and the resolved IP could change between the guard's lookup
 * and the actual connection. This is a pragmatic denylist, not a perfect
 * anti-rebinding fortress; the blast radius is limited because the fetched
 * body only ever feeds Bedrock (blind SSRF).
 */
export async function fetchPageText(
  url: string,
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
): Promise<string> {
  // Validate the target host before any network call. Never throw.
  let hostname: string;
  try {
    hostname = new URL(url).hostname;
  } catch {
    return "";
  }
  if (!(await isHostFetchable(hostname))) return "";

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
      headers: { "User-Agent": "CoduModerationBot/1.0" },
    });
    if (!res.ok || !res.body) return "";

    // Read at most MAX_BODY_BYTES so a huge/streaming page can't blow memory.
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let html = "";
    let bytes = 0;
    while (bytes < MAX_BODY_BYTES) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      html += decoder.decode(value, { stream: true });
    }
    try {
      await reader.cancel();
    } catch {
      // ignore cancel errors
    }
    return extractReadableText(html);
  } catch {
    return "";
  } finally {
    clearTimeout(timer);
  }
}
