
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests-e2e',

  fullyParallel: true,

  reporter: 'html',

  use: {
    baseURL: 'http://localhost:5173',
    headless: true,
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: {
        browserName: 'chromium',
      },
    },
  ],
});
