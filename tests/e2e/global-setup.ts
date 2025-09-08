// Playwright global setup (2025 best practices)
import { chromium, FullConfig } from '@playwright/test';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function globalSetup(config: FullConfig) {
  console.log('🎭 Setting up Playwright test environment...');
  
  // Setup database (robust on Windows: skip generate, push schema, then seed)
  try {
    console.log('Setting up test database...');
    // Use skip-generate to avoid Windows EPERM client engine rename
    await execAsync('npx prisma db push --skip-generate');
    await execAsync('node scripts/create-sample-data.js');
    console.log('✅ Test database ready');
  } catch (error) {
    console.error('❌ Failed to setup test database:', error);
    process.exit(1);
  }
  
  // Launch browser for authentication if needed
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // Wait for the server to be ready
  const baseURL = config.projects[0].use?.baseURL || 'http://localhost:3000';
  
  try {
    console.log(`Waiting for server at ${baseURL}...`);
    
    let attempts = 0;
    const maxAttempts = 30;
    
    while (attempts < maxAttempts) {
      try {
        const response = await page.goto(`${baseURL}/api/health`);
        if (response?.ok()) {
          console.log('✅ Server is ready');
          break;
        }
      } catch (error) {
        // Server not ready yet
      }
      
      attempts++;
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      if (attempts === maxAttempts) {
        throw new Error('Server did not start in time');
      }
    }
    
    // Verify app is working
    await page.goto(baseURL);
    await page.waitForLoadState('networkidle');
    console.log('✅ Application is responsive');
    
  } catch (error) {
    console.error('❌ Server health check failed:', error);
    await browser.close();
    process.exit(1);
  }
  
  await browser.close();
  console.log('🎭 Playwright setup complete!');
}

export default globalSetup;
