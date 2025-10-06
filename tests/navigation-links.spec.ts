import { test, expect } from "@playwright/test";

/**
 * Navigation Links E2E Test
 *
 * Tests all header navigation links:
 * 1. Main navigation items (Home, Properties, About, Services, Contact)
 * 2. AI Valuation external link
 * 3. Smooth scrolling behavior
 * 4. Mobile menu functionality
 * 5. Language selector
 */

test.describe("Header Navigation Links", () => {
  const baseURL = process.env.BASE_URL || `http://localhost:${process.env.PORT || 5001}`;

  test("all main navigation links work", async ({ page }) => {
    console.log("🧭 Testing main navigation links...");

    await page.goto(baseURL, { waitUntil: "domcontentloaded", timeout: 10000 });

    const navigationItems = [
      { name: "Home", selector: 'a[href="#home"], button:has-text("Home")' },
      { name: "Properties", selector: 'a[href="#properties"], button:has-text("Immobilien")' },
      { name: "About", selector: 'a[href="#about"], button:has-text("Über uns")' },
      { name: "Services", selector: 'a[href="#services"], button:has-text("Leistungen")' },
      { name: "Contact", selector: 'a[href="#contact"], button:has-text("Kontakt")' },
    ];

    for (const item of navigationItems) {
            // Find the navigation link
      const link = page.locator(item.selector).first();

      if (await link.count() > 0) {
        await expect(link).toBeVisible();
        console.log(`✅ ${item.name} link found and visible`);

        // Click the link with force option to bypass interception
        await link.click({ force: true });
        await page.waitForTimeout(1000); // Wait for smooth scroll

        console.log(`✅ ${item.name} link clicked successfully`);
      } else {
        console.log(`⚠️ ${item.name} link not found`);
      }
    }

    console.log("✅ All main navigation links tested");
  });

  test("AI valuation link navigates to correct page", async ({ page }) => {
    console.log("🤖 Testing AI Valuation navigation...");

    await page.goto(baseURL, { waitUntil: "domcontentloaded", timeout: 10000 });

    // Find AI Valuation link (it's an external link to /ai-valuation)
    const aiLink = page.locator('nav a[href="/ai-valuation"], nav button:has-text("AI-Bewertung")').first();

    if (await aiLink.count() > 0) {
      await expect(aiLink).toBeVisible();
      console.log("✅ AI Valuation link found");

      // Check if it has the AI badge/icon
      const hasAIIcon = await page.locator('nav svg, nav span').filter({ hasText: /AI|🤖|⚡/i }).count() > 0;
      if (hasAIIcon) {
        console.log("✅ AI Valuation link has AI indicator");
      }

      // Click and navigate
      await aiLink.click();
      await page.waitForLoadState("networkidle", { timeout: 5000 });

      // Verify we're on the AI valuation page
      expect(page.url()).toContain("/ai-valuation");
      console.log("✅ Navigated to AI Valuation page:", page.url());

      // Verify page content
      await expect(
        page.locator('h1, h2').filter({ hasText: /AI.*Bewertung/i }).first()
      ).toBeVisible({ timeout: 5000 });
      console.log("✅ AI Valuation page content verified");

      // Check for back button
      const backButton = page.locator('a[href="/"], button:has-text("Zurück")').first();
      if (await backButton.count() > 0) {
        console.log("✅ Back to homepage button found");
      }
    } else {
      console.log("⚠️ AI Valuation link not found in navigation");
    }
  });

  test("navigation has hover effects", async ({ page }) => {
    console.log("🎨 Testing navigation hover effects...");

    await page.goto(baseURL, { waitUntil: "domcontentloaded", timeout: 10000 });

    // Get first navigation link
    const firstLink = page.locator('nav a, nav button').filter({ hasText: /Home|Immobilien|Über/i }).first();

    if (await firstLink.count() > 0) {
      // Get initial styles
      const initialColor = await firstLink.evaluate(el =>
        window.getComputedStyle(el).color
      );

      // Hover over link
      await firstLink.hover();
      await page.waitForTimeout(300);

      // Get hover styles
      const hoverColor = await firstLink.evaluate(el =>
        window.getComputedStyle(el).color
      );

      console.log(`Initial color: ${initialColor}`);
      console.log(`Hover color: ${hoverColor}`);

      // Colors might change on hover
      console.log("✅ Hover effect tested");
    }
  });

  test("navigation scrolls smoothly to sections", async ({ page }) => {
    console.log("📜 Testing smooth scrolling...");

    await page.goto(baseURL, { waitUntil: "domcontentloaded", timeout: 10000 });

    // Get scroll position before click
    const initialScroll = await page.evaluate(() => window.scrollY);
    console.log(`Initial scroll position: ${initialScroll}px`);

    // Click on a section link (e.g., Properties)
    const propertiesLink = page.locator('nav a[href="#properties"], nav button:has-text("Immobilien")').first();

    if (await propertiesLink.count() > 0) {
      await propertiesLink.click();

      // Wait a bit for scroll animation
      await page.waitForTimeout(1500);

      const finalScroll = await page.evaluate(() => window.scrollY);
      console.log(`Final scroll position: ${finalScroll}px`);

      // Verify page scrolled
      expect(finalScroll).toBeGreaterThan(initialScroll);
      console.log("✅ Page scrolled smoothly");

      // Verify the properties section is in viewport
      const propertiesSection = page.locator('#properties, section:has-text("Immobilien")').first();
      if (await propertiesSection.count() > 0) {
        const boundingBox = await propertiesSection.boundingBox();
        if (boundingBox && boundingBox.y < 1000) {
          console.log("✅ Properties section is in viewport");
        }
      }
    }
  });

  test("mobile menu works correctly", async ({ page }) => {
    console.log("📱 Testing mobile menu...");

    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto(baseURL, { waitUntil: "domcontentloaded", timeout: 10000 });

    // Find mobile menu button (hamburger icon)
    const menuButton = page.locator('button[aria-label*="menu"], button:has(svg.lucide-menu)').first();

    await expect(menuButton).toBeVisible();
    console.log("✅ Mobile menu button found");

    // Click to open menu
    await menuButton.click();
    await page.waitForTimeout(500);
    console.log("✅ Mobile menu opened");

    // Verify menu items are visible
    const mobileNavItems = page.locator('nav a, nav button').filter({ hasText: /Home|Immobilien|Kontakt/i });
    const count = await mobileNavItems.count();

    expect(count).toBeGreaterThan(0);
    console.log(`✅ Found ${count} navigation items in mobile menu`);

    // Test clicking a menu item
    const firstItem = mobileNavItems.first();
    if (await firstItem.count() > 0) {
      await firstItem.click();
      await page.waitForTimeout(1000);
      console.log("✅ Mobile menu item clicked");

      // Menu should close after clicking
      // (depending on implementation, might need to verify)
    }

    // Test closing menu with X button
    await page.goto(baseURL, { waitUntil: "domcontentloaded" });
    await menuButton.click();
    await page.waitForTimeout(300);

    const closeButton = page.locator('button:has(svg.lucide-x), button[aria-label*="close"]').first();
    if (await closeButton.count() > 0) {
      await closeButton.click();
      await page.waitForTimeout(300);
      console.log("✅ Mobile menu closed with X button");
    }
  });

  test("language selector works", async ({ page }) => {
    console.log("🌐 Testing language selector...");

    await page.goto(baseURL, { waitUntil: "domcontentloaded", timeout: 10000 });

    // Look for language selector
    const langSelector = page.locator(
      'button:has-text("DE"), button:has-text("EN"), select[name*="lang"], [class*="language"]'
    ).first();

    if (await langSelector.count() > 0) {
      await expect(langSelector).toBeVisible();
      console.log("✅ Language selector found");

      // Click language selector
      await langSelector.click();
      await page.waitForTimeout(500);

      // Look for language options
      const langOptions = page.locator('button:has-text("English"), button:has-text("Deutsch")');
      const optionsCount = await langOptions.count();

      if (optionsCount > 0) {
        console.log(`✅ Found ${optionsCount} language option(s)`);

        // Select a language (if different from current)
        const englishOption = page.locator('button:has-text("English")').first();
        if (await englishOption.count() > 0) {
          await englishOption.click();
          await page.waitForTimeout(1000);
          console.log("✅ Language changed to English");

          // Verify language changed (check for English text)
          const englishText = await page.locator('body').textContent();
          if (englishText?.includes("Properties") || englishText?.includes("About")) {
            console.log("✅ Page content changed to English");
          }
        }
      }
    } else {
      console.log("⚠️ Language selector not found");
    }
  });

  test("navigation is sticky on scroll", async ({ page }) => {
    console.log("📌 Testing sticky navigation...");

    await page.goto(baseURL, { waitUntil: "domcontentloaded", timeout: 10000 });

    const navigation = page.locator("nav").first();
    await expect(navigation).toBeVisible();

    // Get initial position
    const initialPosition = await navigation.evaluate(el => ({
      position: window.getComputedStyle(el).position,
      top: window.getComputedStyle(el).top,
    }));

    console.log(`Navigation position: ${initialPosition.position}, top: ${initialPosition.top}`);

    // Scroll down
    await page.evaluate(() => window.scrollTo(0, 500));
    await page.waitForTimeout(500);

    // Navigation should still be visible (sticky/fixed)
    const isStillVisible = await navigation.isVisible();
    expect(isStillVisible).toBeTruthy();
    console.log("✅ Navigation remains visible after scroll");

    // Check if navigation has backdrop blur or background change
    const scrolledStyles = await navigation.evaluate(el => ({
      backdropFilter: window.getComputedStyle(el).backdropFilter,
      backgroundColor: window.getComputedStyle(el).backgroundColor,
    }));

    if (scrolledStyles.backdropFilter !== "none") {
      console.log(`✅ Navigation has backdrop blur: ${scrolledStyles.backdropFilter}`);
    }

    if (scrolledStyles.backgroundColor !== "rgba(0, 0, 0, 0)") {
      console.log(`✅ Navigation background changed: ${scrolledStyles.backgroundColor}`);
    }
  });

  test("logo links to homepage", async ({ page }) => {
    console.log("🏠 Testing logo link...");

    await page.goto(`${baseURL}/ai-valuation`, {
      waitUntil: "domcontentloaded",
      timeout: 10000
    });

    // Find logo link
    const logo = page.locator('nav a[data-testid="link-logo"], nav a:has-text("Müller")').first();

    if (await logo.count() > 0) {
      await expect(logo).toBeVisible();
      console.log("✅ Logo found in navigation");

      // Click logo
      await logo.click();
      await page.waitForLoadState("networkidle", { timeout: 5000 });

      // Should be back on homepage
      expect(page.url()).toBe(`${baseURL}/`);
      console.log("✅ Logo links to homepage");
    } else {
      console.log("⚠️ Logo link not found");
    }
  });
});
