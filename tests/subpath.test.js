import { describe, it, expect } from 'vitest';
import fs from 'node:fs';

// The app answers at gcwind.webthinking.io and at webthinking.io/gcwind. Vite's
// default base emits absolute asset paths, which resolve to the wrong place
// under a subpath: the HTML loads, the bundle 404s, and the page is blank with
// console errors. That shipped once. This pins the fix.
describe('built asset paths', () => {
  const built = new URL('../_site/index.html', import.meta.url);

  it.runIf(fs.existsSync(built))('are relative, so the app works under a subpath', () => {
    const html = fs.readFileSync(built, 'utf8');
    const refs = [...html.matchAll(/(?:src|href)="([^"]*assets\/[^"]*)"/g)].map((m) => m[1]);

    expect(refs.length, 'no built assets referenced').toBeGreaterThan(0);

    for (const ref of refs) {
      expect(ref, `${ref} is absolute and breaks under a subpath`).not.toMatch(/^\//);
      expect(ref).toMatch(/^\.\//);
    }
  });
});
