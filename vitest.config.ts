import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['tests/setup-tests.ts'],
    include: ['tests/**/*.{test,spec}.{ts,tsx}'],
    // E2E specs run under Playwright, not Vitest.
    exclude: ['tests/e2e/**', 'node_modules/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        // Barrels only re-export; there is nothing to cover in them.
        'src/**/index.ts',
        'src/**/*.d.ts',
        // Type-only modules erase at compile time, so v8 instruments them with
        // an empty denominator (0/0) and reports that as 0%.
        'src/types/**',
      ],
      // The suite covers 100% of `src` on every metric and the floor matches:
      // an untested branch, or a module shipped without specs, fails CI instead
      // of quietly eroding coverage.
      thresholds: {
        statements: 100,
        lines: 100,
        branches: 100,
        functions: 100,
      },
    },
  },
})
