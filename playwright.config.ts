import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30000,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:4175',
    viewport: { width: 1440, height: 960 },
    locale: 'en-US',
    channel: process.env.CI ? undefined : 'msedge',
    trace: 'retain-on-failure',
  },
  globalSetup: './e2e/globalSetup.ts',
});
