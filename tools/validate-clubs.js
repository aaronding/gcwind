// Sanity-checks data/clubs.json against the calculator.
// Run with `npm run validate`.

import fs from 'node:fs';
import path from 'node:path';
import { WindCalculator } from '../scripts/windCalculator.js';

const CLUB_TYPES = [
  'drivers',
  'woods',
  'longirons',
  'shortirons',
  'wedges',
  'roughirons',
  'sandwedges'
];

const data = JSON.parse(fs.readFileSync(new URL('../data/clubs.json', import.meta.url), 'utf8'));
const calculator = new WindCalculator(data);
const errors = [];
const imagesDir = new URL('../images/', import.meta.url).pathname;
const referenced = new Set();

for (const type of CLUB_TYPES) {
  if (!Array.isArray(data[type])) {
    errors.push(`missing or non-array club type: ${type}`);
  }
}

let clubCount = 0;

for (const [type, clubs] of Object.entries(data)) {
  const seen = new Set();

  for (const club of clubs) {
    const where = `${type}/${club.name}`;

    if (seen.has(club.name)) {
      errors.push(`${where}: duplicate club name`);
    }
    seen.add(club.name);

    for (const field of ['name', 'category', 'type', 'image']) {
      if (!club[field]) {
        errors.push(`${where}: missing "${field}"`);
      }
    }

    // A renamed or missing asset should fail here, not 404 in the browser.
    if (club.image) {
      const imagePath = path.join(imagesDir, club.image);
      if (!fs.existsSync(imagePath)) {
        errors.push(`${where}: image not found at images/${club.image}`);
      } else {
        referenced.add(path.resolve(imagePath));
      }
    }

    if (!Array.isArray(club.power) || club.power.length === 0) {
      errors.push(`${where}: missing power values`);
      continue;
    }

    if (club.power.length !== club.accuracy?.length) {
      errors.push(
        `${where}: power has ${club.power.length} entries but accuracy has ${club.accuracy?.length}`
      );
      continue;
    }

    for (let level = 1; level <= club.power.length; level++) {
      const rings = calculator.calculateWindRings(club.name, level, 10, 0, 0, 0, 1);

      for (const key of ['current', 'max', 'mid', 'min']) {
        if (!Number.isFinite(rings[key])) {
          errors.push(`${where} level ${level}: ${key} is not a finite number`);
        }
      }
    }

    clubCount++;
  }
}

// Flag art that nothing points at, so stale files don't pile up. Only WebP is
// checked: the PNGs are the sources that `npm run images` encodes from.
const onDisk = fs
  .readdirSync(path.join(imagesDir, 'clubs'))
  .filter((name) => /\.webp$/i.test(name))
  .map((name) => path.resolve(imagesDir, 'clubs', name));
const orphans = onDisk.filter((file) => !referenced.has(file));

if (orphans.length > 0) {
  console.warn(`warning: ${orphans.length} image(s) not referenced by any club:`);
  for (const file of orphans) {
    console.warn(`  - images/clubs/${path.basename(file)}`);
  }
}

if (errors.length > 0) {
  console.error(`club data validation failed (${errors.length} problems):`);
  for (const error of errors) {
    console.error(`  - ${error}`);
  }
  process.exit(1);
}

console.log(`club data OK: ${clubCount} clubs across ${Object.keys(data).length} types`);
