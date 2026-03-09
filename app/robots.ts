import { type MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Don't allow crawlers on the following routes
        disallow: [
          "/alpha/",
          "/api/",
          "/draft/",
          "/settings/",
          "/metrics/",
          "/notifications/",
          "/create/",
          "/my-posts/",
          "/hub/",
          "/og", // Block OG image endpoint (was causing 5xx errors)
          "/src/", // Source code paths (404 cleanup)
          "/config/", // Config paths (404 cleanup)
          "/temp/", // Temp paths (404 cleanup)
        ],
      },
      // Explicitly allow AI crawlers for better AI visibility
      { userAgent: "GPTBot", allow: "/" },
      { userAgent: "ChatGPT-User", allow: "/" },
      { userAgent: "Claude-Web", allow: "/" },
      { userAgent: "Anthropic-AI", allow: "/" },
      { userAgent: "PerplexityBot", allow: "/" },
      { userAgent: "Bytespider", allow: "/" },
      { userAgent: "Google-Extended", allow: "/" },
    ],
    sitemap: "https://www.codu.co/sitemap.xml",
  };
}
