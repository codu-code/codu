import type { NextRequest} from "next/server";
import { NextResponse } from "next/server";
import { auth } from "@/auth";

const FETCH_TIMEOUT_MS = 8000;
const MAX_CONTENT_BYTES = 150000; // 150KB - enough to get meta tags

interface UrlMetadata {
  title: string | null;
  description: string | null;
  image: string | null;
  readTime: number | null;
  siteName: string | null;
}

/**
 * Extract text content from HTML and count words
 */
function extractTextAndWordCount(html: string): number {
  // Remove script and style tags
  let text = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "");
  text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "");

  // Remove all HTML tags
  text = text.replace(/<[^>]+>/g, " ");

  // Decode HTML entities
  text = text.replace(/&nbsp;/g, " ");
  text = text.replace(/&amp;/g, "&");
  text = text.replace(/&lt;/g, "<");
  text = text.replace(/&gt;/g, ">");
  text = text.replace(/&quot;/g, '"');

  // Normalize whitespace and count words
  const words = text.split(/\s+/).filter((word) => word.length > 0);
  return words.length;
}

/**
 * Calculate reading time in minutes based on word count
 * Average reading speed: ~225 words per minute
 */
function calculateReadTime(wordCount: number): number {
  const readTime = Math.ceil(wordCount / 225);
  // Clamp between 1 and 30 minutes
  return Math.max(1, Math.min(30, readTime));
}

/**
 * Extract metadata from HTML content
 */
function extractMetadata(html: string): UrlMetadata {
  const result: UrlMetadata = {
    title: null,
    description: null,
    image: null,
    readTime: null,
    siteName: null,
  };

  // Extract og:title or <title>
  const ogTitlePatterns = [
    /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:title["']/i,
  ];

  for (const pattern of ogTitlePatterns) {
    const match = html.match(pattern);
    if (match?.[1]) {
      result.title = match[1].trim();
      break;
    }
  }

  // Fallback to <title> tag
  if (!result.title) {
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (titleMatch?.[1]) {
      result.title = titleMatch[1].trim();
    }
  }

  // Extract og:description or meta description
  const descriptionPatterns = [
    /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:description["']/i,
    /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i,
  ];

  for (const pattern of descriptionPatterns) {
    const match = html.match(pattern);
    if (match?.[1]) {
      result.description = match[1].trim();
      break;
    }
  }

  // Extract og:image or twitter:image
  const imagePatterns = [
    /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i,
    /<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["']/i,
  ];

  for (const pattern of imagePatterns) {
    const match = html.match(pattern);
    if (match?.[1]) {
      let imageUrl = match[1].trim();
      // Validate URL format
      if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
        result.image = imageUrl;
        break;
      }
      // Handle protocol-relative URLs
      if (imageUrl.startsWith("//")) {
        result.image = `https:${imageUrl}`;
        break;
      }
    }
  }

  // Extract og:site_name
  const siteNamePatterns = [
    /<meta[^>]+property=["']og:site_name["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:site_name["']/i,
  ];

  for (const pattern of siteNamePatterns) {
    const match = html.match(pattern);
    if (match?.[1]) {
      result.siteName = match[1].trim();
      break;
    }
  }

  // Calculate read time from body content
  const wordCount = extractTextAndWordCount(html);
  if (wordCount > 0) {
    result.readTime = calculateReadTime(wordCount);
  }

  return result;
}

/**
 * Validate URL format
 */
function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  // Check authentication
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { url } = body;

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    if (!isValidUrl(url)) {
      return NextResponse.json(
        { error: "Invalid URL format" },
        { status: 400 },
      );
    }

    // Fetch the URL with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (compatible; CoduBot/1.0; +https://codu.co)",
          Accept: "text/html,application/xhtml+xml",
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        return NextResponse.json(
          { error: `Failed to fetch URL: ${response.status}` },
          { status: 502 },
        );
      }

      // Read response body with size limit
      const reader = response.body?.getReader();
      if (!reader) {
        return NextResponse.json(
          { error: "Failed to read response" },
          { status: 502 },
        );
      }

      let html = "";
      const decoder = new TextDecoder();

      while (html.length < MAX_CONTENT_BYTES) {
        const { done, value } = await reader.read();
        if (done) break;
        html += decoder.decode(value, { stream: true });

        // Early exit if we have </head> and </body> - enough for metadata
        if (html.includes("</head>") && html.length > 50000) break;
      }

      reader.cancel();

      // Extract metadata
      const metadata = extractMetadata(html);

      return NextResponse.json(metadata);
    } catch (fetchError) {
      clearTimeout(timeoutId);

      if (fetchError instanceof Error && fetchError.name === "AbortError") {
        return NextResponse.json(
          { error: "Request timed out" },
          { status: 504 },
        );
      }

      return NextResponse.json(
        { error: "Failed to fetch URL" },
        { status: 502 },
      );
    }
  } catch (error) {
    console.error("Error in fetch-metadata:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
