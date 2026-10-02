import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import { WindCalculator } from '../scripts/windCalculator.js';

const clubData = JSON.parse(
  fs.readFileSync(new URL('../data/clubs.json', import.meta.url), 'utf8')
);
const calculator = new WindCalculator(clubData);

describe('construction', () => {
  it('refuses to build without club data', () => {
    expect(() => new WindCalculator()).toThrow(/requires club data/);
    expect(() => new WindCalculator(null)).toThrow(/requires club data/);
  });

  it('exposes the data it was given', () => {
    expect(Object.keys(calculator.clubData)).toEqual([
      'drivers',
      'woods',
      'longirons',
      'shortirons',
      'wedges',
      'roughirons',
      'sandwedges'
    ]);
  });
});

describe('getClubTypeMaxDistance', () => {
  it.each([
    ['drivers', 240],
    ['woods', 180],
    ['longirons', 135],
    ['shortirons', 90],
    ['wedges', 45],
    ['roughirons', 135],
    ['sandwedges', 120]
  ])('%s is %i', (type, expected) => {
    expect(calculator.getClubTypeMaxDistance(type)).toBe(expected);
  });

  it('is undefined for an unknown type', () => {
    expect(calculator.getClubTypeMaxDistance('putters')).toBeUndefined();
  });
});

describe('getPowerBallMultiplier', () => {
  it('covers tiers 0 to 10', () => {
    expect([...Array(11).keys()].map((n) => calculator.getPowerBallMultiplier(n))).toEqual([
      1.0, 1.01, 1.03, 1.04, 1.05, 1.06, 1.07, 1.085, 1.1, 1.115, 1.13
    ]);
  });

  it('falls back to 1 beyond the table', () => {
    expect(calculator.getPowerBallMultiplier(11)).toBe(1.0);
    expect(calculator.getPowerBallMultiplier(-1)).toBe(1.0);
  });
});

describe('getWindBallMultiplier', () => {
  it('reduces wind as the tier rises', () => {
    expect([...Array(11).keys()].map((n) => calculator.getWindBallMultiplier(n))).toEqual([
      1.0, 0.9, 0.85, 0.8, 0.75, 0.7, 0.65, 0.6, 0.55, 0.5, 0.45
    ]);
  });

  it('falls back to 1 beyond the table', () => {
    expect(calculator.getWindBallMultiplier(99)).toBe(1.0);
  });
});

describe('getCategoryMultiplier', () => {
  it('penalises rough and sand, leaves the rest alone', () => {
    expect(calculator.getCategoryMultiplier('roughirons')).toBe(1.45);
    expect(calculator.getCategoryMultiplier('sandwedges')).toBe(1.15);
    for (const type of ['drivers', 'woods', 'longirons', 'shortirons', 'wedges', 'anything']) {
      expect(calculator.getCategoryMultiplier(type)).toBe(1);
    }
  });
});

describe('minPower', () => {
  // Deliberate: wedges, rough irons and sand wedges can be feathered to nothing,
  // while the longer clubs have a floor below which the game forces a club
  // change. See the doc comment on minPower.
  it.each([
    ['drivers', 0.75],
    ['woods', 0.75],
    ['longirons', 0.66],
    ['shortirons', 0.5],
    ['wedges', 0],
    ['roughirons', 0],
    ['sandwedges', 0]
  ])('%s floors at %s', (type, expected) => {
    expect(calculator.minPower([100], type)).toBe(expected);
  });

  it('falls back to 0.5 for an unknown type', () => {
    expect(calculator.minPower([100], 'putters')).toBe(0.5);
  });
});

describe('maxPower', () => {
  it('is power as a fraction of the type maximum', () => {
    expect(calculator.maxPower(120, 240)).toBe(0.5);
    expect(calculator.maxPower(240, 240)).toBe(1);
  });
});

describe('proratedPower', () => {
  it('walks from the floor to the maximum as the ratio rises', () => {
    const p = calculator.proratedPower(180, 'drivers', 240, 1);
    expect(p.max).toBe(0.75);
    expect(p.min).toBe(0.75);

    const half = calculator.proratedPower(240, 'drivers', 240, 0.5);
    expect(half.min).toBe(0.75);
    expect(half.max).toBe(1);
    expect(half.current).toBe(0.875);
    expect(half.mid).toBe(0.875);
  });

  it('puts mid at exactly half of max when the floor is zero', () => {
    const p = calculator.proratedPower(45, 'wedges', 45, 1);
    expect(p.min).toBe(0);
    expect(p.mid).toBe(p.max / 2);
  });
});

describe('windPerRing', () => {
  it('scales with accuracy, power and category', () => {
    // (3 - 50 * 0.02) * 1 / 1 === 2
    expect(calculator.windPerRing('Anything', 1, 50, 1, 'drivers')).toBeCloseTo(2, 10);
    // rough irons carry the 1.45 category multiplier
    expect(calculator.windPerRing('Anything', 1, 50, 1, 'roughirons')).toBeCloseTo(2.9, 10);
  });

  it('gives The B52 and The Grizzly a 10% bonus from level 5', () => {
    const plain = calculator.windPerRing('The Rocket', 5, 50, 1, 'drivers');
    expect(calculator.windPerRing('The B52', 5, 50, 1, 'drivers')).toBeCloseTo(plain * 0.9, 10);
    expect(calculator.windPerRing('The Grizzly', 9, 50, 1, 'drivers')).toBeCloseTo(plain * 0.9, 10);
  });

  it('withholds that bonus below level 5', () => {
    const plain = calculator.windPerRing('The Rocket', 4, 50, 1, 'drivers');
    expect(calculator.windPerRing('The B52', 4, 50, 1, 'drivers')).toBeCloseTo(plain, 10);
  });
});

describe('findClub', () => {
  it('returns the club with its type and the stats for that level', () => {
    const club = calculator.findClub('The Rocket', 1);
    expect(club.clubType).toBe('drivers');
    expect(club.power).toBe(clubData.drivers[0].power[0]);
    expect(club.accuracy).toBe(clubData.drivers[0].accuracy[0]);
  });

  it('returns null for an unknown club', () => {
    expect(calculator.findClub('The Imaginary', 1)).toBeNull();
  });

  it('yields undefined stats for a level the club does not have', () => {
    const club = calculator.findClub('The Rocket', 10);
    const tooHigh = calculator.findClub('Spitfire', 10); // Epic, only 8 levels
    expect(club.power).toBeDefined();
    expect(tooHigh.power).toBeUndefined();
  });
});

describe('calculateWindRings', () => {
  it('rejects a level outside 1-10 or a non-integer', () => {
    for (const bad of [0, 11, -1, 1.5, NaN]) {
      expect(() => calculator.calculateWindRings('The Rocket', bad, 10)).toThrow(/Invalid level/);
    }
  });

  it('rejects an unknown club', () => {
    expect(() => calculator.calculateWindRings('The Imaginary', 1, 10)).toThrow(/Club not found/);
  });

  it('returns the four distances', () => {
    expect(Object.keys(calculator.calculateWindRings('The Rocket', 10, 10))).toEqual([
      'current',
      'max',
      'mid',
      'min'
    ]);
  });

  it('matches the app default: The Rocket Lv10, wind 10, elev 10%, power ball 2', () => {
    expect(calculator.calculateWindRings('The Rocket', 10, 10, 10, 2, 0, 1)).toEqual({
      current: 8.3,
      max: 8.3,
      mid: 7.7,
      min: 7.1
    });
  });

  it('reads zero at minimum distance for the three feathering types', () => {
    for (const [type, club, level] of [
      ['wedges', 'The Rapier', 9],
      ['roughirons', 'Nirvana', 9],
      ['sandwedges', 'Spitfire', 8]
    ]) {
      const rings = calculator.calculateWindRings(club, level, 10, 0, 0, 0, 1);
      expect(rings.min, `${type}/${club}`).toBe(0);
      // Both values are rounded to 1dp independently, so the relationship
      // only holds to within the sum of those two rounding errors.
      expect(Math.abs(rings.mid - rings.max / 2), `${type}/${club}`).toBeLessThanOrEqual(0.1);
    }
  });

  it('keeps a non-zero minimum for the four types with a floor', () => {
    for (const [club, level] of [
      ['The Apocalypse', 8],
      ['The Cataclysm', 8],
      ['The Tsunami', 8],
      ['The Falcon', 8]
    ]) {
      expect(calculator.calculateWindRings(club, level, 10, 0, 0, 0, 1).min).toBeGreaterThan(0);
    }
  });

  it('scales linearly with wind speed', () => {
    const one = calculator.calculateWindRings('The Rocket', 10, 5, 0, 0, 0, 1).current;
    const two = calculator.calculateWindRings('The Rocket', 10, 10, 0, 0, 0, 1).current;
    // one is rounded before doubling, so allow its error twice over.
    expect(Math.abs(two - one * 2)).toBeLessThanOrEqual(0.15);
  });

  it('raises rings with elevation and lowers them with a wind ball', () => {
    const base = calculator.calculateWindRings('The Rocket', 10, 10, 0, 0, 0, 1).current;
    expect(
      calculator.calculateWindRings('The Rocket', 10, 10, 30, 0, 0, 1).current
    ).toBeGreaterThan(base);
    expect(calculator.calculateWindRings('The Rocket', 10, 10, -20, 0, 0, 1).current).toBeLessThan(
      base
    );
    expect(calculator.calculateWindRings('The Rocket', 10, 10, 0, 0, 5, 1).current).toBeLessThan(
      base
    );
  });

  it('raises rings as the power ball tier rises', () => {
    const none = calculator.calculateWindRings('The Rocket', 10, 10, 0, 0, 0, 1).current;
    const ten = calculator.calculateWindRings('The Rocket', 10, 10, 0, 10, 0, 1).current;
    // windPerRing is inversely proportional to power, so more power means
    // more rings, not fewer.
    expect(ten).toBeGreaterThan(none);
  });

  it('rounds to one decimal place', () => {
    for (const value of Object.values(
      calculator.calculateWindRings('The Rocket', 7, 13.3, 15, 3, 2, 0.37)
    )) {
      expect(Number.isFinite(value)).toBe(true);
      expect(Math.round(value * 10) / 10).toBe(value);
    }
  });
});
