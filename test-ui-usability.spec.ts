import { test, expect, Page } from '@playwright/test';

test.use({
  baseURL: 'http://localhost:5000'
});

test.describe('UI Usability Testing', () => {
  test('Homepage loads and shows main elements', async ({ page }) => {
    await page.goto('/');
    
    // Check main navigation
    await expect(page.locator('nav')).toBeVisible();
    await expect(page.getByText('Madison Events')).toBeVisible();
    
    // Check hero section
    await expect(page.getByText('Find amazing')).toBeVisible();
    await expect(page.getByText('local events')).toBeVisible();
    
    // Check CTA buttons
    await expect(page.getByRole('link', { name: /Explore Events/i })).toBeVisible();
    
    // Take screenshot for visual review
    await page.screenshot({ path: 'tests/outputs/homepage-ui.png', fullPage: true });
  });

  test('Events page loads and filters work', async ({ page }) => {
    await page.goto('/events');
    
    // Check page loaded
    await expect(page.getByText('Madison Events')).toBeVisible();
    
    // Check search functionality
    const searchInput = page.getByTestId('search-input');
    await expect(searchInput).toBeVisible();
    
    // Check filter dropdowns
    const categoryFilter = page.getByTestId('category-filter');
    const neighborhoodFilter = page.getByTestId('neighborhood-filter');
    
    await expect(categoryFilter).toBeVisible();
    await expect(neighborhoodFilter).toBeVisible();
    
    // Take screenshot
    await page.screenshot({ path: 'tests/outputs/events-page-ui.png', fullPage: true });
  });

  test('Mobile responsiveness - Homepage', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // Check mobile navigation
    await expect(page.locator('nav')).toBeVisible();
    
    // Check hero content is still visible
    await expect(page.getByText('Find amazing')).toBeVisible();
    
    // Take mobile screenshot
    await page.screenshot({ path: 'tests/outputs/homepage-mobile.png', fullPage: true });
  });

  test('Mobile responsiveness - Events page', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/events');
    
    // Check filters stack properly on mobile
    const filterSection = page.locator('.bg-white.rounded-lg.shadow-sm');
    await expect(filterSection).toBeVisible();
    
    // Take mobile screenshot
    await page.screenshot({ path: 'tests/outputs/events-mobile.png', fullPage: true });
  });

  test('Event cards are interactive', async ({ page }) => {
    await page.goto('/');
    
    // Wait for event cards to load
    await page.waitForSelector('article', { timeout: 10000 });
    
    const firstCard = page.locator('article').first();
    
    // Check hover effects
    await firstCard.hover();
    
    // Check card has expected elements
    const cardTitle = firstCard.locator('h4');
    await expect(cardTitle).toBeVisible();
  });

  test('Accessibility - Interactive elements have proper sizes', async ({ page }) => {
    await page.goto('/');
    
    // Check all buttons and links meet minimum touch target size
    const buttons = page.locator('button, a');
    const buttonCount = await buttons.count();
    
    for (let i = 0; i < buttonCount; i++) {
      const button = buttons.nth(i);
      const box = await button.boundingBox();
      if (box) {
        // WCAG 2.5.5 recommends 44x44 pixels minimum
        expect(box.height).toBeGreaterThanOrEqual(44);
      }
    }
  });

  test('Performance - Page load times', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;
    
    console.log(`Homepage load time: ${loadTime}ms`);
    expect(loadTime).toBeLessThan(5000); // Should load in under 5 seconds
  });

  test('Error handling - API failures', async ({ page }) => {
    // Intercept API calls to simulate failure
    await page.route('**/api/dashboard', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ success: false, error: 'Server error' })
      });
    });
    
    await page.goto('/');
    
    // Should show graceful error state
    await page.waitForSelector('text=/Loading|Unable to load|Check back/', { timeout: 10000 });
  });
});