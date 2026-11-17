import { isHostFetchable } from "./ssrfGuard";

const MAX_TEXT_LENGTH = 4000;
const MAX_BODY_BYTES = 200 * 1024; // 200KB cap on fetched HTML
const DEFAULT_TIMEOUT_MS = 4000;
const MAX_REDIRECTS = 5;

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
 * Fetch a public page's HTML. Best effort only: bounded by a timeout, caps the
 * body at 200KB, and returns "" on ANY error (never throws).
 *
 * SSRF guard: the URL is untrusted, so its host is validated (incl. DNS
 * resolution) against a denylist of internal/metadata/private targets before
 * we fetch, and again for every redirect hop. A target that is not publicly
 * fetchable yields "" WITHOUT being fetched.
 *
 * Residual risk: the resolved IP could still change between the guard's lookup
 * and the actual connection (DNS rebinding). This is a pragmatic denylist, not
 * a perfect anti-rebinding fortress.
 */
export async function fetchPublicHtml(
  url: string,
  {
    timeoutMs = DEFAULT_TIMEOUT_MS,
    userAgent = "CoduModerationBot/1.0",
  }: { timeoutMs?: number; userAgent?: string } = {},
): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    let target = url;
    for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
      const { protocol, hostname } = new URL(target);
      if (protocol !== "http:" && protocol !== "https:") return "";
      if (!(await isHostFetchable(hostname))) return "";

      const res = await fetch(target, {
        signal: controller.signal,
        redirect: "manual",
        headers: { "User-Agent": userAgent },
      });

      const location = res.headers.get("location");
      if (res.status >= 300 && res.status < 400 && location) {
        target = new URL(location, target).toString();
        continue;
      }
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
      return html;
    }
    return "";
  } catch {
    return "";
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Fetch a URL and return readable text for moderation pre-visiting. Returns ""
 * when the page can't be fetched — autoReview falls back to allow when the
 * body is empty, so failing closed is safe.
 */
export async function fetchPageText(
  url: string,
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
): Promise<string> {
  const html = await fetchPublicHtml(url, { timeoutMs });
  return html ? extractReadableText(html) : "";
}
