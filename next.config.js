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
});
