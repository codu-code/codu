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
  // Temporary wildcard
  "*.s3.eu-west-1.amazonaws.com",
  "s3.eu-west-1.amazonaws.com",
  "s3-alpha-sig.figma.com", //Added for Figma
].map((hostname) => ({
  hostname,
  protocol: "https",
}));

const config = {
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/,
      use: ["@svgr/webpack"],
    });
    return config;
  },
  pageExtensions: ["js", "jsx", "mdx", "ts", "tsx"],
  images: {
    remotePatterns: REMOTE_PATTERNS,
  },
  i18n: {
    locales: ["en"],
    defaultLocale: "en",
  },
  typescript: {
    // Temporary to check pipelines due to weird error I can only get on CodePipeline
    ignoreBuildErrors: true,
  },
  experimental: {
    instrumentationHook: true,
  },
};

// Injected content via Sentry wizard below

const { withSentryConfig } = require("@sentry/nextjs");

module.exports = withSentryConfig(withMDX(withBundleAnalyzer(config)), {
  silent: true,
  org: "codu",
  project: "codu",
  hideSourceMaps: true,
});
