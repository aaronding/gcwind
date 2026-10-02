// Regenerates the golden fixtures from the current calculator.
// Run with `npm run fixtures` — and only when a change to the calculation is
// intended, since it overwrites the very thing that guards against accidents.

import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { WindCalculator } from '../scripts/windCalculator.js';
import { sweep } from '../tests/helpers/sweep.js';

const clubData = JSON.parse(
  fs.readFileSync(new URL('../data/clubs.json', import.meta.url), 'utf8')
);
const rows = sweep(new WindCalculator(clubData));
const hash = createHash('sha256').update(rows.join('\n')).digest('hex');

fs.writeFileSync(
  new URL('../tests/fixtures/golden.json', import.meta.url),
  JSON.stringify({ cases: rows.length, sha256: hash }, null, 2) + '\n'
);

// A readable slice so a diff shows what actually changed, not just that a hash
// moved. One club per type, at its lowest and highest level, over a small grid.
const sample = rows.filter((row) => {
  const [, , level, wind, elevation, powerBall, ratio] = row.split('|');
  return (
    (level === '1' || level === '8' || level === '9' || level === '10') &&
    (wind === '10' || wind === '25') &&
    (elevation === '0' || elevation === '30') &&
    (powerBall === '0' || powerBall === '10') &&
    (ratio === '0' || ratio === '1')
  );
});

const byType = new Map();
const trimmed = sample.filter((row) => {
  const [type, club] = row.split('|');
  if (!byType.has(type)) byType.set(type, club);
  return byType.get(type) === club;
});

fs.writeFileSync(
  new URL('../tests/fixtures/golden-sample.txt', import.meta.url),
  trimmed.join('\n') + '\n'
);

console.log(`golden.json: ${rows.length} cases, sha256 ${hash.slice(0, 16)}…`);
console.log(`golden-sample.txt: ${trimmed.length} readable rows`);
