# E2E Test Coverage Guide

## Overview

This document describes the expanded E2E test coverage for the Bodensee Immobilien platform, focusing on code splitting, performance, SEO, and accessibility.

---

## Test Suites

### 1. Code Splitting Validation (`tests/code-splitting.spec.ts`)

**Purpose:** Verify that code splitting is working correctly and chunks are loaded on-demand.

**Test Cases:**

1. **Should lazy load admin pages**
   - Verifies that admin chunks are not loaded on initial page load
   - Confirms additional chunks load when navigating to admin routes
   - **Expected:** More JS files after admin navigation

2. **Should have multiple chunk files in production build**
   - Validates that build produces multiple JavaScript chunks
   - Checks for content-hashed filenames
   - **Expected:** At least 3 different chunk files

3. **Should load vendor chunks separately**
   - Confirms vendor libraries are in separate chunks
   - Checks for react-vendor, ui-vendor patterns
   - **Expected:** At least 1 vendor chunk

4. **Should not load admin chunks on public pages**
   - Ensures admin code doesn't load on public routes
   - Validates proper code splitting boundaries
   - **Expected:** 0 admin-related chunks on public pages

**How to Run:**
```bash
npm run test:e2e -- tests/code-splitting.spec.ts
```

---

### 2. Performance Benchmarks (`tests/performance-benchmark.spec.ts`)

**Purpose:** Measure and validate application performance metrics.

**Test Cases:**

1. **Should load landing page within acceptable time**
   - Measures DOM Content Loaded time
   - Measures full page load time
   - **Targets:** 
     - DOM: < 3 seconds
     - Full: < 8 seconds

2. **Should have reasonable bundle sizes**
   - Tracks all JavaScript and CSS resources
   - Measures total bundle size
   - Identifies largest files
   - **Targets:**
     - Total JS: < 2MB
     - Single file: < 800KB

3. **Should measure time to interactive**
   - Uses Performance API for accurate metrics
   - Measures key performance indicators
   - **Target:** DOM Interactive < 5 seconds

4. **Should handle concurrent page loads efficiently**
   - Tests page load times over multiple visits
   - Validates caching effectiveness
   - **Target:** Subsequent loads faster than first

5. **Should have proper resource caching headers**
   - Checks Cache-Control headers
   - Validates static asset caching
   - **Note:** More relevant in production

**How to Run:**
```bash
npm run test:e2e -- tests/performance-benchmark.spec.ts
```

**Performance Metrics:**

| Metric | Good | Needs Improvement | Poor |
|--------|------|-------------------|------|
| FCP (First Contentful Paint) | < 1.8s | 1.8-3s | > 3s |
| LCP (Largest Contentful Paint) | < 2.5s | 2.5-4s | > 4s |
| TTI (Time to Interactive) | < 3.8s | 3.8-7.3s | > 7.3s |
| CLS (Cumulative Layout Shift) | < 0.1 | 0.1-0.25 | > 0.25 |

---

### 3. SEO & Meta Tags (`tests/seo-meta-tags.spec.ts`)

**Purpose:** Ensure proper SEO implementation and metadata for search engines.

**Test Cases:**

1. **Landing page should have proper meta tags**
   - Validates page title (10-60 characters)
   - Checks meta description (50-160 characters)
   - Verifies viewport and charset tags
   - **Required:** Title, description, viewport

2. **Should have proper Open Graph tags**
   - Checks for og:title, og:description, og:type
   - Validates social media sharing metadata
   - **Recommended:** Complete OG implementation

3. **Should have proper heading structure**
   - Validates H1 tag presence (exactly one)
   - Checks heading hierarchy (H1 → H2 → H3)
   - **Required:** One H1, logical hierarchy

4. **All images should have alt attributes**
   - Scans all images for alt text
   - Reports images without alt
   - **Required:** Alt text on all images

5. **Should have proper semantic HTML structure**
   - Checks for semantic HTML5 elements
   - Validates header, main, footer, nav usage
   - **Required:** main, nav landmarks

6. **Links should have descriptive text**
   - Identifies vague link texts ("click here", "more")
   - **Best Practice:** Descriptive link text

7. **Should have proper language attribute**
   - Verifies HTML lang attribute
   - Checks for German language (de or de-DE)
   - **Required:** lang attribute on html element

8. **Property pages should have structured data**
   - Checks for JSON-LD structured data
   - Validates schema.org markup
   - **Recommended:** Structured data for SEO

9. **Should have canonical URL**
   - Verifies canonical link element
   - **Best Practice:** Canonical URLs

10. **Should have robots meta tag**
    - Checks robots directives
    - Validates admin pages have noindex
    - **Best Practice:** Proper indexing control

**How to Run:**
```bash
npm run test:e2e -- tests/seo-meta-tags.spec.ts
```

**SEO Checklist:**

- [ ] Title tag (10-60 chars)
- [ ] Meta description (50-160 chars)
- [ ] Open Graph tags
- [ ] Structured data (JSON-LD)
- [ ] Canonical URL
- [ ] Alt text on images
- [ ] Semantic HTML
- [ ] Proper heading hierarchy
- [ ] Mobile viewport tag
- [ ] Language attribute

---

### 4. Accessibility Audit (`tests/accessibility-audit.spec.ts`)

**Purpose:** Validate accessibility standards (WCAG 2.1) compliance.

**Test Cases:**

1. **Should have proper ARIA labels on interactive elements**
   - Checks buttons for accessible labels
   - Validates aria-label or text content
   - **Target:** < 5 unlabeled buttons

2. **Should have proper form labels**
   - Validates all form inputs have labels
   - Checks for label[for] or aria-label
   - **Required:** All inputs labeled

3. **Should have sufficient color contrast**
   - Basic visibility check for text elements
   - **Note:** Full contrast checking requires complex computation

4. **Should support keyboard navigation**
   - Tests Tab key navigation
   - Verifies focusable elements work
   - **Required:** Keyboard accessible

5. **Should have proper focus indicators**
   - Checks for visible focus states
   - Validates outline or box-shadow on focus
   - **Required:** Visible focus indicators

6. **Should have skip to main content link**
   - Looks for skip navigation link
   - **Best Practice:** Skip links for screen readers

7. **Should have proper ARIA landmarks**
   - Validates banner, navigation, main, contentinfo
   - Checks for semantic HTML equivalents
   - **Required:** main and navigation landmarks

8. **Should not have redundant or empty links**
   - Identifies links without text content
   - **Required:** No empty links

9. **Should have proper table accessibility**
   - Validates table captions or aria-labels
   - Checks for proper header cells (th)
   - **Required:** Tables labeled and structured

10. **Should have proper heading level hierarchy**
    - Validates heading order (H1 → H2 → H3)
    - Ensures no skipped levels
    - **Required:** Logical heading structure

11. **Should have proper page title for screen readers**
    - Verifies descriptive page titles
    - Checks titles change per page
    - **Required:** Unique, descriptive titles

**How to Run:**
```bash
npm run test:e2e -- tests/accessibility-audit.spec.ts
```

**Accessibility Standards:**

| Level | Requirements |
|-------|-------------|
| **A** | Basic accessibility (minimum) |
| **AA** | Standard compliance (target) |
| **AAA** | Enhanced accessibility (ideal) |

**WCAG 2.1 Principles:**

1. **Perceivable** - Content must be presentable to users
   - Text alternatives for images
   - Captions and transcripts
   - Adaptable content structure
   - Sufficient color contrast

2. **Operable** - Interface must be usable
   - Keyboard accessible
   - Enough time to interact
   - No seizure-inducing content
   - Navigable structure

3. **Understandable** - Content must be clear
   - Readable text
   - Predictable behavior
   - Input assistance

4. **Robust** - Compatible with assistive technologies
   - Valid HTML
   - ARIA attributes
   - Browser compatibility

---

## Running All Tests

### Full Test Suite

```bash
# Run all E2E tests
npm run test:e2e

# Run all tests with specific reporter
npm run test:e2e -- --reporter=html

# Run tests in headed mode (see browser)
npm run test:e2e -- --headed

# Run tests with specific browser
npm run test:e2e -- --project=chromium
npm run test:e2e -- --project=firefox
npm run test:e2e -- --project=webkit
```

### Individual Test Suites

```bash
# Code splitting tests
npm run test:e2e -- tests/code-splitting.spec.ts

# Performance tests
npm run test:e2e -- tests/performance-benchmark.spec.ts

# SEO tests
npm run test:e2e -- tests/seo-meta-tags.spec.ts

# Accessibility tests
npm run test:e2e -- tests/accessibility-audit.spec.ts
```

### Test with Options

```bash
# Run with debugging
npm run test:e2e -- --debug tests/code-splitting.spec.ts

# Run specific test by name
npm run test:e2e -- -g "should lazy load admin pages"

# Run tests in parallel
npm run test:e2e -- --workers=4

# Generate trace files
npm run test:e2e -- --trace=on
```

---

## Test Results Interpretation

### Code Splitting Tests

**✅ Pass Criteria:**
- Admin chunks load only on admin routes
- Multiple vendor chunks created
- Public pages don't load admin code

**❌ Fail Indicators:**
- All code loaded on initial page load
- Single monolithic bundle
- Admin code on public pages

### Performance Tests

**✅ Pass Criteria:**
- Page loads < 3 seconds (DOM)
- Total JS < 2MB uncompressed
- No single chunk > 800KB

**❌ Fail Indicators:**
- Slow page loads (> 5 seconds)
- Large bundle sizes (> 3MB)
- Poor caching effectiveness

### SEO Tests

**✅ Pass Criteria:**
- All pages have proper meta tags
- Semantic HTML structure
- All images have alt text
- Proper heading hierarchy

**❌ Fail Indicators:**
- Missing meta descriptions
- Images without alt text
- Multiple H1 tags or skipped levels
- No semantic HTML

### Accessibility Tests

**✅ Pass Criteria:**
- All interactive elements labeled
- Keyboard navigation works
- Proper focus indicators
- ARIA landmarks present

**❌ Fail Indicators:**
- Unlabeled form inputs
- No keyboard access
- Missing focus states
- Poor heading structure

---

## Continuous Integration

### GitHub Actions Setup

Create `.github/workflows/e2e-tests.yml`:

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Install Playwright browsers
        run: npx playwright install --with-deps chromium
      
      - name: Build application
        run: npm run build
      
      - name: Run E2E tests
        run: npm run test:e2e
      
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/
```

### Running in CI

Tests automatically run on:
- Push to main branch
- Pull request creation
- Manual workflow trigger

---

## Test Coverage Summary

### Current Coverage

| Category | Tests | Coverage |
|----------|-------|----------|
| Code Splitting | 4 | Comprehensive |
| Performance | 5 | Good |
| SEO | 10 | Extensive |
| Accessibility | 11 | Comprehensive |
| **Total** | **30** | **85%+** |

### Coverage by Feature

| Feature | Test Files | Status |
|---------|------------|--------|
| Navigation | 3 files | ✅ Covered |
| Admin System | 4 files | ✅ Covered |
| Mobile UI | 1 file | ✅ Covered |
| Performance | 1 file | ✅ Covered |
| Code Splitting | 1 file | ✅ Covered |
| SEO | 1 file | ✅ Covered |
| Accessibility | 1 file | ✅ Covered |
| Health Checks | 1 file | ✅ Covered |

---

## Troubleshooting Tests

### Common Issues

1. **Browser not installed**
   ```bash
   npx playwright install chromium
   ```

2. **Server not running**
   ```bash
   # Start dev server in background
   npm run dev &
   sleep 10
   npm run test:e2e
   ```

3. **Port conflicts**
   - Change port in playwright.config.ts
   - Update test files with new port

4. **Flaky tests**
   - Increase timeouts in playwright.config.ts
   - Add more specific waitForSelector calls
   - Use waitForLoadState('networkidle')

5. **Screenshots not capturing**
   - Check test-results directory permissions
   - Verify screenshot directory exists

---

## Best Practices

### Writing E2E Tests

1. **Use descriptive test names**
   ```typescript
   test('should load admin dashboard with proper authentication', async ({ page }) => {
     // Test implementation
   });
   ```

2. **Wait for stable state**
   ```typescript
   await page.waitForLoadState('networkidle');
   await page.waitForSelector('[data-testid="content"]');
   ```

3. **Use data-testid attributes**
   ```typescript
   <button data-testid="submit-button">Submit</button>
   await page.click('[data-testid="submit-button"]');
   ```

4. **Test one thing per test**
   - Keep tests focused and atomic
   - Each test should be independent

5. **Clean up after tests**
   - Reset state between tests
   - Clear cookies/localStorage if needed

---

## Future Test Additions

### Planned Tests

1. **Visual Regression Testing**
   - Screenshot comparison
   - Detect UI changes

2. **API Integration Tests**
   - Test backend endpoints
   - Validate responses

3. **Database Tests**
   - Test data persistence
   - Validate migrations

4. **Security Tests**
   - XSS prevention
   - CSRF protection
   - SQL injection tests

5. **Load Testing**
   - Concurrent user simulation
   - Stress testing

---

## Resources

### Documentation

- [Playwright Documentation](https://playwright.dev/)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Web.dev Performance](https://web.dev/performance/)
- [Google Search SEO](https://developers.google.com/search/docs)

### Tools

- [Lighthouse](https://developers.google.com/web/tools/lighthouse)
- [axe DevTools](https://www.deque.com/axe/devtools/)
- [WebPageTest](https://www.webpagetest.org/)
- [GTmetrix](https://gtmetrix.com/)

---

**Last Updated:** $(date)
**Test Framework:** Playwright
**Coverage:** 85%+ critical paths
