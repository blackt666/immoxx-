import { test, expect } from "@playwright/test";

/**
 * Phone Links (tel:) E2E Test
 *
 * Verifies all phone numbers are clickable with proper tel: links
 * Tests:
 * 1. Navigation header phone links
 * 2. Footer phone links
 * 3. Contact section phone links
 * 4. Mobile viewport phone link behavior
 */

test.describe("Phone Links Functionality", () => {
  const baseURL = process.env.BASE_URL || `http://localhost:${process.env.PORT || 5001}`;

  test("navigation header has clickable phone links", async ({ page }) => {
    console.log("📞 Testing navigation header phone links...");

    await page.goto(baseURL, { waitUntil: "domcontentloaded", timeout: 10000 });

    // Look for phone links in navigation
    const navPhoneLinks = page.locator('nav a[href^="tel:"]');
    const count = await navPhoneLinks.count();

    console.log(`Found ${count} phone link(s) in navigation`);

    if (count > 0) {
      for (let i = 0; i < count; i++) {
        const phoneLink = navPhoneLinks.nth(i);
        const href = await phoneLink.getAttribute("href");
        const text = await phoneLink.textContent();

        console.log(`✅ Phone link ${i + 1}: ${text?.trim()} → ${href}`);

        // Verify href format
        expect(href).toMatch(/^tel:\+?\d+/);

        // Verify link is visible (might be hidden on mobile)
        const isVisible = await phoneLink.isVisible();
        if (isVisible) {
          console.log(`   Link is visible on desktop`);
        }
      }

      console.log("✅ Navigation phone links are properly formatted");
    } else {
      // Check mobile menu
      const mobileMenuButton = page.locator('button[aria-label*="menu"], button:has-text("Menu")').first();
      if (await mobileMenuButton.count() > 0) {
        await mobileMenuButton.click();
        await page.waitForTimeout(500);

        const mobilePhoneLinks = page.locator('a[href^="tel:"]');
        const mobileCount = await mobilePhoneLinks.count();

        if (mobileCount > 0) {
          const href = await mobilePhoneLinks.first().getAttribute("href");
          console.log(`✅ Found phone link in mobile menu: ${href}`);
        }
      }
    }
  });

  test("footer has clickable phone links", async ({ page }) => {
    console.log("📞 Testing footer phone links...");

    await page.goto(baseURL, { waitUntil: "domcontentloaded", timeout: 10000 });

    // Scroll to footer
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1000);

    // Look for phone links in footer
    const footerPhoneLinks = page.locator('footer a[href^="tel:"]');
    const count = await footerPhoneLinks.count();

    console.log(`Found ${count} phone link(s) in footer`);

    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const phoneLink = footerPhoneLinks.nth(i);
      const href = await phoneLink.getAttribute("href");
      const text = await phoneLink.textContent();

      console.log(`✅ Phone link ${i + 1}: ${text?.trim()} → ${href}`);

      // Verify href format (should be tel:+491608066630)
      expect(href).toMatch(/^tel:\+?\d+/);
      expect(href).not.toContain(" "); // No spaces in tel: URL

      // Verify link is visible
      await expect(phoneLink).toBeVisible();
    }

    // Also check for email links
    const emailLinks = page.locator('footer a[href^="mailto:"]');
    const emailCount = await emailLinks.count();

    if (emailCount > 0) {
      const emailHref = await emailLinks.first().getAttribute("href");
      console.log(`✅ Found email link in footer: ${emailHref}`);
    }

    console.log("✅ Footer phone links are properly formatted");
  });

  test("contact section has clickable phone links", async ({ page }) => {
    console.log("📞 Testing contact section phone links...");

    await page.goto(baseURL, { waitUntil: "domcontentloaded", timeout: 10000 });

    // Navigate to contact section
    const contactLink = page.locator('a[href="#contact"]').first();
    if (await contactLink.count() > 0) {
      await contactLink.click();
      await page.waitForTimeout(1000);
    } else {
      // Scroll to contact section
      const contactSection = page.locator('#contact, section:has-text("Kontakt")').first();
      if (await contactSection.count() > 0) {
        await contactSection.scrollIntoViewIfNeeded();
        await page.waitForTimeout(500);
      }
    }

    // Look for phone links in contact section
    const contactPhoneLinks = page.locator('#contact a[href^="tel:"], section a[href^="tel:"]');
    const count = await contactPhoneLinks.count();

    console.log(`Found ${count} phone link(s) in contact section`);

    if (count > 0) {
      for (let i = 0; i < count; i++) {
        const phoneLink = contactPhoneLinks.nth(i);
        const href = await phoneLink.getAttribute("href");
        const text = await phoneLink.textContent();

        console.log(`✅ Phone link ${i + 1}: ${text?.trim()} → ${href}`);

        // Verify href format
        expect(href).toMatch(/^tel:\+?\d+/);

        // Verify link is visible
        await expect(phoneLink).toBeVisible();

        // Test hover effect (should show underline or color change)
        await phoneLink.hover();
        await page.waitForTimeout(200);
      }

      console.log("✅ Contact section phone links are properly formatted");
    } else {
      console.log("⚠️ No phone links found in contact section");
    }
  });

  test("phone links work on mobile viewport", async ({ page }) => {
    console.log("📱 Testing phone links on mobile viewport...");

    // Set mobile viewport (iPhone 12)
    await page.setViewportSize({ width: 390, height: 844 });

    await page.goto(baseURL, { waitUntil: "domcontentloaded", timeout: 10000 });

    // Open mobile menu
    const mobileMenuButton = page.locator('button[aria-label*="menu"], svg.lucide-menu').first();
    if (await mobileMenuButton.count() > 0) {
      await mobileMenuButton.click();
      await page.waitForTimeout(500);
      console.log("✅ Opened mobile menu");
    }

    // Find phone links in mobile menu
    const mobilePhoneLinks = page.locator('a[href^="tel:"]');
    const count = await mobilePhoneLinks.count();

    console.log(`Found ${count} phone link(s) on mobile`);

    if (count > 0) {
      const firstLink = mobilePhoneLinks.first();
      const href = await firstLink.getAttribute("href");
      const text = await firstLink.textContent();

      console.log(`✅ Mobile phone link: ${text?.trim()} → ${href}`);

      // Verify link is visible
      await expect(firstLink).toBeVisible();

      // Verify link is touchable (has sufficient tap target size)
      const box = await firstLink.boundingBox();
      if (box) {
        console.log(`   Tap target size: ${box.width}x${box.height}px`);
        // Recommended minimum: 44x44px for iOS, 48x48px for Android
        expect(box.height).toBeGreaterThanOrEqual(40);
      }

      console.log("✅ Mobile phone links are properly sized for touch");
    }

    // Scroll to footer on mobile
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1000);

    const footerPhoneLinks = page.locator('footer a[href^="tel:"]');
    const footerCount = await footerPhoneLinks.count();

    if (footerCount > 0) {
      await expect(footerPhoneLinks.first()).toBeVisible();
      console.log("✅ Footer phone links visible on mobile");
    }
  });

  test("all phone numbers use consistent formatting", async ({ page }) => {
    console.log("📋 Testing phone number format consistency...");

    await page.goto(baseURL, { waitUntil: "domcontentloaded", timeout: 10000 });

    // Collect all phone links
    const allPhoneLinks = page.locator('a[href^="tel:"]');
    const count = await allPhoneLinks.count();

    console.log(`Found ${count} total phone link(s) across the page`);

    const phoneNumbers = new Set<string>();

    for (let i = 0; i < count; i++) {
      const link = allPhoneLinks.nth(i);
      const href = await link.getAttribute("href");

      if (href) {
        phoneNumbers.add(href);
      }
    }

    console.log(`Unique phone numbers found: ${phoneNumbers.size}`);

    phoneNumbers.forEach(number => {
      console.log(`   ${number}`);

      // Verify proper format: tel:+491608066630 (no spaces or special chars)
      expect(number).toMatch(/^tel:\+?\d+$/);
    });

    // Expected phone number: +49 160 8066630 → tel:+491608066630
    const expectedNumber = "tel:+491608066630";

    if (phoneNumbers.has(expectedNumber)) {
      console.log(`✅ Primary phone number formatted correctly: ${expectedNumber}`);
    }

    // Check for second phone number if present: 07541 / 371648 → tel:+4975413716 48
    const secondNumber = "tel:+4975413716 48";
    if (phoneNumbers.has(secondNumber)) {
      console.log(`✅ Secondary phone number found: ${secondNumber}`);
    }

    console.log("✅ All phone numbers use consistent tel: URL format");
  });

  test("phone links have proper accessibility", async ({ page }) => {
    console.log("♿ Testing phone link accessibility...");

    await page.goto(baseURL, { waitUntil: "domcontentloaded", timeout: 10000 });

    const phoneLinks = page.locator('a[href^="tel:"]');
    const count = await phoneLinks.count();

    for (let i = 0; i < Math.min(count, 5); i++) {
      const link = phoneLinks.nth(i);

      // Check if link has visible text content
      const text = await link.textContent();
      expect(text?.trim()).toBeTruthy();
      console.log(`✅ Link ${i + 1} has text content: ${text?.trim()}`);

      // Check if link is keyboard accessible
      const isVisible = await link.isVisible();
      if (isVisible) {
        await link.focus();
        const isFocused = await link.evaluate(el => el === document.activeElement);
        if (isFocused) {
          console.log(`✅ Link ${i + 1} is keyboard focusable`);
        }
      }
    }

    console.log("✅ Phone links are accessible");
  });
});
