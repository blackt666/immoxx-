import { test, expect } from '@playwright/test';
import { readFileSync } from 'fs';
import path from 'path';

test.describe('Navigation CSS and Component Analysis', () => {
  
  test('Navigation component has proper responsive CSS classes', async () => {
    // Read the navigation component file
    const navigationPath = path.join(process.cwd(), 'client/src/components/landing/navigation.tsx');
    const navigationContent = readFileSync(navigationPath, 'utf-8');
    
    // Test for mobile-first responsive patterns
    const mobileFirstPatterns = [
      'md:hidden',           // Mobile menu button visibility
      'hidden md:block',     // Desktop navigation visibility  
      'md:flex',            // Responsive flex display
      'lg:px-',             // Large screen padding
      'xl:flex',            // Extra large screen flex
      '2xl:flex',           // Extra extra large screen flex
      'sm:px-',             // Small screen padding
    ];
    
    mobileFirstPatterns.forEach(pattern => {
      expect(navigationContent).toContain(pattern);
    });
  });

  test('Navigation component prevents text overlapping', async () => {
    const navigationPath = path.join(process.cwd(), 'client/src/components/landing/navigation.tsx');
    const navigationContent = readFileSync(navigationPath, 'utf-8');
    
    // Test for overlapping prevention strategies
    const overlappingPreventionPatterns = [
      'whitespace-nowrap',   // Prevents text wrapping
      'flex-shrink-0',      // Logo doesn't shrink
      'flex-1',             // Takes available space
      'space-x-',           // Proper spacing between elements
      'gap-',               // Modern gap spacing
      'max-w-7xl',          // Container width management
    ];
    
    overlappingPreventionPatterns.forEach(pattern => {
      expect(navigationContent).toContain(pattern);
    });
  });

  test('Mobile menu has proper structure and styling', async () => {
    const navigationPath = path.join(process.cwd(), 'client/src/components/landing/navigation.tsx');
    const navigationContent = readFileSync(navigationPath, 'utf-8');
    
    // Test for mobile menu features
    const mobileMenuPatterns = [
      'isOpen &&',                    // Conditional rendering
      'Toggle navigation menu',       // Accessibility label
      'bg-white/95',                 // Backdrop styling
      'backdrop-blur-md',            // Backdrop blur
      'border-t border-gray',        // Section separators
      'px-2 pt-2 pb-3 space-y-1',   // Mobile menu spacing
    ];
    
    mobileMenuPatterns.forEach(pattern => {
      expect(navigationContent).toContain(pattern);
    });
  });

  test('Contact information has responsive display logic', async () => {
    const navigationPath = path.join(process.cwd(), 'client/src/components/landing/navigation.tsx');
    const navigationContent = readFileSync(navigationPath, 'utf-8');
    
    // Test for progressive disclosure of contact info
    const contactResponsivePatterns = [
      'hidden 2xl:flex',          // Full contact on 2XL
      'hidden xl:flex 2xl:hidden', // Phone only on XL
      '+49 160 8066630',          // Phone number
      'Friedrichshafen',          // Location info
    ];
    
    contactResponsivePatterns.forEach(pattern => {
      expect(navigationContent).toContain(pattern);
    });
  });

  test('AI service buttons have proper responsive styling', async () => {
    const navigationPath = path.join(process.cwd(), 'client/src/components/landing/navigation.tsx');
    const navigationContent = readFileSync(navigationPath, 'utf-8');
    
    // Test for AI service button styling
    const aiServicePatterns = [
      'bg-gradient-to-r',           // Gradient background
      'from-[#566873] to-[#65858C]', // Gradient colors
      'hover:shadow-lg',            // Hover effects
      'hover:scale-105',            // Scale animation
      'rounded-full',               // Button shape
      'border-2 border-white/20',   // Border styling
    ];
    
    aiServicePatterns.forEach(pattern => {
      expect(navigationContent).toContain(pattern);
    });
  });

  test('Navigation has proper accessibility attributes', async () => {
    const navigationPath = path.join(process.cwd(), 'client/src/components/landing/navigation.tsx');
    const navigationContent = readFileSync(navigationPath, 'utf-8');
    
    // Test for accessibility features
    const accessibilityPatterns = [
      'aria-label=',               // ARIA labels
      'data-testid=',             // Test identifiers
      'alt="',                    // Image alt text
      'Menu',                     // Semantic elements
      'button',                   // Interactive elements
    ];
    
    accessibilityPatterns.forEach(pattern => {
      expect(navigationContent).toContain(pattern);
    });
  });

  test('Responsive breakpoint coverage is comprehensive', async () => {
    const navigationPath = path.join(process.cwd(), 'client/src/components/landing/navigation.tsx');
    const navigationContent = readFileSync(navigationPath, 'utf-8');
    
    // Test for all Tailwind breakpoints
    const breakpoints = ['sm:', 'md:', 'lg:', 'xl:', '2xl:'];
    
    breakpoints.forEach(breakpoint => {
      expect(navigationContent).toContain(breakpoint);
    });
    
    // Count breakpoint usage to ensure comprehensive coverage
    const smCount = (navigationContent.match(/sm:/g) || []).length;
    const mdCount = (navigationContent.match(/md:/g) || []).length;
    const lgCount = (navigationContent.match(/lg:/g) || []).length;
    const xlCount = (navigationContent.match(/xl:/g) || []).length;
    const xl2Count = (navigationContent.match(/2xl:/g) || []).length;
    
    // Ensure reasonable usage of responsive breakpoints
    expect(mdCount).toBeGreaterThan(5);  // Mobile-desktop breakpoint is crucial
    expect(lgCount).toBeGreaterThan(3);  // Large screens should be optimized
    expect(xlCount).toBeGreaterThan(1);  // Extra large considerations
    
    console.log(`Breakpoint usage: sm:${smCount}, md:${mdCount}, lg:${lgCount}, xl:${xlCount}, 2xl:${xl2Count}`);
  });
});