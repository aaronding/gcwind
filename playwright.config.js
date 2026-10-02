import { defineConfig, devices } from '@playwright/test';

// These specs are the contract the Svelte port must satisfy. They address the
// app through data-testid and visible text only — never DOM structure or
// Shoelace internals — so the same file runs unchanged against both versions.
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',

  use: {
    baseURL: 'http://localhost:8000',
    trace: 'on-first-retry'
  },

  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],

  webServer: {
    command: 'python3 tools/serve.py 8000',
    url: 'http://localhost:8000',
    reuseExistingServer: !process.env.CI,
    stdout: 'ignore'
  }
});
