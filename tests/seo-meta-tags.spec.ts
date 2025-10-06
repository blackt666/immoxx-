import { test, expect } from '@playwright/test';

test.describe('SEO and Meta Tags', () => {
  test('landing page should have proper meta tags', async ({ page }) => {
    await page.goto('http://localhost:5001/');
    
    // Check title
    const title = await page.title();
    console.log(`Page title: ${title}`);
    expect(title).toBeTruthy();
    expect(title.length).toBeGreaterThan(10);
    expect(title.length).toBeLessThan(60);
    
    // Check meta description
    const description = await page.locator('meta[name="description"]').getAttribute('content');
    console.log(`Meta description: ${description}`);
    if (description) {
      expect(description.length).toBeGreaterThan(50);
      expect(description.length).toBeLessThan(160);
    }
    
    // Check viewport meta tag
    const viewport = await page.locator('meta[name="viewport"]').getAttribute('content');
    expect(viewport).toContain('width=device-width');
    
    // Check charset
    const charset = await page.locator('meta[charset]').count();
    expect(charset).toBeGreaterThan(0);
  });

  test('should have proper Open Graph tags', async ({ page }) => {
    await page.goto('http://localhost:5001/');
    
    // Check for Open Graph tags
    const ogTitle = await page.locator('meta[property="og:title"]').count();
    const ogDescription = await page.locator('meta[property="og:description"]').count();
    const ogType = await page.locator('meta[property="og:type"]').count();
    
    console.log(`OG Title: ${ogTitle > 0 ? 'Present' : 'Missing'}`);
    console.log(`OG Description: ${ogDescription > 0 ? 'Present' : 'Missing'}`);
    console.log(`OG Type: ${ogType > 0 ? 'Present' : 'Missing'}`);
    
    // Open Graph tags are optional but recommended
    // This test just logs the presence
  });

  test('should have proper heading structure', async ({ page }) => {
    await page.goto('http://localhost:5001/');
    await page.waitForLoadState('networkidle');
    
    // Check for H1 - should have exactly one
    const h1Count = await page.locator('h1').count();
    console.log(`H1 tags: ${h1Count}`);
    expect(h1Count).toBeGreaterThanOrEqual(1);
    
    // Check H1 content
    if (h1Count > 0) {
      const h1Text = await page.locator('h1').first().textContent();
      console.log(`H1 content: ${h1Text}`);
      expect(h1Text?.length).toBeGreaterThan(10);
    }
    
    // Check for heading hierarchy
    const h2Count = await page.locator('h2').count();
    const h3Count = await page.locator('h3').count();
    console.log(`H2 tags: ${h2Count}, H3 tags: ${h3Count}`);
  });

  test('all images should have alt attributes', async ({ page }) => {
    await page.goto('http://localhost:5001/');
    await page.waitForLoadState('networkidle');
    
    const images = await page.locator('img').all();
    const imagesWithoutAlt: string[] = [];
    
    for (const img of images) {
      const alt = await img.getAttribute('alt');
      const src = await img.getAttribute('src');
      if (alt === null || alt === '') {
        imagesWithoutAlt.push(src || 'unknown');
      }
    }
    
    console.log(`Total images: ${images.length}`);
    console.log(`Images without alt: ${imagesWithoutAlt.length}`);
    
    if (imagesWithoutAlt.length > 0) {
      console.log('Images missing alt text:', imagesWithoutAlt.slice(0, 5));
    }
    
    // All images should have alt attributes for accessibility
    expect(imagesWithoutAlt.length).toBe(0);
  });

  test('should have proper semantic HTML structure', async ({ page }) => {
    await page.goto('http://localhost:5001/');
    await page.waitForLoadState('networkidle');
    
    // Check for semantic HTML5 elements
    const hasHeader = await page.locator('header').count();
    const hasMain = await page.locator('main').count();
    const hasFooter = await page.locator('footer').count();
    const hasNav = await page.locator('nav').count();
    
    console.log('Semantic HTML elements:');
    console.log(`  <header>: ${hasHeader > 0 ? '✓' : '✗'}`);
    console.log(`  <main>: ${hasMain > 0 ? '✓' : '✗'}`);
    console.log(`  <footer>: ${hasFooter > 0 ? '✓' : '✗'}`);
    console.log(`  <nav>: ${hasNav > 0 ? '✓' : '✗'}`);
    
    // Should use semantic HTML
    expect(hasHeader).toBeGreaterThan(0);
    expect(hasNav).toBeGreaterThan(0);
  });

  test('links should have descriptive text', async ({ page }) => {
    await page.goto('http://localhost:5001/');
    await page.waitForLoadState('networkidle');
    
    const links = await page.locator('a[href]').all();
    const vagueLinkTexts = ['click here', 'here', 'more', 'read more'];
    const vagueLinks: string[] = [];
    
    for (const link of links) {
      const text = (await link.textContent())?.trim().toLowerCase() || '';
      if (vagueLinkTexts.includes(text)) {
        const href = await link.getAttribute('href');
        vagueLinks.push(`"${text}" (${href})`);
      }
    }
    
    console.log(`Total links: ${links.length}`);
    console.log(`Links with vague text: ${vagueLinks.length}`);
    
    if (vagueLinks.length > 0) {
      console.log('Vague links found:', vagueLinks.slice(0, 3));
    }
    
    // Ideally no vague link texts for better accessibility
    // This is a soft check - log but don't fail
  });

  test('should have proper language attribute', async ({ page }) => {
    await page.goto('http://localhost:5001/');
    
    const htmlLang = await page.locator('html').getAttribute('lang');
    console.log(`HTML lang attribute: ${htmlLang}`);
    
    // Should have a language attribute
    expect(htmlLang).toBeTruthy();
    
    // For German site, should be 'de' or 'de-DE'
    if (htmlLang) {
      expect(htmlLang.toLowerCase()).toContain('de');
    }
  });

  test('property pages should have structured data', async ({ page }) => {
    // Navigate to properties page first
    await page.goto('http://localhost:5001/properties');
    await page.waitForLoadState('networkidle');
    
    // Check if there are any property links
    const propertyLinks = await page.locator('a[href*="/properties/"]').all();
    
    if (propertyLinks.length > 0) {
      // Navigate to first property
      await propertyLinks[0].click();
      await page.waitForLoadState('networkidle');
      
      // Check for structured data (JSON-LD)
      const structuredData = await page.locator('script[type="application/ld+json"]').count();
      console.log(`Structured data scripts: ${structuredData}`);
      
      // Structured data is optional but recommended for SEO
      if (structuredData > 0) {
        const jsonLd = await page.locator('script[type="application/ld+json"]').first().textContent();
        console.log('Has structured data for property');
        
        if (jsonLd) {
          const data = JSON.parse(jsonLd);
          console.log(`Schema type: ${data['@type']}`);
        }
      }
    } else {
      console.log('No properties found to test');
    }
  });

  test('should have canonical URL', async ({ page }) => {
    await page.goto('http://localhost:5001/');
    
    const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
    console.log(`Canonical URL: ${canonical || 'Not set'}`);
    
    // Canonical URL is optional but recommended
    if (canonical) {
      expect(canonical).toMatch(/^https?:\/\//);
    }
  });

  test('should have robots meta tag', async ({ page }) => {
    await page.goto('http://localhost:5001/');
    
    const robots = await page.locator('meta[name="robots"]').getAttribute('content');
    console.log(`Robots meta: ${robots || 'Not set (defaults to index, follow)'}`);
    
    // Check admin pages should have noindex
    await page.goto('http://localhost:5001/admin/login');
    const adminRobots = await page.locator('meta[name="robots"]').getAttribute('content');
    console.log(`Admin robots meta: ${adminRobots || 'Not set'}`);
    
    // Admin pages should ideally have noindex
    if (adminRobots) {
      expect(adminRobots.toLowerCase()).toContain('noindex');
    }
  });
});
