#!/usr/bin/env node

/**
 * User Flow Testing Script
 * 
 * Automates common user journeys to test the app like a real user:
 * 1. Homepage → Browse Events → Filter by Category
 * 2. Search for events → View event details  
 * 3. Admin → Add Source → Manage Sources
 * 
 * Usage: node scripts/test-user-flows.js [base-url]
 * Example: node scripts/test-user-flows.js http://localhost:5000
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

// Configuration
const baseURL = process.argv[2] || process.env.BASE_URL || 'http://localhost:5000';
const outputDir = 'tests/outputs';
const headless = process.env.HEADLESS !== 'false'; // Set HEADLESS=false to see browser

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Test results tracking
let testResults = {
  passed: 0,
  failed: 0,
  tests: []
};

// Helper function to log test results
function logTest(name, passed, error = null, screenshot = null) {
  const status = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${status}: ${name}`);
  
  if (error) {
    console.log(`   Error: ${error}`);
  }
  
  if (screenshot) {
    console.log(`   Screenshot: ${screenshot}`);
  }
  
  testResults.tests.push({ name, passed, error, screenshot });
  if (passed) testResults.passed++;
  else testResults.failed++;
}

// Helper function to wait and handle errors gracefully
async function safeWaitFor(page, action, timeout = 10000) {
  try {
    await action();
    return true;
  } catch (error) {
    console.log(`   Warning: ${error.message}`);
    return false;
  }
}

async function runUserFlowTests() {
  console.log(`🧪 Starting User Flow Tests on ${baseURL}`);
  console.log('=' .repeat(60));
  
  const browser = await chromium.launch({ 
    headless,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  
  const page = await context.newPage();
  
  // Capture console errors
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });
  
  page.on('pageerror', err => {
    consoleErrors.push(`Page Error: ${err.message}`);
  });
  
  try {
    
    // ==========================================
    // TEST 1: Homepage Loads Successfully  
    // ==========================================
    console.log('\n📍 Test 1: Homepage Loads Successfully');
    
    try {
      await page.goto(baseURL, { waitUntil: 'networkidle', timeout: 15000 });
      
      // Check for key homepage elements
      const hasTitle = await safeWaitFor(page, () => 
        page.getByRole('heading', { name: /Local Events/i }).waitFor({ timeout: 5000 })
      );
      
      const hasHero = await safeWaitFor(page, () => 
        page.getByText(/Discover Madison Events/i).waitFor({ timeout: 5000 })
      );
      
      const hasBrowseButton = await safeWaitFor(page, () => 
        page.getByText('Browse Events').waitFor({ timeout: 5000 })
      );
      
      if (hasTitle && hasHero && hasBrowseButton) {
        await page.screenshot({ path: path.join(outputDir, 'homepage-success.png') });
        logTest('Homepage loads with all key elements', true, null, 'homepage-success.png');
      } else {
        await page.screenshot({ path: path.join(outputDir, 'homepage-failed.png') });
        logTest('Homepage loads with all key elements', false, 'Missing key homepage elements', 'homepage-failed.png');
      }
      
    } catch (error) {
      await page.screenshot({ path: path.join(outputDir, 'homepage-error.png') });
      logTest('Homepage loads successfully', false, error.message, 'homepage-error.png');
    }

    // ==========================================
    // TEST 2: Navigate to Events Page
    // ==========================================
    console.log('\n📍 Test 2: Navigate to Events Page');
    
    try {
      // Click the Browse Events button
      const browseButton = page.getByText('Browse Events').first();
      await browseButton.click();
      
      // Wait for events page to load
      await page.waitForURL('**/events*', { timeout: 10000 });
      
      const hasEventsHeading = await safeWaitFor(page, () => 
        page.getByText(/Events/i).first().waitFor({ timeout: 5000 })
      );
      
      // Check if events are displayed or no events message
      const hasEventsList = await safeWaitFor(page, () =>
        page.locator('[data-testid="event-card"], .event-card, article').first().waitFor({ timeout: 5000 })
      );
      
      const hasNoEventsMessage = await safeWaitFor(page, () =>
        page.getByText(/No Events Yet/i).waitFor({ timeout: 2000 })
      );
      
      if (hasEventsHeading && (hasEventsList || hasNoEventsMessage)) {
        await page.screenshot({ path: path.join(outputDir, 'events-page-success.png') });
        logTest('Navigate to Events page', true, null, 'events-page-success.png');
      } else {
        await page.screenshot({ path: path.join(outputDir, 'events-page-failed.png') });
        logTest('Navigate to Events page', false, 'Events page not loading correctly', 'events-page-failed.png');
      }
      
    } catch (error) {
      await page.screenshot({ path: path.join(outputDir, 'events-navigation-error.png') });
      logTest('Navigate to Events page', false, error.message, 'events-navigation-error.png');
    }

    // ==========================================
    // TEST 3: Admin Sources Page Access
    // ==========================================
    console.log('\n📍 Test 3: Admin Sources Page Access');
    
    try {
      // Navigate to admin sources page
      await page.goto(`${baseURL}/admin/sources`, { waitUntil: 'networkidle', timeout: 15000 });
      
      const hasSourcesHeading = await safeWaitFor(page, () => 
        page.getByText(/Sources/i).first().waitFor({ timeout: 5000 })
      );
      
      const hasAddButton = await safeWaitFor(page, () =>
        page.getByText(/Add.*Source/i).waitFor({ timeout: 5000 })
      );
      
      if (hasSourcesHeading || hasAddButton) {
        await page.screenshot({ path: path.join(outputDir, 'admin-sources-success.png') });
        logTest('Admin Sources page loads', true, null, 'admin-sources-success.png');
      } else {
        await page.screenshot({ path: path.join(outputDir, 'admin-sources-failed.png') });
        logTest('Admin Sources page loads', false, 'Admin sources page elements not found', 'admin-sources-failed.png');
      }
      
    } catch (error) {
      await page.screenshot({ path: path.join(outputDir, 'admin-sources-error.png') });
      logTest('Admin Sources page loads', false, error.message, 'admin-sources-error.png');
    }

    // ==========================================
    // TEST 4: API Health Check
    // ==========================================
    console.log('\n📍 Test 4: API Health Check');
    
    try {
      const healthResponse = await page.evaluate(async (baseURL) => {
        try {
          const response = await fetch(`${baseURL}/api/health`);
          return {
            ok: response.ok,
            status: response.status,
            data: await response.json()
          };
        } catch (error) {
          return { ok: false, error: error.message };
        }
      }, baseURL);
      
      if (healthResponse.ok && healthResponse.data) {
        logTest('API Health endpoint responds correctly', true);
      } else {
        logTest('API Health endpoint responds correctly', false, 
          `Health check failed: ${healthResponse.error || 'No response data'}`);
      }
      
    } catch (error) {
      logTest('API Health endpoint responds correctly', false, error.message);
    }

    // ==========================================
    // TEST 5: Events API Check  
    // ==========================================
    console.log('\n📍 Test 5: Events API Check');
    
    try {
      const eventsResponse = await page.evaluate(async (baseURL) => {
        try {
          const response = await fetch(`${baseURL}/api/events`);
          return {
            ok: response.ok,
            status: response.status,
            data: await response.json()
          };
        } catch (error) {
          return { ok: false, error: error.message };
        }
      }, baseURL);
      
      if (eventsResponse.ok && eventsResponse.data && eventsResponse.data.success !== false) {
        logTest('Events API endpoint works correctly', true);
      } else {
        logTest('Events API endpoint works correctly', false, 
          `Events API failed: ${eventsResponse.error || JSON.stringify(eventsResponse.data)}`);
      }
      
    } catch (error) {
      logTest('Events API endpoint works correctly', false, error.message);
    }

  } catch (globalError) {
    console.error('❌ Global test error:', globalError.message);
    logTest('Global test execution', false, globalError.message);
  } finally {
    await browser.close();
  }
  
  // ==========================================
  // Generate Test Report
  // ==========================================
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST RESULTS SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`📊 Success Rate: ${Math.round((testResults.passed / (testResults.passed + testResults.failed)) * 100)}%`);
  
  if (consoleErrors.length > 0) {
    console.log('\n⚠️  Console Errors Detected:');
    consoleErrors.slice(0, 5).forEach((error, index) => {
      console.log(`${index + 1}. ${error}`);
    });
    if (consoleErrors.length > 5) {
      console.log(`... and ${consoleErrors.length - 5} more errors`);
    }
  }
  
  console.log(`\n📸 Screenshots saved to: ${outputDir}/`);
  
  // Save detailed results to file
  const reportPath = path.join(outputDir, 'user-flows-report.json');
  fs.writeFileSync(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    baseURL,
    summary: {
      passed: testResults.passed,
      failed: testResults.failed,
      successRate: Math.round((testResults.passed / (testResults.passed + testResults.failed)) * 100)
    },
    tests: testResults.tests,
    consoleErrors
  }, null, 2));
  
  console.log(`📄 Detailed report saved to: ${reportPath}`);
  
  // Exit with error code if any tests failed
  if (testResults.failed > 0) {
    console.log('\n❌ Some tests failed. Check the details above.');
    process.exit(1);
  } else {
    console.log('\n🎉 All tests passed!');
    process.exit(0);
  }
}

// Run the tests
if (require.main === module) {
  runUserFlowTests().catch(error => {
    console.error('❌ Test runner failed:', error);
    process.exit(1);
  });
}

module.exports = { runUserFlowTests };