// Simple responsive navigation test
const { chromium } = require('playwright');

(async () => {
  console.log('🧪 Testing Responsive Navigation...\n');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  
  // Test Desktop View (1200px wide)
  console.log('📱 Testing Desktop View (1200px)...');
  const desktopPage = await context.newPage();
  await desktopPage.setViewportSize({ width: 1200, height: 800 });
  await desktopPage.goto('http://localhost:5000');
  
  // Wait for page to load
  await desktopPage.waitForLoadState('networkidle');
  
  // Check if desktop navigation is visible
  const desktopNav = await desktopPage.locator('div.hidden.md\\:flex').isVisible();
  const mobileNav = await desktopPage.locator('div.md\\:hidden').isVisible();
  
  console.log(`✅ Desktop Nav Visible: ${desktopNav}`);
  console.log(`❌ Mobile Nav Hidden: ${!mobileNav}`);
  
  if (desktopNav) {
    const allEventsBtn = await desktopPage.locator('text=All Events').isVisible();
    const findEventsBtn = await desktopPage.locator('text=Find Events').isVisible();
    console.log(`📝 "All Events" button visible: ${allEventsBtn}`);
    console.log(`📝 "Find Events" button visible: ${findEventsBtn}`);
  }
  
  // Test Mobile View (375px wide)
  console.log('\n📱 Testing Mobile View (375px)...');
  const mobilePage = await context.newPage();
  await mobilePage.setViewportSize({ width: 375, height: 667 });
  await mobilePage.goto('http://localhost:5000');
  
  // Wait for page to load
  await mobilePage.waitForLoadState('networkidle');
  
  // Check if mobile navigation is visible
  const mobileDesktopNav = await mobilePage.locator('div.hidden.md\\:flex').isVisible();
  const mobileMobileNav = await mobilePage.locator('div.md\\:hidden').isVisible();
  
  console.log(`❌ Desktop Nav Hidden: ${!mobileDesktopNav}`);
  console.log(`✅ Mobile Nav Visible: ${mobileMobileNav}`);
  
  if (mobileMobileNav) {
    const hamburgerMenu = await mobilePage.locator('button').first().isVisible();
    console.log(`🍔 Hamburger menu visible: ${hamburgerMenu}`);
  }
  
  console.log('\n🎯 Test Results Summary:');
  console.log(`Desktop (1200px): Desktop Nav = ${desktopNav ? '✅' : '❌'}, Mobile Nav = ${mobileNav ? '❌' : '✅'}`);
  console.log(`Mobile (375px): Desktop Nav = ${mobileDesktopNav ? '❌' : '✅'}, Mobile Nav = ${mobileMobileNav ? '✅' : '❌'}`);
  
  const testPassed = desktopNav && !mobileNav && !mobileDesktopNav && mobileMobileNav;
  console.log(`\n🎉 Overall Test Result: ${testPassed ? 'PASS ✅' : 'FAIL ❌'}`);
  
  // Keep browser open for manual inspection
  console.log('\n👀 Browser left open for manual inspection...');
  console.log('Press Ctrl+C to close when done.');
  
  // Don't close automatically - let user inspect
  // await browser.close();
})();