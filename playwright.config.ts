import { defineConfig, devices } from '@playwright/test';

const PORT = 9130;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
  webServer: {
    // Tests run against a production build. The time limit also catches bundler hangs.
    command: `npm run build && npm run start -- -p ${PORT}`,
    port: PORT,
    timeout: 300_000,
    reuseExistingServer: !process.env.CI,
    env: {
      NEXT_PUBLIC_CONTACT_EMAIL: 'test@example.com',
      NEXT_PUBLIC_SITE_URL: 'https://example.com',
    },
  },
});
