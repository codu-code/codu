/**
 * Utility for fetching Open Graph images from article URLs.
 * Uses a lightweight regex-based approach to extract og:image meta tags.
 */

const FETCH_TIMEOUT_MS = 5000;

/**
 * Fetches the OG image URL from an article URL.
 * Returns null on any error or if no OG image is found.
 *
 * @param url - The article URL to fetch the OG image from
 * @returns The OG image URL or null
 */
export async function fetchOgImage(url: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; CoduBot/1.0; +https://codu.co)",
        Accept: "text/html",
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return null;
    }

    // Only read enough of the response to find meta tags (usually in <head>)
    const reader = response.body?.getReader();
    if (!reader) return null;

    let html = "";
    const decoder = new TextDecoder();
    const maxBytes = 100000; // Read max 100KB (meta tags should be in first few KB)

    while (html.length < maxBytes) {
      const { done, value } = await reader.read();
      if (done) break;
      html += decoder.decode(value, { stream: true });

      // If we've found </head>, we can stop reading
      if (html.includes("</head>")) break;
    }

    reader.cancel();

    return extractOgImage(html);
  } catch {
    // Silently fail - network errors, timeouts, etc. are expected
    return null;
  }
}

/**
 * Extracts the og:image URL from HTML content.
 * Tries multiple patterns to handle different HTML formats.
 */
function extractOgImage(html: string): string | null {
  // Pattern 1: Standard og:image meta tag
  // <meta property="og:image" content="https://example.com/image.jpg" />
  const patterns = [
    // property before content
    /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i,
    // content before property
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i,
    // With spaces and variations
    /<meta\s+property\s*=\s*["']og:image["']\s+content\s*=\s*["']([^"']+)["']/i,
    /<meta\s+content\s*=\s*["']([^"']+)["']\s+property\s*=\s*["']og:image["']/i,
    // Twitter image as fallback
    /<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["']/i,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) {
      const imageUrl = match[1];
      // Validate it looks like a URL
      if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
        return imageUrl;
      }
      // Handle protocol-relative URLs
      if (imageUrl.startsWith("//")) {
        return `https:${imageUrl}`;
      }
    }
  }

  return null;
}

/**
 * Fetches OG images for multiple URLs in parallel with rate limiting.
 *
 * @param urls - Array of article URLs
 * @param concurrency - Max concurrent requests (default: 5)
 * @returns Map of URL to OG image URL (or null)
 */
export async function fetchOgImagesInBatch(
  urls: string[],
  concurrency = 5,
): Promise<Map<string, string | null>> {
  const results = new Map<string, string | null>();

  // Process in batches
  for (let i = 0; i < urls.length; i += concurrency) {
    const batch = urls.slice(i, i + concurrency);
    const batchResults = await Promise.all(
      batch.map(async (url) => {
        const ogImage = await fetchOgImage(url);
        return { url, ogImage };
      }),
    );

    for (const { url, ogImage } of batchResults) {
      results.set(url, ogImage);
    }
  }

  return results;
}
