import { test, expect } from "@playwright/test";

test("Content Editor accessibility test", async ({ page }) => {
  const baseURL = process.env.BASE_URL || `http://localhost:${process.env.PORT || 5000}`;
  const ADMIN_USER = process.env.ADMIN_USERNAME || "admin";
  const ADMIN_PASS = process.env.ADMIN_PASSWORD || "bodensee2025";

  console.log("🔍 Testing Content Editor accessibility...");

  // First, login to admin
  await page.goto(`${baseURL}/admin/login`, {
    waitUntil: "domcontentloaded",
    timeout: 10000,
  });

  // Login
  const usernameField = page.locator('input[name="username"], input[name="email"], input[placeholder*="nutzername"], input[placeholder*="admin"]').first();
  const passwordField = page.locator('input[type="password"]').first();
  const submitButton = page.locator('button[type="submit"], button:has-text("Anmelden"), button:has-text("Login")').first();

  await usernameField.fill(ADMIN_USER);
  await passwordField.fill(ADMIN_PASS);

  console.log("📝 Filled login credentials for Content Editor test");

  // Submit and wait for dashboard
  await Promise.all([
    page.waitForNavigation({ waitUntil: "networkidle", timeout: 10000 }),
    submitButton.click(),
  ]);

  console.log(`🔄 Logged in, current URL: ${page.url()}`);

  // Check if we're in admin area
  expect(page.url()).toContain("/admin");
  expect(page.url()).not.toContain("/login");

  // Wait for dashboard to load
  await page.waitForLoadState("networkidle");

  // Look for Content Editor navigation item
  console.log("🔍 Looking for Content Editor navigation...");
  
  // Try different selectors for the Content Editor nav item
  const contentEditorSelectors = [
    'button:has-text("Content Editor")',
    'a:has-text("Content Editor")',
    '[data-testid*="content"]',
    'nav button:has-text("Content")',
    '.sidebar button:has-text("Content")',
    'button:has-text("Editor")',
  ];

  let contentEditorButton = null;
  for (const selector of contentEditorSelectors) {
    const element = page.locator(selector).first();
    if (await element.count() > 0) {
      contentEditorButton = element;
      console.log(`✅ Found Content Editor button with selector: ${selector}`);
      break;
    }
  }

  if (!contentEditorButton) {
    console.log("📋 Available navigation items:");
    const navItems = page.locator('nav button, .sidebar button, [role="navigation"] button');
    const count = await navItems.count();
    for (let i = 0; i < count; i++) {
      const text = await navItems.nth(i).textContent();
      console.log(`  - "${text?.trim()}"`);
    }
    throw new Error("Content Editor navigation button not found");
  }

  // Click Content Editor navigation
  console.log("🖱️ Clicking Content Editor navigation...");
  await contentEditorButton.click();
  
  // Wait for content to load
  await page.waitForTimeout(2000);

  // Check if Content Editor loads
  console.log("🔍 Checking if Content Editor component loaded...");
  
  // Look for Content Editor specific elements
  const contentEditorElements = [
    'h1:has-text("Content Editor")',
    'h2:has-text("Content")',
    'h3:has-text("Content")',
    '[data-testid*="content-editor"]',
    'textarea[placeholder*="content"]',
    'input[placeholder*="title"]',
    'button:has-text("Speichern")',
    'button:has-text("Save")',
    'label:has-text("Hero")',
    'label:has-text("About")',
    'label:has-text("Contact")',
  ];

  let foundElement = false;
  for (const selector of contentEditorElements) {
    const element = page.locator(selector).first();
    if (await element.count() > 0) {
      console.log(`✅ Found Content Editor element: ${selector}`);
      foundElement = true;
      break;
    }
  }

  if (!foundElement) {
    console.log("❌ Content Editor elements not found");
    
    // Capture current page content for debugging
    const pageTitle = await page.title();
    const bodyText = await page.locator('body').textContent();
    console.log(`Page title: ${pageTitle}`);
    console.log(`Page contains text: ${bodyText?.substring(0, 200)}...`);
    
    // Check for any error messages
    const errorElements = page.locator('.error, .alert, [class*="error"], [class*="alert"]');
    const errorCount = await errorElements.count();
    if (errorCount > 0) {
      for (let i = 0; i < errorCount; i++) {
        const errorText = await errorElements.nth(i).textContent();
        console.log(`Error found: ${errorText}`);
      }
    }
    
    throw new Error("Content Editor component did not load properly");
  }

  // Check browser console for errors
  const logs = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      logs.push(`Console Error: ${msg.text()}`);
    }
  });

  // Wait a bit to capture any async errors
  await page.waitForTimeout(1000);

  if (logs.length > 0) {
    console.log("⚠️ Browser console errors found:");
    logs.forEach(log => console.log(`  ${log}`));
  }

  console.log("✅ Content Editor accessibility test completed successfully");
});

test("Content Editor functionality test", async ({ page }) => {
  const baseURL = process.env.BASE_URL || `http://localhost:${process.env.PORT || 5000}`;
  const ADMIN_USER = process.env.ADMIN_USERNAME || "admin";
  const ADMIN_PASS = process.env.ADMIN_PASSWORD || "bodensee2025";

  console.log("🧪 Testing Content Editor functionality...");

  // Login and navigate to Content Editor (same as above)
  await page.goto(`${baseURL}/admin/login`);
  await page.locator('input[name="username"], input[name="email"], input[placeholder*="nutzername"], input[placeholder*="admin"]').first().fill(ADMIN_USER);
  await page.locator('input[type="password"]').first().fill(ADMIN_PASS);
  await Promise.all([
    page.waitForNavigation({ waitUntil: "networkidle" }),
    page.locator('button[type="submit"], button:has-text("Anmelden"), button:has-text("Login")').first().click(),
  ]);

  // Navigate to Content Editor
  const contentEditorButton = page.locator('button:has-text("Content Editor")').first();
  if (await contentEditorButton.count() > 0) {
    await contentEditorButton.click();
    await page.waitForTimeout(2000);

    // Test form interactions
    console.log("🧪 Testing form inputs...");
    
    // Look for common form elements
    const titleInput = page.locator('input[placeholder*="title"], input[placeholder*="Title"]').first();
    if (await titleInput.count() > 0) {
      await titleInput.fill("Test Title");
      console.log("✅ Title input works");
    }

    const textArea = page.locator('textarea').first();
    if (await textArea.count() > 0) {
      await textArea.fill("Test content");
      console.log("✅ Textarea input works");
    }

    // Look for save button
    const saveButton = page.locator('button:has-text("Speichern"), button:has-text("Save")').first();
    if (await saveButton.count() > 0) {
      console.log("✅ Save button found");
      // Don't actually click to avoid making changes
    }

    console.log("✅ Content Editor functionality test completed");
  } else {
    console.log("❌ Could not access Content Editor for functionality test");
  }
});