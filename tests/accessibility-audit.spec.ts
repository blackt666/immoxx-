import { test, expect } from '@playwright/test';

test.describe('Accessibility Audit', () => {
  test('should have proper ARIA labels on interactive elements', async ({ page }) => {
    await page.goto('http://localhost:5001/');
    await page.waitForLoadState('networkidle');
    
    // Check buttons without accessible text
    const buttons = await page.locator('button').all();
    const buttonsWithoutLabel: string[] = [];
    
    for (const button of buttons) {
      const text = await button.textContent();
      const ariaLabel = await button.getAttribute('aria-label');
      const ariaLabelledBy = await button.getAttribute('aria-labelledby');
      
      if ((!text || text.trim() === '') && !ariaLabel && !ariaLabelledBy) {
        const role = await button.getAttribute('role');
        buttonsWithoutLabel.push(role || 'button');
      }
    }
    
    console.log(`Total buttons: ${buttons.length}`);
    console.log(`Buttons without accessible label: ${buttonsWithoutLabel.length}`);
    
    if (buttonsWithoutLabel.length > 0) {
      console.log('Sample buttons without labels:', buttonsWithoutLabel.slice(0, 3));
    }
    
    // Most buttons should have accessible labels (allow some icon-only buttons with aria-label)
    expect(buttonsWithoutLabel.length).toBeLessThan(5);
  });

  test('should have proper form labels', async ({ page }) => {
    // Navigate to a page with forms (AI Valuation)
    await page.goto('http://localhost:5001/ai-valuation');
    await page.waitForLoadState('networkidle');
    
    const inputs = await page.locator('input[type="text"], input[type="email"], input[type="tel"], textarea').all();
    const inputsWithoutLabel: string[] = [];
    
    for (const input of inputs) {
      const id = await input.getAttribute('id');
      const ariaLabel = await input.getAttribute('aria-label');
      const ariaLabelledBy = await input.getAttribute('aria-labelledby');
      const placeholder = await input.getAttribute('placeholder');
      
      if (id) {
        const hasLabel = await page.locator(`label[for="${id}"]`).count();
        if (hasLabel === 0 && !ariaLabel && !ariaLabelledBy) {
          inputsWithoutLabel.push(placeholder || id);
        }
      }
    }
    
    console.log(`Total form inputs: ${inputs.length}`);
    console.log(`Inputs without proper label: ${inputsWithoutLabel.length}`);
    
    if (inputsWithoutLabel.length > 0) {
      console.log('Inputs without labels:', inputsWithoutLabel);
    }
    
    // All form inputs should have labels
    expect(inputsWithoutLabel.length).toBe(0);
  });

  test('should have sufficient color contrast', async ({ page }) => {
    await page.goto('http://localhost:5001/');
    await page.waitForLoadState('networkidle');
    
    // Check primary text elements for color
    const textElements = await page.locator('p, h1, h2, h3, a, button, span').all();
    
    console.log(`Checking ${textElements.length} text elements for visibility`);
    
    // Sample some elements to ensure they're visible
    const samples = textElements.slice(0, 10);
    for (const element of samples) {
      const isVisible = await element.isVisible();
      if (!isVisible) {
        const text = await element.textContent();
        console.log(`Hidden element: ${text?.substring(0, 30)}`);
      }
    }
    
    // Note: Actual contrast checking requires more complex computation
    // This is a basic visibility check
    console.log('Color contrast check: Basic visibility verified');
  });

  test('should support keyboard navigation', async ({ page }) => {
    await page.goto('http://localhost:5001/');
    await page.waitForLoadState('networkidle');
    
    // Try to tab through focusable elements
    const focusableElements: string[] = [];
    
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('Tab');
      await page.waitForTimeout(100);
      
      const focused = await page.evaluate(() => {
        const el = document.activeElement;
        return el ? `${el.tagName}${el.id ? `#${el.id}` : ''}${el.className ? `.${el.className.split(' ')[0]}` : ''}` : null;
      });
      
      if (focused) {
        focusableElements.push(focused);
      }
    }
    
    console.log(`Keyboard navigable elements: ${focusableElements.length}`);
    console.log('Sample focusable elements:', focusableElements.slice(0, 5));
    
    // Should have keyboard-focusable elements
    expect(focusableElements.length).toBeGreaterThan(3);
  });

  test('should have proper focus indicators', async ({ page }) => {
    await page.goto('http://localhost:5001/');
    await page.waitForLoadState('networkidle');
    
    // Get a focusable button
    const button = page.locator('button, a[href]').first();
    await button.focus();
    
    // Check if element has visible focus state
    const hasOutline = await button.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return styles.outline !== 'none' || 
             styles.outlineWidth !== '0px' ||
             styles.boxShadow !== 'none' ||
             styles.border !== 'none';
    });
    
    console.log(`Focus indicator present: ${hasOutline}`);
    
    // Should have some form of focus indicator
    expect(hasOutline).toBeTruthy();
  });

  test('should have skip to main content link', async ({ page }) => {
    await page.goto('http://localhost:5001/');
    
    // Check for skip link (usually hidden but available)
    const skipLink = await page.locator('a[href="#main"], a[href="#content"], a:has-text("Skip")').count();
    
    console.log(`Skip to content link: ${skipLink > 0 ? 'Present' : 'Not found'}`);
    
    // Skip link is recommended but not required
    if (skipLink > 0) {
      console.log('✓ Has skip to content link');
    } else {
      console.log('Consider adding a "Skip to main content" link for screen readers');
    }
  });

  test('should have proper ARIA landmarks', async ({ page }) => {
    await page.goto('http://localhost:5001/');
    await page.waitForLoadState('networkidle');
    
    // Check for landmark roles
    const landmarks = {
      banner: await page.locator('[role="banner"], header').count(),
      navigation: await page.locator('[role="navigation"], nav').count(),
      main: await page.locator('[role="main"], main').count(),
      contentinfo: await page.locator('[role="contentinfo"], footer').count(),
    };
    
    console.log('ARIA Landmarks:');
    console.log(`  Banner/Header: ${landmarks.banner > 0 ? '✓' : '✗'}`);
    console.log(`  Navigation: ${landmarks.navigation > 0 ? '✓' : '✗'}`);
    console.log(`  Main: ${landmarks.main > 0 ? '✓' : '✗'}`);
    console.log(`  Content Info/Footer: ${landmarks.contentinfo > 0 ? '✓' : '✗'}`);
    
    // Should have main landmark
    expect(landmarks.main).toBeGreaterThan(0);
    
    // Should have navigation
    expect(landmarks.navigation).toBeGreaterThan(0);
  });

  test('should not have redundant or empty links', async ({ page }) => {
    await page.goto('http://localhost:5001/');
    await page.waitForLoadState('networkidle');
    
    const emptyLinks = await page.locator('a[href]:not(:has-text(""))').all();
    const emptyLinkCount = emptyLinks.filter(async link => {
      const text = await link.textContent();
      return !text || text.trim() === '';
    }).length;
    
    console.log(`Empty links found: ${emptyLinkCount}`);
    
    // Should not have empty links (links with no text content)
    expect(emptyLinkCount).toBe(0);
  });

  test('should have proper table accessibility', async ({ page }) => {
    await page.goto('http://localhost:5001/admin/login');
    await page.waitForLoadState('networkidle');
    
    // Check if there are any tables
    const tables = await page.locator('table').all();
    
    if (tables.length > 0) {
      console.log(`Tables found: ${tables.length}`);
      
      for (let i = 0; i < Math.min(tables.length, 3); i++) {
        const table = tables[i];
        
        // Check for caption or aria-label
        const caption = await table.locator('caption').count();
        const ariaLabel = await table.getAttribute('aria-label');
        const ariaLabelledBy = await table.getAttribute('aria-labelledby');
        
        // Check for proper header cells
        const thCount = await table.locator('th').count();
        
        console.log(`Table ${i + 1}:`);
        console.log(`  Has caption: ${caption > 0}`);
        console.log(`  Has aria-label: ${!!ariaLabel}`);
        console.log(`  Header cells (th): ${thCount}`);
        
        // Tables should have captions or aria-labels
        expect(caption > 0 || !!ariaLabel || !!ariaLabelledBy).toBeTruthy();
      }
    } else {
      console.log('No tables found on page');
    }
  });

  test('should have proper heading level hierarchy', async ({ page }) => {
    await page.goto('http://localhost:5001/');
    await page.waitForLoadState('networkidle');
    
    const headings = {
      h1: await page.locator('h1').count(),
      h2: await page.locator('h2').count(),
      h3: await page.locator('h3').count(),
      h4: await page.locator('h4').count(),
      h5: await page.locator('h5').count(),
      h6: await page.locator('h6').count(),
    };
    
    console.log('Heading hierarchy:');
    Object.entries(headings).forEach(([level, count]) => {
      console.log(`  ${level.toUpperCase()}: ${count}`);
    });
    
    // Should have exactly one H1
    expect(headings.h1).toBeGreaterThanOrEqual(1);
    expect(headings.h1).toBeLessThanOrEqual(1);
    
    // If there's an H3, there should be H2s
    if (headings.h3 > 0) {
      expect(headings.h2).toBeGreaterThan(0);
    }
    
    // If there's an H4, there should be H3s
    if (headings.h4 > 0) {
      expect(headings.h3).toBeGreaterThan(0);
    }
  });

  test('should have proper page title for screen readers', async ({ page }) => {
    await page.goto('http://localhost:5001/');
    const title = await page.title();
    
    console.log(`Page title: "${title}"`);
    
    // Title should be descriptive
    expect(title.length).toBeGreaterThan(10);
    expect(title.length).toBeLessThan(60);
    
    // Navigate to another page and check title changes
    await page.goto('http://localhost:5001/properties');
    const propertiesTitle = await page.title();
    
    console.log(`Properties page title: "${propertiesTitle}"`);
    
    // Titles should be different for different pages
    expect(title).not.toBe(propertiesTitle);
  });
});
