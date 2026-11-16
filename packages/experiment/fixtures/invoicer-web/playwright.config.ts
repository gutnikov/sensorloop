import { defineConfig, devices } from '@playwright/test';

// The browser specs: they build the app and start it as it runs in production, on its own port.
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://localhost:3100',
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run build && npm start',
    url: 'http://localhost:3100',
    env: { PORT: '3100' },
    reuseExistingServer: !process.env.CI,
  },
});
