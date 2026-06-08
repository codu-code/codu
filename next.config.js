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
      // Redirect legacy feed article URLs to new unified pattern
      // /feed/[sourceSlug]/[articleId] -> /[sourceSlug]/[articleId]
      {
        source: "/feed/:sourceSlug/:articleId",
        destination: "/:sourceSlug/:articleId",
        permanent: true,
      },
      // Redirect legacy feed source URLs to new unified pattern
      // /feed/[sourceSlug] -> /[sourceSlug]
      {
        source: "/feed/:sourceSlug",
        destination: "/:sourceSlug",
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
