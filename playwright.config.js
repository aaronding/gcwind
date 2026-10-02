import { defineConfig, devices } from '@playwright/test';

// These specs are the contract the Svelte port must satisfy. They address the
// app through data-testid and visible text only — never DOM structure or
// Shoelace internals — so the same file runs unchanged against both versions.
//
// Set BASE_URL to run them against a deployed site instead of a local server,
// which makes the same suite a post-deploy smoke test:
//
//   BASE_URL=https://gcwind.webthinking.io npm run test:e2e

const baseURL = process.env.BASE_URL || 'http://localhost:8000';
const isRemote = Boolean(process.env.BASE_URL);

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  // Remote runs hit a cold Cloudflare cache and the Shoelace CDN on first
  // load, which can time out once before anything is warm.
  retries: process.env.CI || isRemote ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',

  use: {
    baseURL,
    trace: 'on-first-retry'
  },

  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],

  // Only stand up a local server when testing a local build.
  webServer: isRemote
    ? undefined
    : {
        command: 'python3 tools/serve.py 8000',
        url: 'http://localhost:8000',
        reuseExistingServer: !process.env.CI,
        stdout: 'ignore'
      }
});
