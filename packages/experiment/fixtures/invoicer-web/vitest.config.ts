import { defineConfig } from 'vitest/config';

// The unit tests only: the browser specs in e2e/ run with Playwright.
export default defineConfig({
  test: { include: ['tests/**/*.test.ts'] },
});
