import { defineConfig, devices } from "@playwright/test";

const BASE_URL =
  process.env.BASE_URL || `http://localhost:${process.env.PORT || 5001}`;

export default defineConfig({
  testDir: "tests",
  testMatch: "**/*.spec.ts", // Only run .spec.ts files (exclude .test.ts files for Vitest)
  timeout: 30_000,
  expect: { timeout: 5_000 },
  retries: 0,
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "off",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  reporter: [
    ["html", { outputFolder: "logs/playwright-report" }],
    ["json", { outputFile: "logs/test-results.json" }],
  ],
  // Skip webServer config for now
});
