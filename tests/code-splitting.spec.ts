import { test, expect } from '@playwright/test';

test.describe('Code Splitting Validation', () => {
  test('should lazy load admin pages', async ({ page }) => {
    // Track network requests
    const jsRequests: string[] = [];
    
    page.on('response', response => {
      if (response.url().endsWith('.js')) {
        jsRequests.push(response.url());
      }
    });

    // Load the landing page
    await page.goto('http://localhost:5003/');
    await page.waitForLoadState('networkidle');
    
    const initialJsFiles = jsRequests.length;
    console.log(`Initial JS files loaded: ${initialJsFiles}`);
    
    // Navigate to admin login (should load additional chunks)
    await page.goto('http://localhost:5003/admin/login');
    await page.waitForLoadState('networkidle');
    
    const afterAdminJsFiles = jsRequests.length;
    console.log(`JS files after admin navigation: ${afterAdminJsFiles}`);
    
    // Verify that more JS files were loaded (indicating lazy loading)
    expect(afterAdminJsFiles).toBeGreaterThan(initialJsFiles);
  });

  test('should have multiple chunk files in production build', async ({ page }) => {
    // This test validates that code splitting creates multiple chunks
    const jsRequests: string[] = [];
    
    page.on('response', response => {
      if (response.url().includes('.js') && response.status() === 200) {
        jsRequests.push(response.url());
      }
    });

    await page.goto('http://localhost:5003/');
    await page.waitForLoadState('networkidle');
    
    // Filter for chunk files (usually have hash in filename)
    const chunkFiles = jsRequests.filter(url => 
      url.includes('-') && url.endsWith('.js')
    );
    
    console.log(`Chunk files loaded: ${chunkFiles.length}`);
    console.log('Chunks:', chunkFiles.map(url => url.split('/').pop()).join(', '));
    
    // Expect at least 3 different chunks (main + vendor chunks)
    expect(chunkFiles.length).toBeGreaterThanOrEqual(3);
  });

  test('should load vendor chunks separately', async ({ page }) => {
    const jsRequests: string[] = [];
    
    page.on('response', response => {
      if (response.url().includes('.js')) {
        jsRequests.push(response.url());
      }
    });

    await page.goto('http://localhost:5003/');
    await page.waitForLoadState('networkidle');
    
    // Check for vendor chunks
    const vendorChunks = jsRequests.filter(url => 
      url.includes('vendor') || url.includes('react') || url.includes('ui')
    );
    
    console.log(`Vendor chunks found: ${vendorChunks.length}`);
    
    // Should have at least one vendor chunk
    expect(vendorChunks.length).toBeGreaterThanOrEqual(1);
  });

  test('should not load admin chunks on public pages', async ({ page }) => {
    const jsRequests: string[] = [];
    
    page.on('response', response => {
      if (response.url().includes('.js')) {
        jsRequests.push(response.url());
      }
    });

    // Visit only public pages
    await page.goto('http://localhost:5003/');
    await page.waitForLoadState('networkidle');
    
    await page.goto('http://localhost:5003/properties');
    await page.waitForLoadState('networkidle');
    
    // Check that no admin-related chunks are loaded
    const adminChunks = jsRequests.filter(url => 
      url.toLowerCase().includes('admin') || 
      url.toLowerCase().includes('crm') ||
      url.toLowerCase().includes('dashboard')
    );
    
    console.log(`Admin chunks on public pages: ${adminChunks.length}`);
    
    // Should not load admin chunks on public pages
    expect(adminChunks.length).toBe(0);
  });
});
