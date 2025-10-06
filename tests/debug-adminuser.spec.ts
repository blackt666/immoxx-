import { test, expect } from "@playwright/test";

test("Debug adminuser page", async ({ page }) => {
  const baseURL = `http://localhost:5001`;
  
  await page.goto(`${baseURL}/adminuser`, {
    waitUntil: "domcontentloaded",
    timeout: 15000,
  });

  console.log(`📍 Current URL: ${page.url()}`);
  
  // Wait a bit for React to render
  await page.waitForTimeout(5000);
  
  // Take a screenshot
  await page.screenshot({ path: 'test-results/debug-adminuser.png', fullPage: true });
  
  // Get the page title
  const title = await page.title();
  console.log(`📋 Page title: "${title}"`);
  
  // Get the page content
  const html = await page.content();
  console.log(`📄 Page HTML length: ${html.length}`);
  console.log(`📄 First 500 chars: ${html.substring(0, 500)}`);
  
  // Check what input elements exist
  const inputs = await page.locator('input').all();
  console.log(`🔍 Found ${inputs.length} input elements`);
  
  for (let i = 0; i < inputs.length; i++) {
    const input = inputs[i];
    const id = await input.getAttribute('id');
    const name = await input.getAttribute('name');
    const type = await input.getAttribute('type');
    const placeholder = await input.getAttribute('placeholder');
    console.log(`   Input ${i}: id="${id}", name="${name}", type="${type}", placeholder="${placeholder}"`);
  }
  
  // Check what's in the root div
  const rootContent = await page.locator('#root').innerHTML();
  console.log(`🎯 Root div content length: ${rootContent.length}`);
  console.log(`🎯 Root div first 200 chars: ${rootContent.substring(0, 200)}`);
  
  // Check for any text content that might indicate what page we're on
  const bodyText = await page.locator('body').textContent();
  console.log(`📝 Body text (first 300 chars): ${bodyText?.substring(0, 300)}`);
});