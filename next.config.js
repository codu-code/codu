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
    ],
  },
  i18n: {
    locales: ["en"],
    defaultLocale: "en",
  },
});
