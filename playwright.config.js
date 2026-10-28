import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "e2e",
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: "list",
  // E2E_BASE_URL points the tests at an already running site (e.g. the Docker image) instead of the dev server
  use: { baseURL: process.env.E2E_BASE_URL ?? "http://localhost:4173", trace: "retain-on-failure" },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] }, testIgnore: "analytics.spec.js" },
    { name: "mobile", use: { ...devices["Pixel 7"] }, testIgnore: "analytics.spec.js" },
    // analytics needs a build with a measurement ID, so it gets its own server (and is skipped against E2E_BASE_URL)
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
          command: "npx vite --port 4173 --strictPort",
          url: "http://localhost:4173",
          reuseExistingServer: !process.env.CI,
        },
        {
          command: "npx vite --port 4174 --strictPort",
          env: { VITE_GA_MEASUREMENT_ID: "G-E2ETEST00" },
          url: "http://localhost:4174",
          reuseExistingServer: !process.env.CI,
        },
      ],
});
