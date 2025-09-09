// Modern E2E testing with Playwright (2025 best practices)
import { test, expect, Page } from '@playwright/test';

class HomePage {
  constructor(private page: Page) {}
  
  async goto() {
    await this.page.goto('/');
  }
  
  async waitForLoad() {
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForSelector('[data-testid="events-list"]', { timeout: 10000 });
  }
  
  async searchEvents(query: string) {
    await this.page.fill('[data-testid="search-input"]', query);
    await this.page.press('[data-testid="search-input"]', 'Enter');
    await this.page.waitForLoadState('networkidle');
  }
  
  async filterByCategory(category: string) {
    await this.page.selectOption('[data-testid="category-filter"]', category);
    await this.page.waitForLoadState('networkidle');
  }
  
  async getEventCount() {
    const events = this.page.locator('[data-testid="event-card"]');
    return await events.count();
  }
  
  async getFirstEventTitle() {
    return await this.page.locator('[data-testid="event-card"]:first-child [data-testid="event-title"]').textContent();
  }
  
  async clickFirstEvent() {
    await this.page.click('[data-testid="event-card"]:first-child');
  }
}

test.describe('Homepage - Event Discovery', () => {
  let homePage: HomePage;
  
  test.beforeEach(async ({ page }) => {
    homePage = new HomePage(page);
    await homePage.goto();
  });
  
  test('should load and display events', async ({ page }) => {
    await homePage.waitForLoad();
    
    // Check page title
    await expect(page).toHaveTitle(/Local Events/);
    
    // Check that events are loaded
    const eventCount = await homePage.getEventCount();
    expect(eventCount).toBeGreaterThan(0);
    
    // Take screenshot for visual regression testing
    await expect(page).toHaveScreenshot('homepage-loaded.png', {
      fullPage: true,
      mask: [page.locator('[data-testid="dynamic-content"]')], // Mask dynamic content
    });
  });
  
  test('should have proper accessibility', async ({ page }) => {
    await homePage.waitForLoad();
    
    // Check for proper ARIA labels and roles
    await expect(page.locator('main')).toHaveAttribute('role', 'main');
    await expect(page.locator('[data-testid="search-input"]')).toHaveAttribute('aria-label');
    
    // Check keyboard navigation
    await page.keyboard.press('Tab');
    const focusedElement = await page.locator(':focus').getAttribute('data-testid');
    expect(focusedElement).toBeTruthy();
  });
  
  test('should search for events', async ({ page }) => {
    await homePage.waitForLoad();
    
    // Search for music events
    await homePage.searchEvents('music');
    
    // Verify search results
    const eventCount = await homePage.getEventCount();
    expect(eventCount).toBeGreaterThan(0);
    
    // Verify first result contains search term
    const firstEventTitle = await homePage.getFirstEventTitle();
    expect(firstEventTitle?.toLowerCase()).toContain('music');
  });
  
  test('should filter events by category', async ({ page }) => {
    await homePage.waitForLoad();
    
    const initialCount = await homePage.getEventCount();
    
    // Apply food category filter
    await homePage.filterByCategory('food');
    
    const filteredCount = await homePage.getEventCount();
    
    // Verify results changed
    expect(filteredCount).toBeLessThanOrEqual(initialCount);
  });
  
  test('should handle empty search results gracefully', async ({ page }) => {
    await homePage.waitForLoad();
    
    // Search for something that doesn't exist
    await homePage.searchEvents('nonexistenteventsearchterm123');
    
    // Should show "no results" message
    await expect(page.locator('[data-testid="no-results"]')).toBeVisible();
    
    // Should still have proper page structure
    await expect(page.locator('main')).toBeVisible();
    await expect(page.locator('[data-testid="search-input"]')).toBeVisible();
  });
  
  test('should be responsive on mobile', async ({ page, isMobile }) => {
    if (!isMobile) {
      // Set mobile viewport for desktop tests
      await page.setViewportSize({ width: 375, height: 667 });
    }
    
    await homePage.waitForLoad();
    
    // Check mobile navigation
    const mobileMenu = page.locator('[data-testid="mobile-menu"]');
    if (await mobileMenu.isVisible()) {
      await mobileMenu.click();
      await expect(page.locator('[data-testid="navigation-links"]')).toBeVisible();
    }
    
    // Take mobile screenshot
    await expect(page).toHaveScreenshot('homepage-mobile.png', {
      fullPage: true,
    });
  });
  
  test('should have fast loading performance', async ({ page }) => {
    // Measure performance
    const startTime = Date.now();
    
    await homePage.goto();
    await homePage.waitForLoad();
    
    const loadTime = Date.now() - startTime;
    
    // Should load within 3 seconds
    expect(loadTime).toBeLessThan(3000);
    
    // Check Core Web Vitals using Performance API
    const metrics = await page.evaluate(() => {
      return new Promise((resolve) => {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const metrics = {};
          
          entries.forEach((entry) => {
            if (entry.entryType === 'navigation') {
              metrics.domContentLoaded = entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart;
              metrics.loadComplete = entry.loadEventEnd - entry.loadEventStart;
            }
          });
          
          resolve(metrics);
        });
        
        observer.observe({ entryTypes: ['navigation'] });
        
        // Fallback timeout
        setTimeout(() => resolve({}), 1000);
      });
    });
    
    console.log('Performance metrics:', metrics);
  });
  
  test('should handle network errors gracefully', async ({ page, context }) => {
    // Simulate network failure
    await context.setOffline(true);
    
    await homePage.goto();
    
    // Should show offline message or cached content
    const offlineIndicator = page.locator('[data-testid="offline-indicator"]');
    const cachedContent = page.locator('[data-testid="events-list"]');
    
    // Either offline indicator or cached content should be visible
    await expect(offlineIndicator.or(cachedContent)).toBeVisible();
    
    // Restore network
    await context.setOffline(false);
    await page.reload();
    await homePage.waitForLoad();
    
    // Should work normally again
    const eventCount = await homePage.getEventCount();
    expect(eventCount).toBeGreaterThan(0);
  });
});