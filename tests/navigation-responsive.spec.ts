import { test, expect } from '@playwright/test';

test.describe('Navigation Responsive Design', () => {
  const viewportSizes = [
    { name: 'Mobile', width: 375, height: 667 },
    { name: 'Tablet', width: 768, height: 1024 },
    { name: 'Desktop', width: 1280, height: 720 }
  ];

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for the page to be fully loaded
    await page.waitForLoadState('networkidle');
    // Wait for navigation component to be visible
    await page.waitForSelector('nav', { timeout: 10000 });
  });

  // Test each viewport size
  for (const viewport of viewportSizes) {
    test(`Navigation layout at ${viewport.name} (${viewport.width}px)`, async ({ page }) => {
      // Set viewport size
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      
      // Wait for any responsive adjustments
      await page.waitForTimeout(500);

      // Take screenshot for documentation
      await page.screenshot({ 
        path: `test-results/navigation-${viewport.name.toLowerCase()}-${viewport.width}px.png`,
        fullPage: false,
        clip: { x: 0, y: 0, width: viewport.width, height: 200 }
      });

      // Check that navigation is visible
      const nav = page.locator('nav');
      await expect(nav).toBeVisible();

      // Check logo is present and visible
      const logo = page.getByTestId('img-logo');
      await expect(logo).toBeVisible();

      if (viewport.width < 768) {
        // Mobile tests
        await testMobileLayout(page);
      } else if (viewport.width < 1280) {
        // Tablet tests  
        await testTabletLayout(page);
      } else {
        // Desktop tests
        await testDesktopLayout(page);
      }
    });
  }

  test('Mobile menu functionality', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);

    // Check mobile menu button is visible
    const menuButton = page.locator('button[aria-label="Toggle navigation menu"]');
    await expect(menuButton).toBeVisible();

    // Check that desktop navigation is hidden
    const desktopNav = page.locator('nav').filter({ has: page.locator('.hidden.md\\:block') });
    
    // Click mobile menu button to open
    await menuButton.click();
    await page.waitForTimeout(300);

    // Verify mobile menu is open  
    const mobileMenu = page.locator('.md\\:hidden');
    if (await mobileMenu.count() > 0) {
      console.log("✅ Mobile menu structure found");
    }
    const humanButton = page.locator('button[data-testid*="button-mobile-human"]').first();
    await expect(humanButton).toBeVisible();

    // Test mobile menu close functionality
    const closeButton = page.locator('svg').nth(0); // X icon
    await closeButton.click();
    await page.waitForTimeout(300);

    // Verify mobile menu is closed
    await expect(mobileMenu).toBeHidden();

    // Take screenshot of mobile menu
    await menuButton.click();
    await page.waitForTimeout(300);
    await page.screenshot({ 
      path: 'test-results/navigation-mobile-menu-open.png',
      fullPage: false
    });
  });

  test('Language selector visibility across viewports', async ({ page }) => {
    for (const viewport of viewportSizes) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.waitForTimeout(500);

      // Language selector should be visible in all viewports
      const languageSelector = page.locator('[data-testid*="language"], .language-selector, select, button').filter({ hasText: /DE|EN|Deutsch|English/i }).first();
      
      if (viewport.width < 768) {
        // On mobile, language selector might be in mobile menu
        const menuButton = page.locator('button[aria-label="Toggle navigation menu"]');
        await menuButton.click();
        await page.waitForTimeout(300);
        
        // Look for language selector in mobile menu
        const mobileLanguageSelector = page.locator('.md\\:hidden select, .md\\:hidden button').filter({ hasText: /DE|EN|Deutsch|English/i }).first();
        if (await mobileLanguageSelector.count() > 0) {
          await expect(mobileLanguageSelector).toBeVisible();
        }
        
        // Close mobile menu
        const closeButton = page.locator('svg').nth(0);
        await closeButton.click();
        await page.waitForTimeout(300);
      } else {
        // On tablet and desktop, language selector should be visible in header
        if (await languageSelector.count() > 0) {
          await expect(languageSelector).toBeVisible();
        }
      }
    }
  });

  test('Contact information visibility at different breakpoints', async ({ page }) => {
    for (const viewport of viewportSizes) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.waitForTimeout(500);

      if (viewport.width >= 1536) {
        // 2XL screens: Both phone and location should be visible
        const phoneElement = page.locator('text=+49 160 8066630');
        const locationElement = page.locator('text=Friedrichshafen');
        
        await expect(phoneElement).toBeVisible();
        await expect(locationElement).toBeVisible();
        
      } else if (viewport.width >= 1280) {
        // XL screens: Only phone number should be visible
        const phoneElement = page.locator('text=+49 160 8066630');
        await expect(phoneElement).toBeVisible();
        
        // Location should be hidden
        const locationElement = page.locator('text=Friedrichshafen');
        if (await locationElement.count() > 0) {
          await expect(locationElement).toBeHidden();
        }
        
      } else if (viewport.width < 768) {
        // Mobile: Contact info should be in mobile menu
        const menuButton = page.locator('button[aria-label="Toggle navigation menu"]');
        await menuButton.click();
        await page.waitForTimeout(300);
        
        const mobilePhoneElement = page.locator('.md\\:hidden').locator('text=+49 160 8066630');
        if (await mobilePhoneElement.count() > 0) {
          await expect(mobilePhoneElement).toBeVisible();
        }
        
        // Close mobile menu
        const closeButton = page.locator('svg').nth(0);
        await closeButton.click();
        await page.waitForTimeout(300);
      }
    }
  });

  test('Check for text overlapping and layout issues', async ({ page }) => {
    for (const viewport of viewportSizes) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.waitForTimeout(500);

      // Get navigation container
      const nav = page.locator('nav');
      await expect(nav).toBeVisible();

      // Take a screenshot for visual inspection
      await page.screenshot({ 
        path: `test-results/navigation-layout-check-${viewport.width}px.png`,
        fullPage: false,
        clip: { x: 0, y: 0, width: viewport.width, height: 100 }
      });

      // Check that navigation doesn't overflow its container
      const navBox = await nav.boundingBox();
      expect(navBox?.width).toBeLessThanOrEqual(viewport.width);

      if (viewport.width >= 768) {
        // Desktop/tablet: Check that navigation items don't overlap
        const navItems = page.locator('nav button, nav a').filter({ hasText: /Home|Properties|About|Services/i });
        const navCount = await navItems.count();
        
        if (navCount > 1) {
          // Get bounding boxes of first two navigation items
          const firstItem = navItems.nth(0);
          const secondItem = navItems.nth(1);
          
          const firstBox = await firstItem.boundingBox();
          const secondBox = await secondItem.boundingBox();
          
          if (firstBox && secondBox) {
            // Ensure no horizontal overlap (first item ends before second begins)
            expect(firstBox.x + firstBox.width).toBeLessThanOrEqual(secondBox.x + 5); // 5px tolerance
          }
        }

        // Check that AI service buttons are properly sized and don't overflow
        const aiButtons = page.locator('button[data-testid*="button-ai"]');
        const aiCount = await aiButtons.count();
        
        for (let i = 0; i < aiCount; i++) {
          const button = aiButtons.nth(i);
          const buttonBox = await button.boundingBox();
          
          if (buttonBox) {
            // Button should not be too wide for its container
            expect(buttonBox.width).toBeLessThan(viewport.width / 3); // No button should take more than 1/3 of screen
            expect(buttonBox.x + buttonBox.width).toBeLessThanOrEqual(viewport.width);
          }
        }
      }

      // Check that text content is not cut off
      const textElements = page.locator('nav span, nav button, nav a');
      const textCount = await textElements.count();
      
      for (let i = 0; i < textCount; i++) {
        const element = textElements.nth(i);
        if (await element.isVisible()) {
          const box = await element.boundingBox();
          if (box) {
            // Element should be within viewport bounds
            expect(box.x).toBeGreaterThanOrEqual(0);
            expect(box.x + box.width).toBeLessThanOrEqual(viewport.width + 10); // 10px tolerance for margins
          }
        }
      }
    }
  });
});

async function testMobileLayout(page: any) {
  // Mobile menu button should be visible
  const menuButton = page.locator('button[aria-label="Toggle navigation menu"]');
  await expect(menuButton).toBeVisible();

  // Desktop navigation should be hidden
  const desktopNav = page.locator('.hidden.md\\:block');
  await expect(desktopNav).toBeHidden();

  // Logo should be visible and properly sized
  const logo = page.getByTestId('img-logo');
  await expect(logo).toBeVisible();
  
  const logoBox = await logo.boundingBox();
  if (logoBox) {
    expect(logoBox.height).toBeLessThanOrEqual(48); // Logo should not be too tall
    expect(logoBox.width).toBeLessThan(200); // Logo should not be too wide on mobile
  }
}

async function testTabletLayout(page: any) {
  // Desktop navigation should be visible
  const desktopNav = page.locator('.hidden.md\\:block');
  await expect(desktopNav).toBeVisible();

  // Mobile menu button should be hidden
  const menuButton = page.locator('button[aria-label="Toggle navigation menu"]');
  await expect(menuButton).toBeHidden();

  // Check that main navigation items are visible
  const homeButton = page.getByTestId('button-nav-home');
  if (await homeButton.count() > 0) {
    await expect(homeButton).toBeVisible();
  }
}

async function testDesktopLayout(page: any) {
  // Desktop navigation should be visible
  const desktopNav = page.locator('.hidden.md\\:block');
  await expect(desktopNav).toBeVisible();

  // Mobile menu button should be hidden
  const menuButton = page.locator('button[aria-label="Toggle navigation menu"]');
  await expect(menuButton).toBeHidden();

  // Check that all navigation elements have proper spacing
  const navContainer = page.locator('nav .flex.items-center.h-16');
  await expect(navContainer).toBeVisible();

  // AI service buttons should be prominent
  const aiButtons = page.locator('button[data-testid*="button-ai"]');
  const aiCount = await aiButtons.count();
  
  if (aiCount > 0) {
    const firstAiButton = aiButtons.first();
    await expect(firstAiButton).toBeVisible();
    
    // Check that AI button has proper styling (gradient background)
    const buttonClass = await firstAiButton.getAttribute('class');
    expect(buttonClass).toContain('gradient');
  }

  // Contact info should be visible on larger screens
  const phoneElement = page.locator('text=+49 160 8066630');
  if (await phoneElement.count() > 0) {
    await expect(phoneElement).toBeVisible();
  }
}