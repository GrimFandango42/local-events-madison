#!/usr/bin/env node

/**
 * Specific test to debug favorite button performance issues
 */

const { chromium } = require('playwright');

async function testFavoriteButtonPerformance() {
  console.log('🔍 Testing favorite button performance...');

  const browser = await chromium.launch({ headless: false, slowMo: 100 });
  const page = await browser.newPage();

  // Capture all console messages and network requests
  const consoleMessages = [];
  const networkRequests = [];
  const favoriteClicks = [];

  page.on('console', (msg) => {
    consoleMessages.push(`[${msg.type().toUpperCase()}] ${msg.text()}`);
  });

  page.on('request', (request) => {
    if (request.url().includes('/api/favorites/')) {
      networkRequests.push({
        url: request.url(),
        method: request.method(),
        timestamp: Date.now()
      });
    }
  });

  page.on('response', (response) => {
    if (response.url().includes('/api/favorites/')) {
      networkRequests.push({
        url: response.url(),
        status: response.status(),
        timestamp: Date.now()
      });
    }
  });

  try {
    console.log('📱 Navigating to homepage...');
    await page.goto('http://localhost:5000/');
    await page.waitForTimeout(3000);

    console.log('🔍 Looking for favorite buttons...');
    const favoriteButtons = await page.locator('[data-testid="favorite-button"], button:has(svg):has-text("Favorite"), button:has(svg):has-text("Save")');
    const buttonCount = await favoriteButtons.count();
    console.log(`Found ${buttonCount} favorite buttons`);

    if (buttonCount === 0) {
      console.log('⚠️ No favorite buttons found, checking events page...');
      await page.goto('http://localhost:5000/events');
      await page.waitForTimeout(3000);

      const eventsFavoriteButtons = await page.locator('[data-testid="favorite-button"], button:has(svg)');
      const eventsButtonCount = await eventsFavoriteButtons.count();
      console.log(`Found ${eventsButtonCount} favorite buttons on events page`);
    }

    // Test favorite button click performance
    console.log('🧪 Testing favorite button click performance...');

    const testButton = favoriteButtons.first();
    if (await testButton.isVisible()) {
      // Measure the time from click to visual change
      console.log('⏱️ Measuring click-to-visual-change time...');

      for (let i = 0; i < 3; i++) {
        console.log(`\n--- Test ${i + 1} ---`);

        // Get initial state
        const initialState = await testButton.textContent();
        console.log(`Initial button state: "${initialState}"`);

        const clickStart = Date.now();
        console.log(`Click initiated at: ${clickStart}`);

        // Click the button
        await testButton.click();

        // Wait for visual change (text or class change)
        let visualChangeTime = null;
        const maxWait = 2000;
        const checkInterval = 10;

        for (let elapsed = 0; elapsed < maxWait; elapsed += checkInterval) {
          await page.waitForTimeout(checkInterval);
          const currentState = await testButton.textContent();
          const currentClass = await testButton.getAttribute('class');

          if (currentState !== initialState || (currentClass && currentClass.includes('bg-pink'))) {
            visualChangeTime = Date.now();
            console.log(`Visual change detected at: ${visualChangeTime}`);
            console.log(`Visual change delay: ${visualChangeTime - clickStart}ms`);
            break;
          }
        }

        if (!visualChangeTime) {
          console.log(`❌ No visual change detected within ${maxWait}ms`);
        }

        favoriteClicks.push({
          test: i + 1,
          clickTime: clickStart,
          visualChangeTime: visualChangeTime,
          delay: visualChangeTime ? visualChangeTime - clickStart : null,
          initialState,
          finalState: await testButton.textContent()
        });

        // Wait before next test
        await page.waitForTimeout(1000);
      }
    } else {
      console.log('❌ No visible favorite buttons to test');
    }

    // Test API performance
    console.log('\n🌐 Testing API performance directly...');
    const apiTestStart = Date.now();

    const response = await page.evaluate(async () => {
      const start = performance.now();
      try {
        const response = await fetch('/api/favorites/toggle', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ eventId: 'test-event-id' })
        });
        const end = performance.now();
        const data = await response.json();
        return {
          success: response.ok,
          status: response.status,
          responseTime: end - start,
          data
        };
      } catch (error) {
        const end = performance.now();
        return {
          success: false,
          error: error.message,
          responseTime: end - start
        };
      }
    });

    console.log('API Test Result:', response);

    // Summary
    console.log('\n📊 Performance Summary:');
    console.log('Favorite Button Clicks:', favoriteClicks);
    console.log('Network Requests:', networkRequests);
    console.log('Console Messages (last 10):', consoleMessages.slice(-10));

    if (favoriteClicks.length > 0) {
      const avgDelay = favoriteClicks
        .filter(click => click.delay !== null)
        .reduce((sum, click, _, arr) => sum + click.delay / arr.length, 0);

      console.log(`\n⏱️ Average click-to-visual-change delay: ${Math.round(avgDelay)}ms`);

      if (avgDelay > 100) {
        console.log('🐌 PERFORMANCE ISSUE: Delays over 100ms detected');
        console.log('🔍 Recommended investigation areas:');
        console.log('  - React component re-rendering');
        console.log('  - State update batching');
        console.log('  - CSS transition delays');
        console.log('  - JavaScript execution blocking');
      } else {
        console.log('✅ Performance within acceptable range');
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
}

testFavoriteButtonPerformance().catch(console.error);