import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { WindCalculator } from '../scripts/windCalculator.js';
import { sweep } from './helpers/sweep.js';

const read = (name) => fs.readFileSync(new URL(name, import.meta.url), 'utf8');

const clubData = JSON.parse(read('../data/clubs.json'));
const calculator = new WindCalculator(clubData);
const golden = JSON.parse(read('./fixtures/golden.json'));

// The guard the Svelte port leans on: every club, every level, and a grid of
// wind speeds, elevations, power balls and distance ratios. Regenerate with
// `npm run fixtures` only when a calculation change is intended.
describe('golden sweep', () => {
  const rows = sweep(calculator);

  it('still covers the same number of cases', () => {
    expect(rows.length).toBe(golden.cases);
  });

  it('produces identical output to the recorded fixture', () => {
    const hash = createHash('sha256').update(rows.join('\n')).digest('hex');
    expect(hash).toBe(golden.sha256);
  });

  it('matches the readable sample row for row', () => {
    const sample = read('./fixtures/golden-sample.txt').trim().split('\n');
    const bySignature = new Map(rows.map((row) => [row.slice(0, row.indexOf('|{')), row]));

    for (const expected of sample) {
      const signature = expected.slice(0, expected.indexOf('|{'));
      expect(bySignature.get(signature), signature).toBe(expected);
    }
  });

  it('never produces a non-finite ring count', () => {
    const bad = rows.filter((row) => /null|NaN|Infinity/.test(row.slice(row.indexOf('|{'))));
    expect(bad).toEqual([]);
  });
});
