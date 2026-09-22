// Sanity-checks data/clubs.json against the calculator.
// Run with `npm run validate`.

import fs from 'node:fs';
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

if (errors.length > 0) {
  console.error(`club data validation failed (${errors.length} problems):`);
  for (const error of errors) {
    console.error(`  - ${error}`);
  }
  process.exit(1);
}

console.log(`club data OK: ${clubCount} clubs across ${Object.keys(data).length} types`);
