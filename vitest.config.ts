// Vitest configuration for 2025 testing best practices
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'happy-dom',
    // setupFiles: ['./tests/vitest.setup.ts'], // Temporarily disabled
    include: ['tests/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: [
      '**/node_modules/**',
      '**/dist/**', 
      '**/.next/**',
      '**/coverage/**',
      // Exclude E2E tests (should run with Playwright)
      'tests/e2e/**/*',
      // Keep Jest tests separate
      'tests/unit/dateParser.test.ts',
      'tests/integration/mcpEventCollector.test.ts', 
      'tests/api/events.test.ts',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: [
        'app/**/*.{js,ts,jsx,tsx}',
        'lib/**/*.{js,ts,jsx,tsx}',
        'components/**/*.{js,ts,jsx,tsx}',
        'hooks/**/*.{js,ts,jsx,tsx}',
      ],
      exclude: [
        '**/*.d.ts',
        '**/node_modules/**',
        '**/.next/**',
        '**/coverage/**',
        'tests/**',
        '**/*.config.{js,ts}',
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
      },
    },
    // Mock server integration
    server: {
      deps: {
        inline: ['@prisma/client'],
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
  esbuild: {
    target: 'node18',
  },
});