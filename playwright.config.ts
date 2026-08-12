import { defineConfig, devices } from "@playwright/test";

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// require('dotenv').config();

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  globalSetup: "./e2e/setup.ts",
  globalTeardown: "./e2e/teardown.ts",
  testDir: "e2e",
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Capped locally too: unbounded workers over-subscribe the single dev
     server (Turbopack compiles + shared fixtures) and cause timeout flake.
     4 workers runs the suite faster AND reliably green. */
  workers: process.env.CI ? 3 : 4,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: "html",
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    // baseURL: 'http://127.0.0.1:3000',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: "on-first-retry",
  },
  expect: {
    timeout: 10000,
  },

  /* Configure projects for major browsers */
  projects: [
    { name: "setup", testMatch: /auth.setup\.ts/ },
    {
      name: "Desktop Chrome",
      use: { ...devices["Desktop Chrome"] },
    },

    // The full cross-browser + mobile matrix is ~4× slower, so it only runs on
    // CI or when explicitly opted into locally with ALL_BROWSERS=1. Day-to-day
    // local runs stay on Desktop Chrome for a fast feedback loop.
    ...(process.env.CI || process.env.ALL_BROWSERS
      ? [
          {
            name: "Desktop Firefox",
            use: { ...devices["Desktop Firefox"] },
          },
          {
            name: "Mobile Chrome",
            use: { ...devices["Pixel 9"] },
          },
          {
            name: "Mobile Safari",
            use: { ...devices["iPhone 16"] },
          },
        ]
      : []),
  ],

  outputDir: "playwright-report",

  /* Run your local dev server before starting the tests.

     CI serves a production build instead. Against `next dev`, the FIRST visit
     to each route waits on an on-demand Turbopack compile, which on a cold
     runner routinely outlasts the 10s expect timeout — that is what made the
     admin-nav, editor-publish, bookmark, feed and moderation specs fail there
     while the same suite stayed green locally. A prebuilt server has no
     per-route compile step, so those assertions see the page immediately.
     The build runs here rather than as a workflow step on purpose: the e2e job
     is triggered by `pull_request_target`, so the workflow file always comes
     from the BASE branch while the code comes from the PR head. A build step
     added to the workflow would not run until after merge — but this config
     does, so the two can never disagree. */
  webServer: {
    command: process.env.CI
      ? "npm run build:e2e && npm run start:e2e"
      : "npm run dev:e2e",
    url: "http://127.0.0.1:3000",
    reuseExistingServer: !process.env.CI,
    // Generous: on CI this covers a cold production build, not just boot.
    timeout: process.env.CI ? 600_000 : 120_000,
  },
});
