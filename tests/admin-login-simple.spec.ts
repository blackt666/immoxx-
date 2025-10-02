
import { test, expect } from "@playwright/test";

test("admin login form validation", async ({ page }) => {
  const baseURL = process.env.BASE_URL || `http://localhost:${process.env.PORT || 5000}`;
  const ADMIN_USER = process.env.ADMIN_USERNAME || "admin";
  const ADMIN_PASS = process.env.ADMIN_PASSWORD || "bodensee2025";
  
  console.log("🔐 Testing admin login form...");

  // Go to admin login page
  await page.goto(`${baseURL}/admin/login`, { 
    waitUntil: "domcontentloaded",
    timeout: 10000 
  });

  // Check for login form elements
  const usernameField = page.locator('input[placeholder*="Benutzername"]');
  const passwordField = page.locator('input[type="password"]');
  const submitButton = page.locator('button[type="submit"]');
  
  await expect(usernameField).toBeVisible();
  await expect(passwordField).toBeVisible();  
  await expect(submitButton).toBeVisible();
  
  // Fill and submit form
  await usernameField.fill(ADMIN_USER);
  await passwordField.fill(ADMIN_PASS);
  
  console.log("📝 Login form filled");
  
  // Try to submit
  await submitButton.click();
  
  // Wait a moment for any response
  await page.waitForTimeout(2000);
  
  console.log(`📍 Final URL: ${page.url()}`);
  
  // Check if we're in admin area or still on login
  const isInAdmin = page.url().includes("/admin") && !page.url().includes("/login");
  console.log(`✅ Login test completed. In admin: ${isInAdmin}`);
});

test("admin page accessibility", async ({ page }) => {
  const baseURL = process.env.BASE_URL || `http://localhost:${process.env.PORT || 5000}`;
  
  // Test if admin login page loads
  const response = await page.goto(`${baseURL}/admin/login`);
  expect(response?.status()).toBe(200);
  
  // Check page title
  const title = await page.title();
  expect(title).toContain("Admin");
  
  console.log("✅ Admin login page accessible");
});
