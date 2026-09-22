// Resizes club art and re-encodes it as WebP.
// Run with `npm run images`.
//
// The source PNGs are not kept in the working tree — only the WebP output is.
// They remain in git history, so restore them before re-running this:
//
//   git checkout 548759c -- images/clubs
//
// then delete the PNGs again once the WebP files are regenerated.
//
// The source PNGs are 256x256, but the UI draws them at 40x40 in the club grid
// and 60x60 for the selected club. 192px still covers the largest of those at
// 3x pixel density, so anything above it is wasted bytes.

import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const SIZE = 192;
const QUALITY = 80;

const dir = path.dirname(new URL(import.meta.url).pathname);
const clubDir = path.join(dir, '..', 'images', 'clubs');

const sources = fs
  .readdirSync(clubDir)
  .filter((name) => name.toLowerCase().endsWith('.png'))
  .sort();

if (sources.length === 0) {
  console.error(`no PNGs found in ${clubDir}`);
  console.error('the sources live in git history — restore with:');
  console.error('  git checkout 548759c -- images/clubs');
  process.exit(1);
}

let beforeBytes = 0;
let afterBytes = 0;
const sourceSizes = new Map();

for (const name of sources) {
  const from = path.join(clubDir, name);
  const to = path.join(clubDir, name.replace(/\.png$/i, '.webp'));

  const { width, height } = await sharp(from).metadata();
  sourceSizes.set(`${width}x${height}`, (sourceSizes.get(`${width}x${height}`) ?? 0) + 1);

  await sharp(from)
    .resize(SIZE, SIZE, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .webp({ quality: QUALITY, effort: 6 })
    .toFile(to);

  beforeBytes += fs.statSync(from).size;
  afterBytes += fs.statSync(to).size;
}

const kb = (bytes) => (bytes / 1024).toFixed(1);
const saved = ((1 - afterBytes / beforeBytes) * 100).toFixed(1);

console.log(`converted ${sources.length} images to ${SIZE}x${SIZE} WebP (quality ${QUALITY})`);
console.log(`  before: ${kb(beforeBytes)} KB PNG`);
console.log(`  after:  ${kb(afterBytes)} KB WebP`);
console.log(`  saved:  ${saved}%`);
const sizes = [...sourceSizes].map(([size, n]) => `${n}x ${size}`).join(', ');
console.log(`  source sizes normalised: ${sizes}`);
