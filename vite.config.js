import { readFileSync } from 'node:fs';
import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

// The release workflow bumps package.json before it builds, so the version the
// About dialog shows is the one that ships.
const { version } = JSON.parse(readFileSync('./package.json', 'utf8'));

export default defineConfig({
  plugins: [svelte()],
  define: { __APP_VERSION__: JSON.stringify(version) },

  // Relative asset paths, not Vite's default absolute ones. The app answers at
  // gcwind.webthinking.io and at webthinking.io/gcwind, and an absolute
  // /assets/... resolves to the wrong place under the subpath: the HTML loads
  // and the bundle 404s, leaving a broken page. Relative works at both.
  base: './',

  build: {
    outDir: '_site',
    emptyOutDir: true,
    // The club art is referenced from clubs.json by filename, so it is copied
    // verbatim from public/ rather than hashed and rewritten by the bundler.
    assetsDir: 'assets'
  }
});
