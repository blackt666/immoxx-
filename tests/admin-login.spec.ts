import { test, expect } from "@playwright/test";

test("admin login flow", async ({ page }) => {
  const baseURL =
    process.env.BASE_URL || `http://localhost:${process.env.PORT || 5000}`;
  const ADMIN_USER = process.env.ADMIN_USERNAME || "admin";
  const ADMIN_PASS = process.env.ADMIN_PASSWORD || "dev-fallback-2025";

  console.log(`🔐 Testing admin login with user: ${ADMIN_USER}`);

  await page.goto(`${baseURL}/admin/login`, {
    waitUntil: "domcontentloaded",
    timeout: 10000,
  });

  // Fill login form
  const usernameField = page
    .locator(
      'input[name="username"], input[name="email"], input[placeholder*="nutzername"], input[placeholder*="admin"]',
    )
    .first();
  const passwordField = page.locator('input[type="password"]').first();
  const submitButton = page
    .locator(
      'button[type="submit"], button:has-text("Anmelden"), button:has-text("Login")',
    )
    .first();

  await usernameField.fill(ADMIN_USER);
  await passwordField.fill(ADMIN_PASS);

  console.log("📝 Filled login credentials");

  // Submit form and wait for navigation
  await Promise.all([
    page.waitForNavigation({ waitUntil: "networkidle", timeout: 10000 }),
    submitButton.click(),
  ]);

  console.log(`🔄 Navigated to: ${page.url()}`);

  // Check if we're in admin area
  const isInAdmin =
    page.url().includes("/admin") && !page.url().includes("/login");
  expect(isInAdmin).toBeTruthy();

  // Look for admin-specific elements
  const adminElements = await page
    .locator(
      'nav, .sidebar, [data-testid="admin"], h1:has-text("Dashboard"), h1:has-text("Admin")',
    )
    .count();
  expect(adminElements).toBeGreaterThan(0);

  console.log("✅ Admin login successful");
});

test("admin dashboard exploration", async ({ page }) => {
  const baseURL =
    process.env.BASE_URL || `http://localhost:${process.env.PORT || 5000}`;
  const ADMIN_USER = process.env.ADMIN_USERNAME || "admin";
  const ADMIN_PASS = process.env.ADMIN_PASSWORD || "dev-fallback-2025";

  // Login first
  await page.goto(`${baseURL}/admin/login`, { waitUntil: "domcontentloaded" });
  await page
    .locator(
      'input[name="username"], input[name="email"], input[placeholder*="nutzername"], input[placeholder*="admin"]',
    )
    .first()
    .fill(ADMIN_USER);
  await page.locator('input[type="password"]').first().fill(ADMIN_PASS);
  await Promise.all([
    page.waitForNavigation({ waitUntil: "networkidle" }),
    page
      .locator(
        'button[type="submit"], button:has-text("Anmelden"), button:has-text("Login")',
      )
      .first()
      .click(),
  ]);

  console.log("🔍 Exploring admin dashboard...");

  // Click through admin navigation
  const navLinks = page.locator('nav a, .sidebar a, [role="navigation"] a');
  const navCount = await navLinks.count();

  for (let i = 0; i < Math.min(navCount, 10); i++) {
    try {
      const link = navLinks.nth(i);
      const text = (await link.textContent())?.trim() || "no text";
      const href = await link.getAttribute("href");

      if (href && !href.includes("logout") && !href.includes("extern")) {
        console.log(`🖱️ Clicking admin nav: "${text}"`);
        await link.click({ timeout: 3000 });
        await page.waitForLoadState("networkidle", { timeout: 5000 });
        console.log(`📍 Current URL: ${page.url()}`);

        // Brief pause between navigation
        await page.waitForTimeout(500);
      }
    } catch (error) {
      console.log(`⚠️ Could not navigate to item ${i + 1}: ${error.message}`);
    }
  }

  console.log("✅ Admin dashboard exploration completed");
});
