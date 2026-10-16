// Draws the app icon and writes every size the site needs into public/, and
// the header logo into src/assets/.
// Run with `pnpm run icons` after changing the artwork below.
//
// The icon is the result dial in miniature: aim rings around a gold bullseye,
// with a gust of wind blowing across them. Green to teal is the start of the
// wordmark's gradient, and gold is the result's colour, as in tokens.css.
//
// Three backgrounds from one drawing:
//   - rounded: transparent corners, for the favicon and the manifest's "any"
//     icons, which browsers show as they are
//   - full: a full-bleed square for iOS, which rounds the corners itself
//   - maskable: full-bleed with the artwork shrunk into the centre 80%, which
//     Android may crop to a circle or a squircle

import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const dir = path.dirname(new URL(import.meta.url).pathname);
const out = path.join(dir, '..', 'public');

const BACKGROUND = `
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#3fa34d"/>
      <stop offset="1" stop-color="#0f8f8a"/>
    </linearGradient>
  </defs>`;

const ARTWORK = `
  <g fill="none" stroke="#fff" stroke-width="26">
    <circle cx="256" cy="284" r="150" stroke-opacity=".42"/>
    <circle cx="256" cy="284" r="90" stroke-opacity=".78"/>
  </g>
  <circle cx="256" cy="284" r="44" fill="#ffd166"/>
  <path d="M76 150 H316 a46 46 0 1 0 -46 -46" fill="none" stroke="#fff" stroke-width="36"
    stroke-linecap="round" stroke-linejoin="round"/>`;

/** @param {'rounded' | 'full' | 'maskable'} shape */
function svg(shape) {
  const radius = shape === 'rounded' ? 112 : 0;
  const art =
    shape === 'maskable'
      ? `<g transform="translate(256 256) scale(.8) translate(-256 -256)">${ARTWORK}</g>`
      : ARTWORK;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">${BACKGROUND}
  <rect width="512" height="512" rx="${radius}" fill="url(#bg)"/>${art}
</svg>
`;
}

const pngs = [
  { file: 'icons/icon-192.png', shape: 'rounded', size: 192 },
  { file: 'icons/icon-512.png', shape: 'rounded', size: 512 },
  { file: 'icons/maskable-192.png', shape: 'maskable', size: 192 },
  { file: 'icons/maskable-512.png', shape: 'maskable', size: 512 },
  { file: 'icons/apple-touch-icon.png', shape: 'full', size: 180 },
  // For the few browsers that still ask for a raster favicon.
  { file: 'icons/favicon-32.png', shape: 'rounded', size: 32 }
];

fs.mkdirSync(path.join(out, 'icons'), { recursive: true });
fs.writeFileSync(path.join(out, 'icon.svg'), svg('rounded'));
console.log('icon.svg');

// The same drawing for the header, imported by App.svelte so the bundler
// resolves its path, which public/ files do not get under the subpath.
fs.writeFileSync(path.join(dir, '..', 'src', 'assets', 'logo.svg'), svg('rounded'));
console.log('src/assets/logo.svg');

for (const { file, shape, size } of pngs) {
  await sharp(Buffer.from(svg(shape)), { density: 72 * (size / 512) * 4 })
    .resize(size, size)
    .png({ compressionLevel: 9, palette: size <= 32 })
    .toFile(path.join(out, file));
  console.log(`${file} (${size}px)`);
}
