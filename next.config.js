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

// Production is also reachable on *.vercel.app aliases, which search engines
// treat as a duplicate site. Send those hosts to the project's production
// domain. /api is left alone because server rendering calls its own deployment
// URL, and preview deploys keep their vercel.app hosts. A project whose
// production domain is itself a vercel.app host (a fork) is not redirected.
const PRODUCTION_HOST = process.env.VERCEL_PROJECT_PRODUCTION_URL;
const VERCEL_HOST_REDIRECTS =
  process.env.VERCEL_ENV === "production" &&
  PRODUCTION_HOST &&
  !PRODUCTION_HOST.endsWith(".vercel.app")
    ? [
        {
          source: "/:path((?!api/).*)",
          has: [{ type: "host", value: ".*\\.vercel\\.app" }],
          destination: `https://${PRODUCTION_HOST}/:path`,
          permanent: true,
        },
      ]
    : [];

const config = {
  async redirects() {
    return [
      ...VERCEL_HOST_REDIRECTS,
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
      {
        source: "/feed/:sourceSlug/:articleId",
        destination: "/s/:sourceSlug/:articleId",
        permanent: true,
      },
      // Legacy feed source URLs -> /s/ namespace.
      {
        source: "/feed/:sourceSlug",
        destination: "/s/:sourceSlug",
        permanent: true,
      },
      // Deleted course pages and the removed /alpha section — send home
      // rather than hard-404 previously-resolvable URLs.
      {
        source: "/courses/:path*",
        destination: "/",
        permanent: true,
      },
      {
        source: "/alpha/:path*",
        destination: "/",
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
  // Never serve trailing-slash variants (Next 301s `/foo/` -> `/foo`).
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
