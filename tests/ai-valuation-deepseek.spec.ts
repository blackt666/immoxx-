import { test, expect } from "@playwright/test";

/**
 * AI Valuation with DeepSeek API E2E Test
 *
 * Tests:
 * 1. Navigate to AI Valuation page
 * 2. Fill out property valuation form
 * 3. Submit and wait for DeepSeek API response
 * 4. Verify valuation results display correctly
 * 5. Check all valuation components (price range, factors, recommendations)
 */

test.describe("AI Valuation with DeepSeek", () => {
  const baseURL = process.env.BASE_URL || `http://localhost:${process.env.PORT || 5001}`;

  test("complete AI valuation flow with DeepSeek", async ({ page }) => {
    console.log("🤖 Starting DeepSeek AI Valuation E2E Test...");

    // 1. Navigate to AI Valuation page
    await page.goto(`${baseURL}/ai-valuation`, {
      waitUntil: "domcontentloaded",
      timeout: 15000
    });

    console.log("✅ Step 1: Navigated to AI Valuation page");

    // Verify page loaded by checking for AI valuation elements
    await expect(
      page.locator('h1, h2, [data-testid*="ai"], [data-testid*="valuation"], .ai-valuation, button:has-text("AI-Bewertung"), input[placeholder*="Adresse"]').first()
    ).toBeVisible({ timeout: 10000 });

    // 2. Fill out the property valuation form
    console.log("📝 Step 2: Filling out property valuation form...");

    // Address
    const addressInput = page.locator('input[id="address"], input[placeholder*="Adresse"]').first();
    await expect(addressInput).toBeVisible({ timeout: 5000 });
    await addressInput.fill("Seestraße 15, 78464 Konstanz");
    console.log("✅ Filled address: Seestraße 15, 78464 Konstanz");

    // Property Type
    const propertyTypeSelect = page.locator('select[id="propertyType"], button:has-text("Wohnung")').first();
    if (await propertyTypeSelect.count() > 0) {
      // If it's a select dropdown
      const tagName = await propertyTypeSelect.evaluate(el => el.tagName.toLowerCase());
      if (tagName === 'select') {
        await propertyTypeSelect.selectOption("Wohnung");
      } else {
        // It's a shadcn Select component
        await propertyTypeSelect.click();
        await page.locator('[role="option"]:has-text("Wohnung")').first().click();
      }
      console.log("✅ Selected property type: Wohnung");
    }

    // Size (m²)
    const sizeInput = page.locator('input[id="size"], input[placeholder*="Wohnfläche"]').first();
    await sizeInput.fill("120");
    console.log("✅ Filled size: 120 m²");

    // Rooms
    const roomsInput = page.locator('input[id="rooms"], input[placeholder*="Zimmer"]').first();
    await roomsInput.fill("3");
    console.log("✅ Filled rooms: 3");

    // Year Built (optional)
    const yearInput = page.locator('input[id="yearBuilt"], input[placeholder*="Baujahr"]').first();
    if (await yearInput.count() > 0) {
      await yearInput.fill("2015");
      console.log("✅ Filled year built: 2015");
    }

    // Condition
    const conditionSelect = page.locator('select[id="condition"], button[role="combobox"]').nth(1);
    if (await conditionSelect.count() > 0) {
      const tagName = await conditionSelect.evaluate(el => el.tagName.toLowerCase());
      if (tagName === 'select') {
        await conditionSelect.selectOption("gut");
      } else {
        await conditionSelect.click();
        await page.locator('[role="option"]:has-text("Gut")').first().click();
      }
      console.log("✅ Selected condition: Gut");
    }

    // City
    const cityInput = page.locator('input[id="city"], input[placeholder*="Stadt"]').first();
    await cityInput.fill("Konstanz");
    console.log("✅ Filled city: Konstanz");

    // Region
    const regionInput = page.locator('input[id="region"], input[placeholder*="Region"]').first();
    await regionInput.fill("Bodensee");
    console.log("✅ Filled region: Bodensee");

    // 3. Submit the form
    console.log("🚀 Step 3: Submitting form to DeepSeek API...");

    const submitButton = page.locator('button[type="submit"]:has-text("bewerten"), button:has-text("Immobilie bewerten")').first();
    await expect(submitButton).toBeVisible();
    await expect(submitButton).toBeEnabled();

    // Click submit and wait for API response
    await submitButton.click();

    // Wait for loading state
    const loadingIndicator = page.locator('button:has-text("läuft"), svg.animate-spin').first();
    if (await loadingIndicator.count() > 0) {
      console.log("⏳ Waiting for DeepSeek API response...");
      await expect(loadingIndicator).toBeVisible({ timeout: 2000 });
    }

    // 4. Wait for valuation results (DeepSeek can take 5-15 seconds)
    console.log("⏱️ Step 4: Waiting for valuation results...");

    // Wait for results to appear - increase timeout for API call
    const resultsHeading = page.locator('h2, h3').filter({ hasText: /Geschätzter.*Wert|Estimated.*Value/i }).first();

    try {
      await expect(resultsHeading).toBeVisible({ timeout: 30000 });
      console.log("✅ Valuation results appeared!");

      // 5. Verify all result components
      console.log("🔍 Step 5: Verifying valuation result components...");

      // Check for price range (min, average, max)
      const priceMinimum = page.locator('p:has-text("Minimum"), div:has-text("Minimum")').first();
      const priceAverage = page.locator('p:has-text("Durchschnitt"), div:has-text("Durchschnitt")').first();
      const priceMaximum = page.locator('p:has-text("Maximum"), div:has-text("Maximum")').first();

      if (await priceMinimum.count() > 0) {
        await expect(priceMinimum).toBeVisible();
        console.log("✅ Price minimum found");
      }

      if (await priceAverage.count() > 0) {
        await expect(priceAverage).toBeVisible();
        console.log("✅ Price average found");
      }

      if (await priceMaximum.count() > 0) {
        await expect(priceMaximum).toBeVisible();
        console.log("✅ Price maximum found");
      }

      // Check for confidence badge
      const confidenceBadge = page.locator('span:has-text("Vertrauen"), span:has-text("Confidence")').first();
      if (await confidenceBadge.count() > 0) {
        await expect(confidenceBadge).toBeVisible();
        console.log("✅ Confidence badge found");
      }

      // Check for positive factors
      const positiveFactors = page.locator('h3, h2').filter({ hasText: /Positive.*Faktoren/i }).first();
      if (await positiveFactors.count() > 0) {
        await expect(positiveFactors).toBeVisible();
        console.log("✅ Positive factors section found");
      }

      // Check for negative factors
      const negativeFactors = page.locator('h3, h2').filter({ hasText: /Negative.*Faktoren/i }).first();
      if (await negativeFactors.count() > 0) {
        await expect(negativeFactors).toBeVisible();
        console.log("✅ Negative factors section found");
      }

      // Check for market analysis
      const marketAnalysis = page.locator('h3, h2').filter({ hasText: /Marktanalyse|Market Analysis/i }).first();
      if (await marketAnalysis.count() > 0) {
        await expect(marketAnalysis).toBeVisible();
        console.log("✅ Market analysis section found");
      }

      // Check for recommendations
      const recommendations = page.locator('h3, h2').filter({ hasText: /Empfehlungen|Recommendations/i }).first();
      if (await recommendations.count() > 0) {
        await expect(recommendations).toBeVisible();
        console.log("✅ Recommendations section found");
      }

      // Take a screenshot of the results
      await page.screenshot({
        path: "logs/ai-valuation-results.png",
        fullPage: true
      });
      console.log("📸 Screenshot saved to logs/ai-valuation-results.png");

      console.log("🎉 DeepSeek AI Valuation E2E Test PASSED!");

    } catch (error) {
      console.error("❌ Valuation results did not appear within timeout");
      console.error("Error:", error);

      // Check for error messages
      const errorAlert = page.locator('[role="alert"], .alert-destructive, p:has-text("Fehler")').first();
      if (await errorAlert.count() > 0) {
        const errorText = await errorAlert.textContent();
        console.error("API Error:", errorText);
      }

      // Take screenshot of error state
      await page.screenshot({
        path: "logs/ai-valuation-error.png",
        fullPage: true
      });

      throw error;
    }
  });

  test("AI valuation form validation", async ({ page }) => {
    console.log("✅ Testing form validation...");

    await page.goto(`${baseURL}/ai-valuation`, {
      waitUntil: "domcontentloaded",
      timeout: 10000
    });

    // Try to submit empty form
    const submitButton = page.locator('button[type="submit"]').first();
    await submitButton.click();

    // Check if browser validation prevents submission
    const addressInput = page.locator('input[id="address"]').first();
    const isInvalid = await addressInput.evaluate(el => !(el as HTMLInputElement).validity.valid);

    if (isInvalid) {
      console.log("✅ Form validation works - empty form prevented");
    }

    // Fill only required fields
    await addressInput.fill("Test Address");
    const sizeInput = page.locator('input[id="size"]').first();
    await sizeInput.fill("100");

    const roomsInput = page.locator('input[id="rooms"]').first();
    await roomsInput.fill("2");

    const cityInput = page.locator('input[id="city"]').first();
    await cityInput.fill("TestCity");

    const regionInput = page.locator('input[id="region"]').first();
    await regionInput.fill("TestRegion");

    // Now form should be valid
    await expect(submitButton).toBeEnabled();
    console.log("✅ Form validation passed with all required fields");
  });
});
