import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, resolve, sep } from 'node:path';
import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

// The release workflow bumps package.json before it builds, so the version the
// About dialog shows is the one that ships.
const { version } = JSON.parse(readFileSync('./package.json', 'utf8'));

// Writes sw.js, the service worker in src/sw.js with the files it keeps for
// offline use. It runs once the build is written, public/ included, so the
// list is exactly what ships. The cache is named for a hash of those files as
// well as the version: builds of main between releases share a version.
function serviceWorker() {
  let root;
  let outDir;

  return {
    name: 'gcwind:service-worker',
    apply: 'build',
    configResolved(config) {
      root = config.root;
      outDir = resolve(root, config.build.outDir);
    },
    writeBundle() {
      const files = readdirSync(outDir, { recursive: true })
        .filter((file) => statSync(join(outDir, file)).isFile())
        .map((file) => file.split(sep).join('/'))
        .filter((file) => !['_headers', 'sw.js'].includes(file) && !file.endsWith('.DS_Store'))
        .sort();

      const hash = createHash('sha256');
      for (const file of files) hash.update(file).update(readFileSync(join(outDir, file)));

      const art = files.filter((file) => file.startsWith('images/clubs/'));
      // The page as './', the address it is opened at: Cloudflare redirects
      // /index.html to /.
      const shell = files
        .filter((file) => !art.includes(file))
        .map((file) => (file === 'index.html' ? './' : file));

      const values = {
        __SW_CACHE__: `gcwind-${version}-${hash.digest('hex').slice(0, 8)}`,
        __SW_SHELL__: shell,
        __SW_ART__: art
      };
      let source = readFileSync(resolve(root, 'src/sw.js'), 'utf8');
      for (const [name, value] of Object.entries(values)) {
        if (!source.includes(name)) throw new Error(`src/sw.js no longer uses ${name}`);
        source = source.replace(name, () => JSON.stringify(value));
      }
      writeFileSync(join(outDir, 'sw.js'), source);
    }
  };
}

export default defineConfig({
  plugins: [svelte(), serviceWorker()],
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
