import { test, expect, request } from "@playwright/test";

test.describe('Navigation Responsive Design - API & Structure Tests', () => {
  const baseURL = process.env.BASE_URL || `http://localhost:${process.env.PORT || 5000}`;

  test('Homepage loads successfully', async () => {
    const api = await request.newContext();
    const res = await api.get(baseURL);
    expect(res.ok()).toBeTruthy();
    
    const content = await res.text();
    
    // Verify navigation component is present
    expect(content).toContain('nav');
    expect(content).toContain('Müller Immobilien Logo');
    
    // Check for responsive classes that should be present
    expect(content).toContain('md:block'); // Desktop navigation visibility
    expect(content).toContain('md:hidden'); // Mobile menu visibility
    expect(content).toContain('flex items-center'); // Responsive layout classes
    
    // Verify navigation links are present
    expect(content).toContain('nav.home');
    expect(content).toContain('nav.properties');
    expect(content).toContain('nav.about');
    expect(content).toContain('services.title');
    
    // Check for AI service buttons
    expect(content).toContain('AI-Bewertung');
    expect(content).toContain('gradient-to-r');
    
    // Verify contact information
    expect(content).toContain('+49 160 8066630');
    expect(content).toContain('Friedrichshafen');
    
    // Check for language selector
    expect(content).toContain('LanguageSelector');
  });

  test('Navigation structure contains responsive breakpoints', async () => {
    const api = await request.newContext();
    const res = await api.get(baseURL);
    const content = await res.text();
    
    // Check for Tailwind responsive breakpoints
    const responsiveBreakpoints = [
      'sm:', 'md:', 'lg:', 'xl:', '2xl:'
    ];
    
    responsiveBreakpoints.forEach(breakpoint => {
      expect(content).toContain(breakpoint);
    });
    
    // Check for specific mobile-first responsive patterns
    expect(content).toContain('hidden md:block'); // Desktop navigation
    expect(content).toContain('md:hidden'); // Mobile menu button
    expect(content).toContain('hidden xl:flex'); // XL specific layouts
    expect(content).toContain('hidden 2xl:flex'); // 2XL specific layouts
  });

  test('Mobile menu functionality elements are present', async () => {
    const api = await request.newContext();
    const res = await api.get(baseURL);
    const content = await res.text();
    
    // Check for mobile menu toggle button
    expect(content).toContain('Toggle navigation menu');
    expect(content).toContain('Menu');
    expect(content).toContain('X');
    
    // Check for mobile-specific layout classes
    expect(content).toContain('md:hidden');
    expect(content).toContain('bg-white/95 backdrop-blur-md');
  });

  test('Contact information responsive display structure', async () => {
    const api = await request.newContext();
    const res = await api.get(baseURL);
    const content = await res.text();
    
    // Verify different responsive layouts for contact info
    expect(content).toContain('hidden 2xl:flex'); // Full contact info on 2XL
    expect(content).toContain('hidden xl:flex 2xl:hidden'); // Phone only on XL
    
    // Check contact information content
    expect(content).toContain('+49 160 8066630');
    expect(content).toContain('Friedrichshafen • Bodensee-Region');
  });

  test('AI service buttons have proper responsive styling', async () => {
    const api = await request.newContext();
    const res = await api.get(baseURL);
    const content = await res.text();
    
    // Check for AI service styling classes
    expect(content).toContain('bg-gradient-to-r from-[#566873] to-[#65858C]');
    expect(content).toContain('hover:shadow-lg hover:scale-105');
    expect(content).toContain('border-2 border-white/20');
    
    // Verify responsive text handling
    expect(content).toContain('hidden lg:inline'); // Desktop text
    expect(content).toContain('lg:hidden'); // Mobile text alternatives
  });

  test('Language selector is properly integrated', async () => {
    const api = await request.newContext();
    const res = await api.get(baseURL);
    const content = await res.text();
    
    // Check for language selector component
    expect(content).toContain('LanguageSelector');
    expect(content).toContain('isScrolled');
    
    // Verify it's present in both desktop and mobile layouts
    expect(content).toContain('flex items-center mr-2'); // Desktop position
  });
});

test.describe('Navigation CSS and Responsive Classes Validation', () => {
  const baseURL = process.env.BASE_URL || `http://localhost:${process.env.PORT || 5000}`;

  test('Responsive CSS classes follow mobile-first approach', async () => {
    const api = await request.newContext();
    const res = await api.get(baseURL);
    const content = await res.text();
    
    // Mobile-first responsive patterns
    const mobileFirstPatterns = [
      'md:hidden', // Mobile menu button
      'hidden md:block', // Desktop navigation
      'flex items-center', // Layout classes
      'hidden 2xl:flex', // Progressive disclosure
      'hidden xl:flex', // XL specific
    ];    mobileFirstPatterns.forEach(pattern => {
      expect(content).toContain(pattern);
    });
  });

  test('Navigation layout prevents text overlapping', async () => {
    const api = await request.newContext();
    const res = await api.get(baseURL);
    const content = await res.text();
    
    // Check for proper spacing and layout classes
    expect(content).toContain('space-x-2 lg:space-x-3'); // Proper item spacing
    expect(content).toContain('whitespace-nowrap'); // Prevent text wrapping
    expect(content).toContain('flex-shrink-0'); // Logo doesn't shrink
    expect(content).toContain('flex-1'); // Navigation takes available space
    
    // Verify container layout
    expect(content).toContain('max-w-7xl mx-auto');
    expect(content).toContain('flex items-center h-16 gap-4');
  });

  test('Mobile menu has proper styling for clarity', async () => {
    const api = await request.newContext();
    const res = await api.get(baseURL);
    const content = await res.text();
    
    // Mobile menu styling
    expect(content).toContain('bg-white/95 backdrop-blur-md');
    expect(content).toContain('border-t border-gray-100');
    expect(content).toContain('px-2 pt-2 pb-3 space-y-1');
    
    // Section separators
    expect(content).toContain('pt-3 border-t border-gray-200');
    expect(content).toContain('pt-4 border-t border-gray-200');
  });
});

test.describe('Navigation Accessibility and Structure', () => {
  const baseURL = process.env.BASE_URL || `http://localhost:${process.env.PORT || 5000}`;

  test('Navigation has proper accessibility attributes', async () => {
    const api = await request.newContext();
    const res = await api.get(baseURL);
    const content = await res.text();
    
    // Check for accessibility attributes
    expect(content).toContain('aria-label="Toggle navigation menu"');
    expect(content).toContain('data-testid="link-logo"');
    expect(content).toContain('data-testid="img-logo"');
    
    // Verify button test IDs for different viewport interactions
    expect(content).toContain('data-testid="button-nav-');
    expect(content).toContain('data-testid="button-ai-');
    expect(content).toContain('data-testid="button-human-');
    expect(content).toContain('data-testid="button-mobile-');
  });

  test('Navigation structure supports keyboard navigation', async () => {
    const api = await request.newContext();
    const res = await api.get(baseURL);
    const content = await res.text();
    
    // Check for interactive elements that support keyboard navigation
    expect(content).toContain('button');
    expect(content).toContain('focus:');
    expect(content).toContain('hover:');
    
    // Verify proper semantic structure
    expect(content).toContain('<nav');
    expect(content).toContain('role=');
  });
});