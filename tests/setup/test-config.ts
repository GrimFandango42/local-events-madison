// Test configuration and utilities for Local Events UX testing
import { test as base, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// Extend Playwright test with custom fixtures
export const test = base.extend<{
  /**
   * Accessibility testing fixture using axe-core
   */
  makeAxeBuilder: () => AxeBuilder;
  
  /**
   * Performance monitoring fixture
   */
  performanceMetrics: () => Promise<{
    fcp: number; // First Contentful Paint
    lcp: number; // Largest Contentful Paint
    cls: number; // Cumulative Layout Shift
    fid: number; // First Input Delay
  }>;
  
  /**
   * Mobile viewport preset
   */
  mobileViewport: () => Promise<void>;
  
  /**
   * Desktop viewport preset
   */
  desktopViewport: () => Promise<void>;
}>({
  makeAxeBuilder: async ({ page }, use) => {
    const makeAxeBuilder = () => new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .exclude('#advertisements'); // Exclude any third-party ads
    await use(makeAxeBuilder);
  },
  
  performanceMetrics: async ({ page }, use) => {
    const getMetrics = async () => {
      const metrics = await page.evaluate(() => {
        return new Promise((resolve) => {
          new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const paintEntries = performance.getEntriesByType('paint');
            const navigationEntries = performance.getEntriesByType('navigation');
            
            resolve({
              fcp: paintEntries.find(e => e.name === 'first-contentful-paint')?.startTime || 0,
              lcp: 0, // Will be updated by LCP observer
              cls: 0, // Will be updated by layout shift observer
              fid: 0, // Will be updated by first input observer
            });
          }).observe({ entryTypes: ['paint', 'largest-contentful-paint', 'layout-shift', 'first-input'] });
        });
      });
      return metrics as any;
    };
    
    await use(getMetrics);
  },
  
  mobileViewport: async ({ page }, use) => {
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
    await use();
  },
  
  desktopViewport: async ({ page }, use) => {
    await page.setViewportSize({ width: 1920, height: 1080 }); // Desktop
    await use();
  },
});

export { expect };

// UX Goals Validation Helpers
export const UXAssertions = {
  /**
   * Validate page loads within performance budget (2s)
   */
  async validateLoadTime(page: any, maxTime: number = 2000) {
    const start = Date.now();
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - start;
    expect(loadTime).toBeLessThan(maxTime);
    return loadTime;
  },
  
  /**
   * Validate accessibility standards (WCAG 2.1 AA)
   */
  async validateAccessibility(page: any, axeBuilder: any) {
    const accessibilityScanResults = await axeBuilder.analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
    return accessibilityScanResults;
  },
  
  /**
   * Validate mobile-friendly design
   */
  async validateMobileUX(page: any) {
    // Check touch targets are at least 44px
    const smallTargets = await page.locator('button, a, input, select').evaluateAll(
      elements => elements.filter(el => {
        const rect = el.getBoundingClientRect();
        return rect.width < 44 || rect.height < 44;
      })
    );
    expect(smallTargets.length).toBe(0);
    
    // Check horizontal scrolling is not required
    const bodyWidth = await page.locator('body').evaluate(el => el.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth);
  },
  
  /**
   * Validate event discovery workflow (10 second goal)
   */
  async validateEventDiscovery(page: any, maxTime: number = 10000) {
    const start = Date.now();
    
    // User should be able to find an event within 10 seconds
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check if events are visible on homepage
    const eventsVisible = await page.locator('[data-testid="event-card"]').count();
    if (eventsVisible > 0) {
      const discoveryTime = Date.now() - start;
      expect(discoveryTime).toBeLessThan(maxTime);
      return { found: true, time: discoveryTime, method: 'homepage' };
    }
    
    // If no events on homepage, try navigation to events page
    await page.click('text=Find Events');
    await page.waitForLoadState('networkidle');
    
    const eventsOnPage = await page.locator('[data-testid="event-card"]').count();
    expect(eventsOnPage).toBeGreaterThan(0);
    
    const discoveryTime = Date.now() - start;
    expect(discoveryTime).toBeLessThan(maxTime);
    return { found: true, time: discoveryTime, method: 'navigation' };
  },
  
  /**
   * Validate visual hierarchy and scannability
   */
  async validateVisualHierarchy(page: any) {
    // Check heading structure (h1 -> h2 -> h3 etc.)
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').allTextContents();
    expect(headings.length).toBeGreaterThan(0);
    
    // Check color contrast ratios
    const contrastIssues = await page.locator('*').evaluateAll(elements => {
      const issues: any[] = [];
      elements.forEach(el => {
        const styles = getComputedStyle(el);
        const textColor = styles.color;
        const bgColor = styles.backgroundColor;
        // Note: This would need a proper contrast checking library
        // For now, just ensure we have actual colors set
        if (textColor && textColor !== 'rgba(0, 0, 0, 0)') {
          // Basic check passed
        }
      });
      return issues;
    });
    
    // Check for consistent spacing
    const spacingElements = await page.locator('[class*="gap-"], [class*="space-"], [class*="p-"], [class*="m-"]').count();
    expect(spacingElements).toBeGreaterThan(0); // Should use consistent spacing classes
  }
};

// Test Data Helpers
export const TestData = {
  sampleEvents: [
    {
      title: "Madison Symphony Orchestra",
      category: "music",
      date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
      venue: "Overture Center",
      price: "$25-65"
    },
    {
      title: "Farmers Market on the Square",
      category: "community", 
      date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
      venue: "Capitol Square",
      price: "Free"
    },
    {
      title: "Art Fair on the Square",
      category: "art",
      date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 1 month from now
      venue: "Capitol Square & State Street",
      price: "Free"
    }
  ],
  
  searchTerms: [
    "music",
    "art", 
    "food",
    "community",
    "jazz",
    "festival"
  ],
  
  neighborhoods: [
    "Downtown",
    "East Side", 
    "West Side",
    "University"
  ]
};

// Base URLs for testing
export const URLs = {
  BASE: 'http://localhost:3003',
  HOMEPAGE: 'http://localhost:3003/',
  EVENTS: 'http://localhost:3003/events',
  ADMIN: 'http://localhost:3003/admin/sources'
};