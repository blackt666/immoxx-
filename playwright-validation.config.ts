import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "tests",
  testMatch: ["**/audit-test-validation.spec.ts", "**/audit-bericht-demo.spec.ts"],
  timeout: 30_000,
  expect: { timeout: 5_000 },
  retries: 0,
  use: {
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "off",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  reporter: [["line"]],
  // No webServer for validation tests
});