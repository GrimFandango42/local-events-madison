// Playwright global teardown (2025 best practices)
import { FullConfig } from '@playwright/test';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';

const execAsync = promisify(exec);

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Cleaning up Playwright test environment...');
  
  try {
    // Clean up test database
    await fs.unlink('./test-e2e.db').catch(() => {});
    console.log('✅ Test database cleaned up');
    
    // Clean up any temporary files
    await fs.rmdir('./temp', { recursive: true }).catch(() => {});
    
    // Archive test results if in CI
    if (process.env.CI) {
      console.log('📦 Archiving test results...');
      try {
        await execAsync('tar -czf test-results.tar.gz test-results/');
        console.log('✅ Test results archived');
      } catch (error) {
        console.warn('⚠️  Failed to archive test results:', error);
      }
    }
    
  } catch (error) {
    console.error('❌ Cleanup error:', error);
  }
  
  console.log('🧹 Playwright teardown complete!');
}

export default globalTeardown;