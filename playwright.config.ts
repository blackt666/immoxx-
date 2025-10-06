import { defineConfig, devices } from "@playwright/test";

const BASE_URL =
  process.env.BASE_URL || `http://localhost:${process.env.PORT || 5001}`;

export default defineConfig({
  testDir: "tests",
  testMatch: "**/*.spec.ts", // Only run .spec.ts files (exclude .test.ts files for Vitest)
  timeout: 45_000,
  expect: { timeout: 8_000 },
  retries: 1,
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
