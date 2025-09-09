// Take a screenshot of the homepage for README
const { chromium } = require('playwright');

(async () => {
  console.log('📸 Taking homepage screenshot...');
  
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // Set a good desktop size for the screenshot
  await page.setViewportSize({ width: 1200, height: 800 });
  
  // Navigate to homepage
  await page.goto('http://localhost:5000');
  
  // Wait for page to fully load
  await page.waitForLoadState('networkidle');
  
  // Take screenshot
  await page.screenshot({ 
    path: 'docs/homepage-screenshot.png',
    fullPage: false // Just the above-the-fold content
  });
  
  console.log('✅ Screenshot saved to docs/homepage-screenshot.png');
  
  await browser.close();
})().catch(console.error);