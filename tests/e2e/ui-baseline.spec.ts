import { test, expect, Page } from '@playwright/test';

// This test suite is for capturing baseline screenshots of the UI before the redesign.
// These images serve as a "before" reference.

test.describe('UI Baseline Screenshots', () => {

  test('should capture homepage screenshot', async ({ page }) => {
    await page.goto('/');
    // Wait for network to be idle and for a key element to be visible
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('.card'); // Wait for an event card to be present
    
    // Ensure the page is fully rendered before taking a screenshot
    await page.evaluate(() => document.fonts.ready);

    await page.screenshot({ path: 'tests/outputs/baseline-homepage.png', fullPage: true });
  });

  test('should capture events page screenshot', async ({ page }) => {
    await page.goto('/events');
    // Wait for network to be idle and for the event list to appear
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('article'); // article is the tag for EventCard

    // Ensure the page is fully rendered before taking a screenshot
    await page.evaluate(() => document.fonts.ready);

    await page.screenshot({ path: 'tests/outputs/baseline-eventspage.png', fullPage: true });
  });

});
