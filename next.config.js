/** @type {import('next').NextConfig} */

const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true",
});

module.exports = withBundleAnalyzer({
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/,
      use: ["@svgr/webpack"],
    });
    return config;
  },
  images: {
    domains: [
      "images.ctfassets.net",
      "images.unsplash.com",
      "avatars.githubusercontent.com",
      "www.gravatar.com",
      // Temporary wildcard
      "*.s3.eu-west-1.amazonaws.com",
    ],
  },
  i18n: {
    locales: ["en"],
    defaultLocale: "en",
  },
  output: "standalone",
  typescript: {
    // Temporary to check pipelines due to weird error I can only get on CodePipeline
    ignoreBuildErrors: true,
  },
  experimental: {
    swcPlugins: [
      [
        "next-superjson-plugin",
        {
          excluded: [],
        },
      ],
    ],
  },
});

// Injected content via Sentry wizard below

const { withSentryConfig } = require("@sentry/nextjs");

module.exports = withSentryConfig(
  module.exports,
  {
    // For all available options, see:
    // https://github.com/getsentry/sentry-webpack-plugin#options

    // Suppresses source map uploading logs during build
    silent: true,
    org: "codu",
    project: "codu",
  },
  {
    // For all available options, see:
    // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

    // Upload a larger set of source maps for prettier stack traces (increases build time)
    widenClientFileUpload: true,

    // Transpiles SDK to be compatible with IE11 (increases bundle size)
    transpileClientSDK: true,

    // Routes browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers (increases server load)
    tunnelRoute: "/monitoring",

    // Hides source maps from generated client bundles
    hideSourceMaps: true,

    // Automatically tree-shake Sentry logger statements to reduce bundle size
    disableLogger: true,
  },
);
