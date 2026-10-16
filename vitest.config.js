import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';

// Vitest's default glob matches *.spec.js as well as *.test.js, so without this
// it collects the Playwright specs and fails on test.beforeEach(). Keep the two
// runners explicitly separated rather than relying on the naming convention.
export default defineConfig({
  // Compiles runes, so tests can import the app state from state.svelte.js.
  plugins: [svelte({ configFile: false })],
  test: {
    include: ['tests/**/*.test.js'],
    exclude: ['tests/e2e/**', 'node_modules/**']
  }
});
