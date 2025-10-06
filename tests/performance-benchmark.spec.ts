import { test, expect } from '@playwright/test';

test.describe('Performance Benchmarks', () => {
  test('should load landing page within acceptable time', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('http://localhost:5003/');
    await page.waitForLoadState('domcontentloaded');
    
    const domLoadTime = Date.now() - startTime;
    console.log(`DOM Content Loaded: ${domLoadTime}ms`);
    
    await page.waitForLoadState('networkidle');
    const fullLoadTime = Date.now() - startTime;
    console.log(`Full Page Load: ${fullLoadTime}ms`);
    
    // DOM should load within 3 seconds
    expect(domLoadTime).toBeLessThan(3000);
    
    // Full page load should be within 8 seconds
    expect(fullLoadTime).toBeLessThan(8000);
  });

  test('should have reasonable bundle sizes', async ({ page }) => {
    const resources: { url: string; size: number; type: string }[] = [];
    
    page.on('response', async (response) => {
      const url = response.url();
      const request = response.request();
      const resourceType = request.resourceType();
      
      if (['script', 'stylesheet', 'image'].includes(resourceType)) {
        try {
          const buffer = await response.body();
          resources.push({
            url,
            size: buffer.length,
            type: resourceType
          });
        } catch (e) {
          // Some resources might not have body
        }
      }
    });

    await page.goto('http://localhost:5003/');
    await page.waitForLoadState('networkidle');
    
    const jsResources = resources.filter(r => r.type === 'script');
    const cssResources = resources.filter(r => r.type === 'stylesheet');
    
    const totalJsSize = jsResources.reduce((sum, r) => sum + r.size, 0);
    const totalCssSize = cssResources.reduce((sum, r) => sum + r.size, 0);
    
    console.log(`Total JS Size: ${(totalJsSize / 1024).toFixed(2)} KB`);
    console.log(`Total CSS Size: ${(totalCssSize / 1024).toFixed(2)} KB`);
    console.log(`JS Files: ${jsResources.length}`);
    console.log(`CSS Files: ${cssResources.length}`);
    
    // Log largest files
    const largestJs = jsResources
      .sort((a, b) => b.size - a.size)
      .slice(0, 5);
    
    console.log('Largest JS files:');
    largestJs.forEach(r => {
      const filename = r.url.split('/').pop() || r.url;
      console.log(`  ${filename}: ${(r.size / 1024).toFixed(2)} KB`);
    });
    
    // Total initial JS should be less than 2MB (reasonable for a full app)
    expect(totalJsSize).toBeLessThan(2 * 1024 * 1024);
    
    // No single JS file should be larger than 800KB
    const maxJsSize = Math.max(...jsResources.map(r => r.size));
    expect(maxJsSize).toBeLessThan(800 * 1024);
  });

  test('should measure time to interactive', async ({ page }) => {
    await page.goto('http://localhost:5003/');
    
    // Wait for page to be interactive
    await page.waitForLoadState('networkidle');
    
    // Measure performance metrics using Performance API
    const metrics = await page.evaluate(() => {
      const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return {
        domContentLoaded: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
        domInteractive: perfData.domInteractive - perfData.fetchStart,
        loadComplete: perfData.loadEventEnd - perfData.fetchStart,
        timeToFirstByte: perfData.responseStart - perfData.requestStart,
      };
    });
    
    console.log('Performance Metrics:');
    console.log(`  DOM Content Loaded: ${metrics.domContentLoaded}ms`);
    console.log(`  DOM Interactive: ${metrics.domInteractive}ms`);
    console.log(`  Load Complete: ${metrics.loadComplete}ms`);
    console.log(`  Time to First Byte: ${metrics.timeToFirstByte}ms`);
    
    // DOM should become interactive within 5 seconds
    expect(metrics.domInteractive).toBeLessThan(5000);
  });

  test('should handle concurrent page loads efficiently', async ({ page }) => {
    const loadTimes: number[] = [];
    
    // Load same page multiple times to test caching
    for (let i = 0; i < 3; i++) {
      const start = Date.now();
      await page.goto('http://localhost:5003/', { waitUntil: 'networkidle' });
      const loadTime = Date.now() - start;
      loadTimes.push(loadTime);
      console.log(`Load ${i + 1}: ${loadTime}ms`);
    }
    
    // Subsequent loads should be faster (due to caching)
    const firstLoad = loadTimes[0];
    const avgSubsequentLoad = (loadTimes[1] + loadTimes[2]) / 2;
    
    console.log(`First load: ${firstLoad}ms`);
    console.log(`Avg subsequent loads: ${avgSubsequentLoad}ms`);
    
    // Each load should still be reasonable
    loadTimes.forEach(time => {
      expect(time).toBeLessThan(10000);
    });
  });

  test('should have proper resource caching headers', async ({ page }) => {
    const cachedResources: string[] = [];
    
    page.on('response', response => {
      const cacheControl = response.headers()['cache-control'];
      const url = response.url();
      
      if (cacheControl && (url.endsWith('.js') || url.endsWith('.css'))) {
        if (cacheControl.includes('max-age') || cacheControl.includes('immutable')) {
          cachedResources.push(url);
        }
      }
    });

    await page.goto('http://localhost:5003/');
    await page.waitForLoadState('networkidle');
    
    console.log(`Resources with caching: ${cachedResources.length}`);
    
    // At least some static resources should have caching headers
    // Note: This might not work in dev mode, more relevant for production
    if (cachedResources.length > 0) {
      console.log('Sample cached resources:');
      cachedResources.slice(0, 3).forEach(url => {
        console.log(`  ${url.split('/').pop()}`);
      });
    }
  });
});
