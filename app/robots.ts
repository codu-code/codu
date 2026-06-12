import { type MetadataRoute } from "next";

// Private/utility routes no crawler (search OR AI) should index. A named
// user-agent group fully OVERRIDES the `*` group, so every AI-bot rule below
// must repeat this list — otherwise those bots get a bare `allow: "/"` and can
// crawl /settings, /api, /draft, etc.
const DISALLOW = [
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
];

// AI crawlers we explicitly welcome (AEO). ClaudeBot/Claude-User are Anthropic's
// current agents; OAI-SearchBot powers ChatGPT search (distinct from GPTBot).
const AI_USER_AGENTS = [
  "GPTBot",
  "ChatGPT-User",
  "OAI-SearchBot",
  "ClaudeBot",
  "Claude-User",
  "Claude-Web",
  "Anthropic-AI",
  "PerplexityBot",
  "Bytespider",
  "Google-Extended",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: DISALLOW },
      // Allow AI crawlers everywhere EXCEPT the same private routes.
      ...AI_USER_AGENTS.map((userAgent) => ({
        userAgent,
        allow: "/",
        disallow: DISALLOW,
      })),
    ],
    sitemap: "https://www.codu.co/sitemap.xml",
  };
}
