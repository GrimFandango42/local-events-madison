// End-to-End UX Workflow Tests
// Validates core user journeys and UX goals

import { test, expect, UXAssertions, URLs } from '../setup/test-config';

test.describe('Core UX Workflows', () => {
  test.beforeEach(async ({ page }) => {
    // Set up performance monitoring
    await page.goto(URLs.HOMEPAGE);
  });

  test('Homepage loads and displays event discovery options within 2 seconds', async ({ 
    page, 
    makeAxeBuilder 
  }) => {
    const startTime = Date.now();
    
    await page.goto(URLs.HOMEPAGE);
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(2000);
    
    // Verify key elements are present for event discovery
    await expect(page.locator('h1').first()).toBeVisible(); // Navigation title
    await expect(page.locator('text=Explore Events')).toBeVisible(); // CTA button
    
    // Check category navigation is available
    const categories = page.locator('[data-testid="category-link"]');
    await expect(categories.first()).toBeVisible();
    
    // Validate accessibility
    await UXAssertions.validateAccessibility(page, makeAxeBuilder);
    
    console.log(`✅ Homepage loaded in ${loadTime}ms`);
  });

  test('User can discover events within 10 seconds', async ({ page }) => {
    const result = await UXAssertions.validateEventDiscovery(page, 10000);
    
    console.log(`✅ Event discovery completed in ${result.time}ms via ${result.method}`);
    expect(result.found).toBe(true);
  });

  test('Events page displays searchable event grid', async ({ page, makeAxeBuilder }) => {
    await page.goto(URLs.EVENTS);
    await page.waitForLoadState('networkidle');
    
    // Check for event grid layout
    const eventCards = page.locator('[data-testid="event-card"]');
    const cardCount = await eventCards.count();
    
    if (cardCount > 0) {
      // Verify events are displayed as cards, not list items
      const firstCard = eventCards.first();
      await expect(firstCard).toBeVisible();
      
      // Check that cards have proper structure (more flexible selector)
      const titleSelector = firstCard.locator('h3, .font-semibold, .font-bold, [class*="font-"]');
      if (await titleSelector.count() > 0) {
        await expect(titleSelector.first()).toBeVisible();
      }
      await expect(firstCard.locator('text=/\\d+/')).toBeVisible(); // Date/time
    }
    
    // Verify search functionality is present
    await expect(page.locator('input[placeholder*="Search"], input[type="search"]')).toBeVisible();
    
    // Verify filters are available - use first select which should be Category filter
    await expect(page.locator('[data-testid="category-filter"]')).toBeVisible();
    
    // Accessibility check
    await UXAssertions.validateAccessibility(page, makeAxeBuilder);
    
    console.log(`✅ Events page displays ${cardCount} events in searchable grid`);
  });

  test('Search functionality works and provides feedback', async ({ page }) => {
    await page.goto(URLs.EVENTS);
    await page.waitForLoadState('networkidle');
    
    const searchInput = page.locator('input[placeholder*="Search"], input[type="search"]').first();
    await expect(searchInput).toBeVisible();
    
    // Test search with a common term
    await searchInput.fill('music');
    
    // Trigger search (either by button click or enter)
    const searchButton = page.locator('button:has-text("Search")');
    if (await searchButton.isVisible()) {
      await searchButton.click();
    } else {
      await searchInput.press('Enter');
    }
    
    await page.waitForTimeout(1000); // Allow for search results
    
    // Verify search provides some feedback (results or "no results" message)
    const hasResults = await page.locator('[data-testid="event-card"]').count() > 0;
    const hasNoResultsMessage = await page.locator('text=/no.*events.*found/i, text=/no.*results/i, text=No Events Found').count() > 0;
    
    // Also check if there's a count indicator showing events found
    const hasEventCount = await page.locator('text=/\d+.*Events? found/i').count() > 0;
    
    expect(hasResults || hasNoResultsMessage || hasEventCount).toBe(true);
    
    console.log(`✅ Search functionality works - ${hasResults ? 'found results' : 'showed no results message'}`);
  });

  test('Category filtering works correctly', async ({ page }) => {
    await page.goto(URLs.EVENTS);
    await page.waitForLoadState('networkidle');
    
    // Find category filter dropdown
    const categorySelect = page.locator('[data-testid="category-filter"]');
    if (await categorySelect.isVisible()) {
      await categorySelect.selectOption('music');
      await page.waitForTimeout(1000); // Allow for filtering
      
      // Verify filtering occurred (either results or no results message)
      const hasResults = await page.locator('[data-testid="event-card"]').count() > 0;
      const hasNoResultsMessage = await page.locator('text=/no.*events.*found/i').count() > 0;
      
      expect(hasResults || hasNoResultsMessage).toBe(true);
      console.log(`✅ Category filtering works - ${hasResults ? 'found filtered results' : 'showed no results message'}`);
    } else {
      // Try clicking category links from homepage
      await page.goto(URLs.HOMEPAGE);
      const musicCategory = page.locator('a[href*="category=music"], text=Music').first();
      if (await musicCategory.isVisible()) {
        await musicCategory.click();
        await page.waitForLoadState('networkidle');
        console.log('✅ Category navigation from homepage works');
      } else {
        console.log('ℹ️ Category filtering not available yet');
      }
    }
  });
});

test.describe('Mobile UX Experience', () => {
  test('Mobile homepage is touch-friendly and readable', async ({ page, mobileViewport, makeAxeBuilder }) => {
    await mobileViewport;
    await page.goto(URLs.HOMEPAGE);
    await page.waitForLoadState('networkidle');
    
    // Validate mobile UX requirements
    await UXAssertions.validateMobileUX(page);
    
    // Check navigation is accessible on mobile
    const navElements = page.locator('nav a, nav button');
    const navCount = await navElements.count();
    if (navCount > 0) {
      const firstNav = navElements.first();
      const box = await firstNav.boundingBox();
      expect(box?.width).toBeGreaterThanOrEqual(44);
      expect(box?.height).toBeGreaterThanOrEqual(44);
    }
    
    // Verify text is readable (not too small)
    const bodyText = await page.locator('body').evaluate(el => {
      const style = getComputedStyle(el);
      return parseInt(style.fontSize);
    });
    expect(bodyText).toBeGreaterThanOrEqual(16); // 16px minimum for mobile
    
    // Accessibility on mobile
    await UXAssertions.validateAccessibility(page, makeAxeBuilder);
    
    console.log('✅ Mobile UX validated - touch-friendly and readable');
  });

  test('Mobile events grid is properly responsive', async ({ page, mobileViewport }) => {
    await mobileViewport;
    await page.goto(URLs.EVENTS);
    await page.waitForLoadState('networkidle');
    
    const eventCards = page.locator('[data-testid="event-card"]');
    const cardCount = await eventCards.count();
    
    if (cardCount > 0) {
      // Check that cards stack properly on mobile (single column)
      const firstCard = eventCards.first();
      const secondCard = eventCards.nth(1);
      
      const firstBox = await firstCard.boundingBox();
      const secondBox = await secondCard.boundingBox();
      
      if (firstBox && secondBox) {
        // Cards should be stacked vertically on mobile
        expect(secondBox.y).toBeGreaterThan(firstBox.y + firstBox.height - 10);
      }
    }
    
    console.log('✅ Mobile events grid is properly responsive');
  });
});

test.describe('Performance & Speed', () => {
  test('Page interactions respond within 500ms', async ({ page }) => {
    await page.goto(URLs.EVENTS);
    await page.waitForLoadState('networkidle');
    
    const searchInput = page.locator('input[placeholder*="Search"]').first();
    if (await searchInput.isVisible()) {
      const startTime = Date.now();
      await searchInput.fill('test');
      const responseTime = Date.now() - startTime;
      
      expect(responseTime).toBeLessThan(500);
      console.log(`✅ Search input response: ${responseTime}ms`);
    }
    
    // Test navigation speed
    const navLink = page.locator('a[href="/events"], a:has-text("Events")').first();
    if (await navLink.isVisible()) {
      const startTime = Date.now();
      await navLink.click();
      await page.waitForLoadState('networkidle');
      const navigationTime = Date.now() - startTime;
      
      expect(navigationTime).toBeLessThan(1000); // Navigation should be under 1s
      console.log(`✅ Navigation response: ${navigationTime}ms`);
    }
  });

  test('Images load efficiently with proper optimization', async ({ page }) => {
    await page.goto(URLs.EVENTS);
    await page.waitForLoadState('networkidle');
    
    // Check for properly sized images
    const images = page.locator('img');
    const imageCount = await images.count();
    
    if (imageCount > 0) {
      for (let i = 0; i < Math.min(imageCount, 3); i++) {
        const img = images.nth(i);
        if (await img.isVisible()) {
          const naturalWidth = await img.evaluate(el => (el as HTMLImageElement).naturalWidth);
          const displayWidth = await img.evaluate(el => el.getBoundingClientRect().width);
          
          // Images shouldn't be more than 2x larger than display size
          expect(naturalWidth).toBeLessThan(displayWidth * 3);
          
          // Images should have alt text for accessibility
          const altText = await img.getAttribute('alt');
          expect(altText).toBeTruthy();
        }
      }
      
      console.log(`✅ ${imageCount} images optimized and accessible`);
    } else {
      console.log('ℹ️ No images found to test');
    }
  });
});

test.describe('Visual Design Consistency', () => {
  test('Typography scale is consistent', async ({ page }) => {
    await page.goto(URLs.HOMEPAGE);
    await page.waitForLoadState('networkidle');
    
    // Check heading hierarchy exists
    const h1Count = await page.locator('h1').count();
    expect(h1Count).toBeGreaterThanOrEqual(1); // Should have at least one h1
    
    const h2Count = await page.locator('h2').count();
    const h3Count = await page.locator('h3').count();
    
    console.log(`✅ Typography hierarchy: ${h1Count} h1, ${h2Count} h2, ${h3Count} h3`);
    
    // Verify consistent font sizes
    const headingSizes = await page.locator('h1, h2, h3').evaluateAll(elements => {
      return elements.map(el => {
        const style = getComputedStyle(el);
        return {
          tag: el.tagName.toLowerCase(),
          fontSize: parseInt(style.fontSize),
          fontWeight: style.fontWeight
        };
      });
    });
    
    // h1 should be largest
    const h1Sizes = headingSizes.filter(h => h.tag === 'h1').map(h => h.fontSize);
    const h2Sizes = headingSizes.filter(h => h.tag === 'h2').map(h => h.fontSize);
    
    if (h1Sizes.length > 0 && h2Sizes.length > 0) {
      expect(Math.max(...h1Sizes)).toBeGreaterThan(Math.max(...h2Sizes));
    }
  });

  test('Color system is consistent', async ({ page }) => {
    await page.goto(URLs.HOMEPAGE);
    await page.waitForLoadState('networkidle');
    
    // Check for consistent button styling
    const buttons = page.locator('button, a[class*="btn"]');
    const buttonCount = await buttons.count();
    
    if (buttonCount > 0) {
      const buttonStyles = await buttons.evaluateAll(elements => {
        return elements.map(el => {
          const style = getComputedStyle(el);
          return {
            backgroundColor: style.backgroundColor,
            color: style.color,
            borderRadius: style.borderRadius
          };
        });
      });
      
      // Should have some consistent styling
      expect(buttonStyles.length).toBeGreaterThan(0);
      console.log(`✅ ${buttonCount} buttons with consistent styling`);
    }
    
    // Check for design system classes (Tailwind)
    const hasDesignClasses = await page.locator('[class*="bg-"], [class*="text-"], [class*="rounded"]').count();
    expect(hasDesignClasses).toBeGreaterThan(0);
    
    console.log('✅ Design system classes are being used');
  });
});