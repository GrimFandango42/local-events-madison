import { defineConfig, devices } from '@playwright/test';

/**
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests/e2e',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 1,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 2 : undefined,
  
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['html', { 
      outputFolder: 'tests/reports/playwright',
      open: process.env.CI ? 'never' : 'on-failure'
    }],
    ['json', { outputFile: 'tests/reports/playwright/results.json' }],
    ['junit', { outputFile: 'tests/reports/playwright/results.xml' }],
    ['list']
  ],
  
  /* Global test timeout */
  timeout: 60 * 1000,
  expect: {
    /* Maximum time expect() should wait for the condition to be met. */
    timeout: 15 * 1000,
  },
  
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: 'http://localhost:5000',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    
    /* Take screenshot on failure */
    screenshot: 'only-on-failure',
    
    /* Record video on retry */
    video: 'retain-on-failure',
    
    /* Ignore HTTPS errors during testing */
    ignoreHTTPSErrors: true,
    
    /* Set viewport for consistency */
    viewport: { width: 1280, height: 720 },
  },

  /* Configure projects for major browsers */
  projects: [
    // Desktop browsers
    {
      name: 'Desktop Chrome',
      use: { ...devices['Desktop Chrome'] },
      testMatch: /complete-user-flows\.spec\.ts/,
    },
    
    {
      name: 'Desktop Firefox',
      use: { ...devices['Desktop Firefox'] },
      testMatch: /complete-user-flows\.spec\.ts/,
    },

    {
      name: 'Desktop Safari',
      use: { ...devices['Desktop Safari'] },
      testMatch: /complete-user-flows\.spec\.ts/,
    },

    // Mobile viewports
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
      testMatch: /complete-user-flows\.spec\.ts/,
    },
    
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
      testMatch: /complete-user-flows\.spec\.ts/,
    },
    
    // Performance testing (Chrome only for consistency)
    {
      name: 'Performance Tests',
      use: { 
        ...devices['Desktop Chrome'],
        // Enable performance metrics collection
        contextOptions: {
          recordVideo: { dir: 'tests/reports/performance-videos/' },
        },
      },
      testDir: './tests/performance',
      testMatch: /core-vitals\.test\.ts/,
    },
    
    // Accessibility testing (Chrome only for axe-core compatibility)
    {
      name: 'Accessibility Tests',
      use: { 
        ...devices['Desktop Chrome'],
      },
      testDir: './tests/accessibility',
      testMatch: /compliance\.test\.ts/,
    },
    
    // Mobile accessibility
    {
      name: 'Mobile Accessibility',
      use: { 
        ...devices['Pixel 5'],
      },
      testDir: './tests/accessibility',
      testMatch: /compliance\.test\.ts/,
    },
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    command: 'PORT=5000 npm run dev',
    url: 'http://localhost:5000',
    timeout: 120 * 1000,
    reuseExistingServer: !process.env.CI,
    env: {
      NODE_ENV: 'test',
    },
  },
  
  /* Global setup and teardown */
  globalSetup: './tests/e2e/global-setup.ts',
  globalTeardown: './tests/e2e/global-teardown.ts',
});