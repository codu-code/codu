/** @type {import('next').NextConfig} */

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
].map((hostname) => ({
  hostname,
  protocol: "https",
}));

module.exports = withBundleAnalyzer({
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/,
      use: ["@svgr/webpack"],
    });
    return config;
  },
  images: {
    remotePatterns: REMOTE_PATTERNS,
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
  transpilePackages: [
    "@tiptap/extension-code-block-lowlight",
    "@tiptap/extension-color",
    "@tiptap/extension-highlight",
    "@tiptap/extension-image",
    "@tiptap/extension-link",
    "@tiptap/extension-placeholder",
    "@tiptap/extension-subscript",
    "@tiptap/extension-superscript",
    "@tiptap/extension-table",
    "@tiptap/extension-table-cell",
    "@tiptap/extension-table-header",
    "@tiptap/extension-table-row",
    "@tiptap/extension-task-item",
    "@tiptap/extension-task-list",
    "@tiptap/extension-text-align",
    "@tiptap/extension-text-style",
    "@tiptap/extension-underline",
    "@tiptap/extension-youtube",
    "@heroicons/react",
    "@radix-ui/react-popover",
    "@radix-ui/react-switch",
    "lucide-react"
  ],
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
    silent: true,
    org: "codu",
    project: "codu",
  },
  {
    hideSourceMaps: true,
  },
);
