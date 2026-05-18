import { defineConfig, devices } from '@playwright/test';

/**
 * Configuración central de Playwright para pruebas API y Web.
 */
export default defineConfig({
  testDir: './tests',

  timeout: 60000,

  expect: {
    timeout: 10000,
  },

  fullyParallel: true,

  forbidOnly: !!process.env.CI,

  retries: process.env.CI ? 2 : 0,

  workers: process.env.CI ? 1 : undefined,

  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
  ],

  use: {
    actionTimeout: 30000,
    navigationTimeout: 60000,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'api',
      testMatch: /.*api\/.*\.spec\.ts/,
    },
    {
      name: 'web-chromium',
      testMatch: /.*web\/.*\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        viewport: {
          width: 1366,
          height: 768,
        },
      },
    },
   {
     name: 'web-firefox',
     testMatch: /.*web\/.*\.spec\.ts/,
     use: {
       ...devices['Desktop Firefox'],
     },
   },
   {
     name: 'web-webkit',
     testMatch: /.*web\/.*\.spec\.ts/,
     use: {
       ...devices['Desktop Safari'],
     },
  },
  ]
});