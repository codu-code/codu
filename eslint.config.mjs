import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";
import js from "@eslint/js";
import tseslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import playwright from "eslint-plugin-playwright";
import nextConfig from "eslint-config-next/core-web-vitals";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
});

export default [
  {
    ignores: [
      "next.config.js",
      "**/lambdas/**/*.js",
      ".next/**",
      "node_modules/**",
      "cdk/**",
    ],
  },
  ...nextConfig,
  ...compat.extends("prettier"),
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: "./tsconfig.json",
      },
    },
    plugins: {
      "@typescript-eslint": tseslint,
    },
    rules: {
      "@typescript-eslint/consistent-type-imports": "warn",
      "@typescript-eslint/ban-ts-comment": "warn",
      "@next/next/no-img-element": "off",
      "no-unused-vars": "warn",
      "@typescript-eslint/no-unused-vars": "warn",
      "no-console": "warn",
    },
  },
  {
    files: ["e2e/**/*.ts", "e2e/**/*.tsx"],
    plugins: {
      playwright: playwright,
    },
    rules: {
      ...playwright.configs["flat/recommended"].rules,
    },
  },
];
