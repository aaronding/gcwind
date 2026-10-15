import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  plugins: [svelte()],
  build: {
    outDir: '_site',
    emptyOutDir: true,
    // The club art is referenced from clubs.json by filename, so it is copied
    // verbatim from public/ rather than hashed and rewritten by the bundler.
    assetsDir: 'assets'
  }
});
