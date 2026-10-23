import { defineConfig, devices } from '@playwright/test';
import { settings } from './src/config/settings';

export default defineConfig({
  testDir: './tests',

  // The demo site is shared and resets periodically, so keep the run serial.
  fullyParallel: false,
  workers: 1,

  // Only signing in is retried (see SignInScreen.signIn): a retry of the whole test could hide a real problem.
  retries: 0,

  timeout: 120_000,
  expect: { timeout: 15_000 },

  reporter: [
    ['list', { printSteps: true }],
    ['html', { open: 'never' }],
    ...(process.env.CI ? [['github'] as const] : []),
  ],

  use: {
    baseURL: settings.baseUrl,
    locale: 'en-AU',
    actionTimeout: 30_000,
    navigationTimeout: 30_000,
    // Kept only for failed tests, so successful runs stay fast and clean.
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
    },
  ],
});
