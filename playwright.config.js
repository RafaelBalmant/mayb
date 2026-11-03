import { defineConfig, devices } from "@playwright/test";

// The tests run against the exported site (out/, from `npm run build`), served like the nginx of the Docker image
// (scripts/serve-static.mjs). The analytics tests need a build with a measurement ID, so they build their own copy
// into out-analytics/. E2E_BASE_URL points the tests at an already running site (e.g. the Docker image) instead.
export default defineConfig({
  testDir: "e2e",
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: "list",
  use: { baseURL: process.env.E2E_BASE_URL ?? "http://localhost:4173", trace: "retain-on-failure" },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] }, testIgnore: "analytics.spec.js" },
    { name: "mobile", use: { ...devices["Pixel 7"] }, testIgnore: "analytics.spec.js" },
    ...(process.env.E2E_BASE_URL
      ? []
      : [
          {
            name: "analytics",
            use: { ...devices["Desktop Chrome"], baseURL: "http://localhost:4174" },
            testMatch: "analytics.spec.js",
          },
        ]),
  ],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : [
        {
          command: "node scripts/serve-static.mjs out 4173",
          url: "http://localhost:4173",
          reuseExistingServer: !process.env.CI,
        },
        {
          command:
            "npx next build && node scripts/postbuild.mjs out-analytics && node scripts/serve-static.mjs out-analytics 4174",
          env: { NEXT_PUBLIC_GA_MEASUREMENT_ID: "G-E2ETEST00", NEXT_DIST_DIR: "out-analytics" },
          url: "http://localhost:4174",
          timeout: 180_000,
          reuseExistingServer: !process.env.CI,
        },
      ],
});
