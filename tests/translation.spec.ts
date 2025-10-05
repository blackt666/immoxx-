import { test, expect } from "@playwright/test";

// Translation test data for verification
const translationTests = {
  de: {
    // Navigation
    "nav.home": "Startseite",
    "nav.properties": "Immobilien", 
    "nav.contact": "Kontakt",
    
    // Hero Section
    "hero.title": "Ihr Immobilienexperte am Bodensee",
    "hero.subtitle": "Mit über 20 Jahren Erfahrung begleiten wir Sie professionell beim Kauf und Verkauf Ihrer Traumimmobilie am Bodensee.",
    
    // Services
    "services.title": "Unsere Leistungen",
    "services.valuation.title": "Immobilienbewertung",
    "services.selling.title": "Immobilienverkauf",
    "services.search.title": "Immobiliensuche",
    
    // About
    "about.name": "Manfred Müller",
    "about.experience": "Jahre Erfahrung",
    "about.contact.title": "Direkter Kontakt",
    "about.contact.appointment": "Termin vereinbaren",
    
    // Contact
    "contact.title": "Kontaktieren Sie uns",
    "contact.form.name": "Name *",
    "contact.form.email": "E-Mail *",
    "contact.form.submit": "Nachricht senden",
    "contact.info.phone": "Telefon",
    "contact.info.email": "E-Mail",
    "contact.info.address": "Adresse",
  },
  en: {
    // Navigation
    "nav.home": "Home",
    "nav.properties": "Properties",
    "nav.contact": "Contact",
    
    // Hero Section
    "hero.title": "Your Real Estate Expert at Lake Constance",
    "hero.subtitle": "With over 20 years of experience, we professionally guide you through buying and selling your dream property at Lake Constance.",
    
    // Services
    "services.title": "Our Services",
    "services.valuation.title": "Property Valuation",
    "services.selling.title": "Property Sales",
    "services.search.title": "Property Search",
    
    // About
    "about.name": "Manfred Müller",
    "about.experience": "Years Experience",
    "about.contact.title": "Direct Contact",
    "about.contact.appointment": "Schedule Appointment",
    
    // Contact
    "contact.title": "Contact Us",
    "contact.form.name": "Name *",
    "contact.form.email": "Email *",
    "contact.form.submit": "Send Message",
    "contact.info.phone": "Phone",
    "contact.info.email": "Email",
    "contact.info.address": "Address",
  }
};

test.describe("Multilingual Translation System", () => {
  const baseURL = process.env.BASE_URL || `http://localhost:${process.env.PORT || 5000}`;

  test.beforeEach(async ({ page }) => {
    await page.goto(baseURL, { waitUntil: "domcontentloaded", timeout: 15000 });
    // Wait for the app to fully load
    await page.waitForLoadState("networkidle", { timeout: 10000 });
  });

  test("Default language (German) loads correctly", async ({ page }) => {
    console.log("🇩🇪 Testing default German language...");
    
    // Check that German flag is visible in language selector
    const languageSelector = page.locator('[data-testid="language-selector"]');
    await expect(languageSelector).toBeVisible();
    
    const germanFlag = page.locator('[data-testid="button-language-selector"]:has-text("🇩🇪")');
    await expect(germanFlag).toBeVisible();
    
    // Verify German content in key sections
    await expect(page.locator("text=" + translationTests.de["hero.title"])).toBeVisible();
    await expect(page.locator("text=" + translationTests.de["services.title"])).toBeVisible();
    await expect(page.locator("text=" + translationTests.de["contact.title"])).toBeVisible();
    
    console.log("✅ German default language verification passed");
  });

  test("Language switching to English works correctly", async ({ page }) => {
    console.log("🔄 Testing language switching to English...");
    
    // First verify we're in German
    await expect(page.locator("text=" + translationTests.de["hero.title"])).toBeVisible();
    
    // Click language selector
    const languageSelector = page.locator('[data-testid="button-language-selector"]');
    await languageSelector.click();
    
    // Select English
    const englishOption = page.locator('[data-testid="menu-item-en"]');
    await expect(englishOption).toBeVisible();
    await englishOption.click();
    
    // Wait for translation to apply
    await page.waitForTimeout(1000);
    
    // Verify English content
    await expect(page.locator("text=" + translationTests.en["hero.title"])).toBeVisible();
    await expect(page.locator("text=" + translationTests.en["services.title"])).toBeVisible();
    await expect(page.locator("text=" + translationTests.en["contact.title"])).toBeVisible();
    
    // Verify English flag is now shown
    const englishFlag = page.locator('[data-testid="button-language-selector"]:has-text("🇬🇧")');
    await expect(englishFlag).toBeVisible();
    
    console.log("✅ English language switching verification passed");
  });

  test("Services section translations work correctly", async ({ page }) => {
    console.log("🔧 Testing Services section translations...");
    
    // Test German services
    await expect(page.locator("text=" + translationTests.de["services.valuation.title"])).toBeVisible();
    await expect(page.locator("text=" + translationTests.de["services.selling.title"])).toBeVisible();
    await expect(page.locator("text=" + translationTests.de["services.search.title"])).toBeVisible();
    
    // Switch to English
    await page.locator('[data-testid="button-language-selector"]').click();
    await page.locator('[data-testid="menu-item-en"]').click();
    await page.waitForTimeout(1000);
    
    // Test English services
    await expect(page.locator("text=" + translationTests.en["services.valuation.title"])).toBeVisible();
    await expect(page.locator("text=" + translationTests.en["services.selling.title"])).toBeVisible();
    await expect(page.locator("text=" + translationTests.en["services.search.title"])).toBeVisible();
    
    console.log("✅ Services section translation verification passed");
  });

  test("About section translations work correctly", async ({ page }) => {
    console.log("👤 Testing About section translations...");
    
    // Scroll to about section
    await page.locator("#about-section").scrollIntoViewIfNeeded();
    
    // Test German about section
    await expect(page.locator("text=" + translationTests.de["about.name"])).toBeVisible();
    await expect(page.locator("text=" + translationTests.de["about.experience"])).toBeVisible();
    await expect(page.locator("text=" + translationTests.de["about.contact.title"])).toBeVisible();
    
    // Switch to English
    await page.locator('[data-testid="button-language-selector"]').click();
    await page.locator('[data-testid="menu-item-en"]').click();
    await page.waitForTimeout(1000);
    
    // Test English about section
    await expect(page.locator("text=" + translationTests.en["about.experience"])).toBeVisible();
    await expect(page.locator("text=" + translationTests.en["about.contact.title"])).toBeVisible();
    await expect(page.locator("text=" + translationTests.en["about.contact.appointment"])).toBeVisible();
    
    console.log("✅ About section translation verification passed");
  });

  test("Contact section translations work correctly", async ({ page }) => {
    console.log("📞 Testing Contact section translations...");
    
    // Scroll to contact section
    await page.locator("#contact").scrollIntoViewIfNeeded();
    
    // Test German contact section
    await expect(page.locator("text=" + translationTests.de["contact.title"])).toBeVisible();
    await expect(page.locator("text=" + translationTests.de["contact.info.phone"])).toBeVisible();
    await expect(page.locator("text=" + translationTests.de["contact.info.email"])).toBeVisible();
    await expect(page.locator("text=" + translationTests.de["contact.info.address"])).toBeVisible();
    
    // Switch to English
    await page.locator('[data-testid="button-language-selector"]').click();
    await page.locator('[data-testid="menu-item-en"]').click();
    await page.waitForTimeout(1000);
    
    // Test English contact section
    await expect(page.locator("text=" + translationTests.en["contact.title"])).toBeVisible();
    await expect(page.locator("text=" + translationTests.en["contact.info.phone"])).toBeVisible();
    await expect(page.locator("text=" + translationTests.en["contact.info.email"])).toBeVisible();
    await expect(page.locator("text=" + translationTests.en["contact.info.address"])).toBeVisible();
    
    console.log("✅ Contact section translation verification passed");
  });

  test("Contact form translations work correctly", async ({ page }) => {
    console.log("📝 Testing Contact form translations...");
    
    // Scroll to contact section
    await page.locator("#contact").scrollIntoViewIfNeeded();
    
    // Test German form labels
    await expect(page.locator('label:has-text("' + translationTests.de["contact.form.name"] + '")')).toBeVisible();
    await expect(page.locator('label:has-text("' + translationTests.de["contact.form.email"] + '")')).toBeVisible();
    
    // Check for submit button in German
    await expect(page.locator('button:has-text("' + translationTests.de["contact.form.submit"] + '")')).toBeVisible();
    
    // Switch to English
    await page.locator('[data-testid="button-language-selector"]').click();
    await page.locator('[data-testid="menu-item-en"]').click();
    await page.waitForTimeout(1000);
    
    // Test English form labels
    await expect(page.locator('label:has-text("' + translationTests.en["contact.form.name"] + '")')).toBeVisible();
    await expect(page.locator('label:has-text("' + translationTests.en["contact.form.email"] + '")')).toBeVisible();
    
    // Check for submit button in English
    await expect(page.locator('button:has-text("' + translationTests.en["contact.form.submit"] + '")')).toBeVisible();
    
    console.log("✅ Contact form translation verification passed");
  });

  test("Phone and email links work correctly in both languages", async ({ page }) => {
    console.log("🔗 Testing contact links functionality...");
    
    // Scroll to contact section
    await page.locator("#contact").scrollIntoViewIfNeeded();
    
    // Test German language links
    console.log("Testing German contact links...");
    
    // Check for phone links (tel:)
    const phoneLinks = page.locator('a[href^="tel:"]');
    const phoneCount = await phoneLinks.count();
    expect(phoneCount).toBeGreaterThan(0);
    
    // Check for email links (mailto:)
    const emailLinks = page.locator('a[href^="mailto:"]');
    const emailCount = await emailLinks.count();
    expect(emailCount).toBeGreaterThan(0);
    
    // Verify phone link format
    const firstPhoneLink = phoneLinks.first();
    const phoneHref = await firstPhoneLink.getAttribute("href");
    expect(phoneHref).toMatch(/^tel:\+?[\d\s-]+$/);
    
    // Verify email link format
    const firstEmailLink = emailLinks.first();
    const emailHref = await firstEmailLink.getAttribute("href");
    expect(emailHref).toMatch(/^mailto:.+@.+\..+$/);
    
    console.log(`Found ${phoneCount} phone links and ${emailCount} email links`);
    
    // Switch to English and verify links still work
    await page.locator('[data-testid="button-language-selector"]').click();
    await page.locator('[data-testid="menu-item-en"]').click();
    await page.waitForTimeout(1000);
    
    console.log("Testing English contact links...");
    
    // Re-check links after language switch
    const phoneLinksEn = page.locator('a[href^="tel:"]');
    const emailLinksEn = page.locator('a[href^="mailto:"]');
    
    expect(await phoneLinksEn.count()).toBeGreaterThan(0);
    expect(await emailLinksEn.count()).toBeGreaterThan(0);
    
    // Verify links are still properly formatted
    const phoneHrefEn = await phoneLinksEn.first().getAttribute("href");
    const emailHrefEn = await emailLinksEn.first().getAttribute("href");
    
    expect(phoneHrefEn).toMatch(/^tel:\+?[\d\s-]+$/);
    expect(emailHrefEn).toMatch(/^mailto:.+@.+\..+$/);
    
    console.log("✅ Contact links functionality verification passed");
  });

  test("Language preference persists after page reload", async ({ page }) => {
    console.log("💾 Testing language persistence...");
    
    // Switch to English
    await page.locator('[data-testid="button-language-selector"]').click();
    await page.locator('[data-testid="menu-item-en"]').click();
    await page.waitForTimeout(1000);
    
    // Verify English is active
    await expect(page.locator("text=" + translationTests.en["hero.title"])).toBeVisible();
    
    // Reload the page
    await page.reload({ waitUntil: "networkidle" });
    
    // Check if English is still active after reload
    await expect(page.locator("text=" + translationTests.en["hero.title"])).toBeVisible();
    const englishFlag = page.locator('[data-testid="button-language-selector"]:has-text("🇬🇧")');
    await expect(englishFlag).toBeVisible();
    
    console.log("✅ Language persistence verification passed");
  });

  test("All section content switches correctly between languages", async ({ page }) => {
    console.log("🌐 Testing complete content switching...");
    
    // Create a list of content to verify
    const contentChecks = [
      { section: "hero", de: translationTests.de["hero.title"], en: translationTests.en["hero.title"] },
      { section: "services", de: translationTests.de["services.title"], en: translationTests.en["services.title"] },
      { section: "contact", de: translationTests.de["contact.title"], en: translationTests.en["contact.title"] },
    ];
    
    // Verify German content
    for (const check of contentChecks) {
      await expect(page.locator(`text=${check.de}`)).toBeVisible();
      console.log(`✓ German ${check.section} content verified`);
    }
    
    // Switch to English
    await page.locator('[data-testid="button-language-selector"]').click();
    await page.locator('[data-testid="menu-item-en"]').click();
    await page.waitForTimeout(1500);
    
    // Verify English content
    for (const check of contentChecks) {
      await expect(page.locator(`text=${check.en}`)).toBeVisible();
      console.log(`✓ English ${check.section} content verified`);
    }
    
    // Switch back to German to verify bidirectional switching
    await page.locator('[data-testid="button-language-selector"]').click();
    await page.locator('[data-testid="menu-item-de"]').click();
    await page.waitForTimeout(1500);
    
    // Verify German content again
    for (const check of contentChecks) {
      await expect(page.locator(`text=${check.de}`)).toBeVisible();
      console.log(`✓ German ${check.section} content re-verified`);
    }
    
    console.log("✅ Complete content switching verification passed");
  });
});