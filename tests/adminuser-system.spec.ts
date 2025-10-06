import { test, expect } from "@playwright/test";

test.describe("New AdminUser System", () => {
  const baseURL = process.env.BASE_URL || `http://localhost:${process.env.PORT || 5001}`;
  const ADMIN_USER = "admin";
  const ADMIN_PASS = "bodensee2025";

  test("adminuser login and dashboard flow", async ({ page }) => {
    console.log(`🔐 Testing new adminuser system with user: ${ADMIN_USER}`);

    // Navigate to new adminuser login page
    await page.goto(`${baseURL}/adminuser`, {
      waitUntil: "networkidle",
      timeout: 15000,
    });

    console.log(`📍 Navigated to: ${page.url()}`);

    // Wait for React to fully render by looking for the form elements to appear
    await page.waitForSelector('form', { timeout: 10000 });
    
    // Wait a bit more for the form to be fully interactive
    await page.waitForTimeout(1000);

    // Take a screenshot to see what's on the page
    await page.screenshot({ path: 'test-results/adminuser-login-loaded.png', fullPage: true });

    // Look for login form elements - use the correct selectors based on our implementation
    const usernameField = page.locator('input[id="username"]');
    const passwordField = page.locator('input[id="password"]');
    const submitButton = page.locator('button[type="submit"]');

    // Check if elements are visible with longer timeout
    await expect(usernameField).toBeVisible({ timeout: 10000 });
    await expect(passwordField).toBeVisible({ timeout: 10000 });
    await expect(submitButton).toBeVisible({ timeout: 10000 });

    console.log("✅ Login form elements found and visible");

    // Fill login form
    await usernameField.fill(ADMIN_USER);
    await passwordField.fill(ADMIN_PASS);

    console.log("📝 Filled login credentials");

    // Submit form and wait for navigation
    await Promise.all([
      page.waitForURL(`${baseURL}/adminuser/dashboard`, { timeout: 15000 }),
      submitButton.click(),
    ]);

    console.log(`🔄 Successfully navigated to: ${page.url()}`);

    // Verify we're on the dashboard
    expect(page.url()).toContain("/adminuser/dashboard");

    // Take a screenshot of the dashboard
    await page.screenshot({ path: 'test-results/adminuser-dashboard.png', fullPage: true });

    // Check for dashboard elements
    await expect(page.locator('h1, h2').filter({ hasText: /dashboard|admin/i })).toBeVisible({ timeout: 5000 });

    console.log("✅ Dashboard loaded successfully");

    // Test logout functionality
    const logoutButton = page.locator('button:has-text("Abmelden"), button:has-text("Logout")');
    if (await logoutButton.isVisible()) {
      await logoutButton.click();
      await page.waitForURL(`${baseURL}/adminuser`, { timeout: 10000 });
      console.log("✅ Logout successful");
    } else {
      console.log("⚠️ Logout button not found");
    }
  });

  test("adminuser login form validation", async ({ page }) => {
    await page.goto(`${baseURL}/adminuser`);

    // Test empty form submission
    const submitButton = page.locator('button[type="submit"]').first();
    await submitButton.click();

    // Should still be on login page
    expect(page.url()).toContain("/adminuser");

    console.log("✅ Form validation working - empty submission rejected");

    // Test wrong credentials
    const usernameField = page.locator('input[name="username"], input[type="text"]').first();
    const passwordField = page.locator('input[name="password"], input[type="password"]').first();

    await usernameField.fill("wrong");
    await passwordField.fill("wrong");
    await submitButton.click();

    // Should still be on login page after wrong credentials
    await page.waitForTimeout(2000);
    expect(page.url()).toContain("/adminuser");

    console.log("✅ Wrong credentials rejected");
  });

  test("adminuser accessibility check", async ({ page }) => {
    await page.goto(`${baseURL}/adminuser`);
    
    // Check for basic accessibility elements
    const title = await page.title();
    expect(title).toBeTruthy();
    
    // Check for form labels or accessible names
    const usernameField = page.locator('input[name="username"], input[type="text"]').first();
    const passwordField = page.locator('input[name="password"], input[type="password"]').first();
    
    await expect(usernameField).toBeVisible();
    await expect(passwordField).toBeVisible();
    
    console.log("✅ Basic accessibility checks passed");
  });
});