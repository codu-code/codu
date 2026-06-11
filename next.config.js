/** @type {import('next').NextConfig} */

const withMDX = require("@next/mdx")();

const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true",
});

const REMOTE_PATTERNS = [
  "images.ctfassets.net",
  "images.unsplash.com",
  "avatars.githubusercontent.com",
  "www.gravatar.com",
  // Seed/placeholder avatars + cover images used by dev/e2e fixtures.
  "robohash.org",
  "picsum.photos",
  "i.pravatar.cc",
  // Temporary wildcard
  "*.s3.eu-west-1.amazonaws.com",
  "s3.eu-west-1.amazonaws.com",
].map((hostname) => ({
  hostname,
  protocol: "https",
}));

const config = {
  async redirects() {
    return [
      {
        source: "/newsletter",
        destination: "https://newsletter.codu.co",
        permanent: true,
      },
      {
        source: "/newsletter/:path*",
        destination: "https://newsletter.codu.co",
        permanent: true,
      },
      // Legacy feed article URLs -> /s/ namespace (one hop, no redirect chain).
      // /feed/[sourceSlug]/[articleId] -> /s/[sourceSlug]/[articleId]
      {
        source: "/feed/:sourceSlug/:articleId",
        destination: "/s/:sourceSlug/:articleId",
        permanent: true,
      },
      // Legacy feed source URLs -> /s/ namespace.
      // /feed/[sourceSlug] -> /s/[sourceSlug]
      {
        source: "/feed/:sourceSlug",
        destination: "/s/:sourceSlug",
        permanent: true,
      },
    ];
  },
  // Turbopack configuration for SVGR (replaces webpack config)
  turbopack: {
    rules: {
      "*.svg": {
        loaders: ["@svgr/webpack"],
        as: "*.js",
      },
    },
  },
  pageExtensions: ["js", "jsx", "mdx", "ts", "tsx"],
  // Explicit: never serve/redirect to trailing-slash variants. Next already
  // 301s `/foo/` -> `/foo`; this documents the intent and keeps canonicals tidy.
  trailingSlash: false,
  images: {
    remotePatterns: REMOTE_PATTERNS,
  },
  // Note: i18n is not supported in App Router - use middleware for i18n instead
  // Note: experimental.instrumentationHook is now auto-detected in Next.js 16
  // Note: typescript.ignoreBuildErrors removed - fixing TS errors as part of upgrade
};

// Injected content via Sentry wizard below

const { withSentryConfig } = require("@sentry/nextjs");

module.exports = withSentryConfig(withMDX(withBundleAnalyzer(config)), {
  silent: true,
  org: "codu",
  project: "codu",
  hideSourceMaps: true,
});
