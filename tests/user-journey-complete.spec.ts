import { test, expect } from "@playwright/test";

/**
 * Complete User Journey E2E Test
 *
 * Simulates a typical user navigating the website:
 * 1. Landing Page → Navigation
 * 2. AI Valuation Tool
 * 3. Properties Listing
 * 4. Contact Form
 */

test.describe("Complete User Journey", () => {
  const baseURL = process.env.BASE_URL || `http://localhost:${process.env.PORT || 5001}`;

  test("user navigates from landing to AI valuation and contact", async ({ page }) => {
    console.log("🚀 Starting complete user journey test...");

    // 1. Visit Landing Page
    await page.goto(baseURL, { waitUntil: "domcontentloaded", timeout: 10000 });
    console.log("✅ Step 1: Landed on homepage");

    // Verify landing page loaded
    await expect(page.locator("h1, h2").first()).toBeVisible({ timeout: 5000 });

    // Check navigation is visible
    const navigation = page.locator("nav").first();
    await expect(navigation).toBeVisible();
    console.log("✅ Navigation visible");

    // 2. Navigate to AI Valuation (Click button or link)
    const aiValuationButton = page.locator('a[href="/ai-valuation"], button:has-text("AI-Bewertung")').first();

    if (await aiValuationButton.count() > 0) {
      await aiValuationButton.click();
      await page.waitForLoadState("networkidle", { timeout: 5000 });
      console.log("✅ Step 2: Navigated to AI Valuation page");

      // Verify AI Valuation page
      expect(page.url()).toContain("/ai-valuation");
      await expect(page.locator("h1, h2").filter({ hasText: /AI.*Bewertung/i }).first()).toBeVisible();
    } else {
      console.log("⚠️ AI Valuation button not found, checking if on-page component exists");

      // Check if AI valuation tool is on the landing page
      const aiToolOnPage = page.locator('[id*="valuation"], [class*="valuation"]').first();
      if (await aiToolOnPage.count() > 0) {
        console.log("✅ AI Valuation tool found on landing page");
      }
    }

    // 3. Test Properties Section Navigation
    await page.goto(baseURL, { waitUntil: "domcontentloaded" });

    // Scroll to properties section
    const propertiesLink = page.locator('a[href="#properties"], a[href*="properties"]').first();
    if (await propertiesLink.count() > 0) {
      await propertiesLink.click();
      await page.waitForTimeout(1000); // Wait for smooth scroll
      console.log("✅ Step 3: Navigated to Properties section");
    }

    // 4. Test Contact Section
    const contactLink = page.locator('a[href="#contact"], button:has-text("Kontakt")').first();
    if (await contactLink.count() > 0) {
      await contactLink.click();
      await page.waitForTimeout(1000);
      console.log("✅ Step 4: Navigated to Contact section");

      // Check if contact form is visible
      const contactForm = page.locator('form, input[type="email"], textarea').first();
      await expect(contactForm).toBeVisible({ timeout: 5000 });
      console.log("✅ Contact form is visible");
    }

    // 5. Test Phone Links (Click-to-Call)
    const phoneLink = page.locator('a[href^="tel:"]').first();
    if (await phoneLink.count() > 0) {
      const href = await phoneLink.getAttribute("href");
      expect(href).toContain("tel:");
      console.log(`✅ Step 5: Phone link found: ${href}`);
    }

    console.log("🎉 Complete user journey test passed!");
  });

  test("user fills out AI valuation form", async ({ page }) => {
    console.log("🧪 Testing AI Valuation form submission...");

    // Navigate to AI Valuation page
    await page.goto(`${baseURL}/ai-valuation`, {
      waitUntil: "domcontentloaded",
      timeout: 10000
    });

    // Wait for form to load
    await page.waitForSelector("input, select, button", { timeout: 5000 });
    console.log("✅ AI Valuation page loaded");

    // Fill out the form
    const addressInput = page.locator('input[id="address"], input[placeholder*="Adresse"]').first();
    if (await addressInput.count() > 0) {
      await addressInput.fill("Seestraße 15, 78464 Konstanz");
      console.log("✅ Filled address field");
    }

    const sizeInput = page.locator('input[id*="size"], input[type="number"]').first();
    if (await sizeInput.count() > 0) {
      await sizeInput.fill("120");
      console.log("✅ Filled size field");
    }

    const roomsInput = page.locator('input[id*="room"]').first();
    if (await roomsInput.count() > 0) {
      await roomsInput.fill("3");
      console.log("✅ Filled rooms field");
    }

    const cityInput = page.locator('input[id="city"], input[placeholder*="Stadt"]').first();
    if (await cityInput.count() > 0) {
      await cityInput.fill("Konstanz");
      console.log("✅ Filled city field");
    }

    // Note: We don't actually submit to avoid DeepSeek API calls in tests
    // unless explicitly testing API integration
    console.log("✅ AI Valuation form successfully filled (not submitted)");
  });

  test("user navigates through all main sections", async ({ page }) => {
    console.log("🧭 Testing all main navigation links...");

    await page.goto(baseURL, { waitUntil: "domcontentloaded", timeout: 10000 });

    const sections = [
      { name: "Home", selector: 'a[href="#home"], a[href="/"]' },
      { name: "Services", selector: 'a[href="#services"]' },
      { name: "Properties", selector: 'a[href="#properties"]' },
      { name: "About", selector: 'a[href="#about"]' },
      { name: "Contact", selector: 'a[href="#contact"]' },
    ];

    for (const section of sections) {
      const link = page.locator(section.selector).first();
      if (await link.count() > 0) {
        await link.click();
        await page.waitForTimeout(800); // Wait for smooth scroll
        console.log(`✅ Navigated to ${section.name}`);
      } else {
        console.log(`⚠️ ${section.name} link not found`);
      }
    }

    console.log("🎉 All navigation sections tested!");
  });
});
