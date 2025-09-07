// Quick browser debugging script
const { chromium } = require('playwright');

async function debugBrowser() {
  console.log('🔍 Starting browser debugging...');
  
  const browser = await chromium.launch({ 
    headless: false,  // Show browser for debugging
    devtools: true    // Open DevTools
  });
  
  const page = await browser.newPage();
  
  // Navigate to events page
  console.log('📍 Navigating to events page...');
  await page.goto('http://localhost:3000/events');
  
  // Wait for page to load
  await page.waitForTimeout(3000);
  
  // Check for JavaScript errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('🚨 Browser Error:', msg.text());
    }
  });
  
  page.on('pageerror', error => {
    console.log('💥 Page Error:', error.message);
  });
  
  // Take a screenshot
  await page.screenshot({ 
    path: 'events-page-debug.png',
    fullPage: true
  });
  console.log('📸 Screenshot saved as events-page-debug.png');
  
  // Check if events are loading
  try {
    await page.waitForSelector('[data-testid="event-card"], .bg-white.rounded-lg', { timeout: 5000 });
    console.log('✅ Events are loading');
    
    // Count events
    const eventCount = await page.locator('.bg-white.rounded-lg').count();
    console.log(`📊 Found ${eventCount} event cards`);
    
  } catch (error) {
    console.log('❌ Events not loading:', error.message);
  }
  
  // Test API endpoints
  console.log('🔌 Testing API endpoints...');
  
  const eventsResponse = await page.evaluate(async () => {
    try {
      const response = await fetch('/api/events');
      const data = await response.json();
      return { success: response.ok, data: data.data?.length || 0 };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
  
  console.log('API /events:', eventsResponse);
  
  const neighborhoodsResponse = await page.evaluate(async () => {
    try {
      const response = await fetch('/api/neighborhoods');
      const data = await response.json();
      return { success: response.ok, data: data.data?.length || 0 };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
  
  console.log('API /neighborhoods:', neighborhoodsResponse);
  
  console.log('🎉 Debug complete! Browser window left open for manual inspection.');
  console.log('Press Ctrl+C to close when done.');
  
  // Keep browser open for manual inspection
  await new Promise(() => {});
}

debugBrowser().catch(console.error);