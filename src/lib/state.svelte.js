// Application state. Everything on screen is derived from the handful of values
// here, which is what makes the imperative DOM syncing of the old app
// unnecessary.

import clubData from './clubs.json';
import { WindCalculator } from './windCalculator.js';

export const calculator = new WindCalculator(clubData);

export const CLUB_TYPES = [
  { key: 'drivers', label: 'Driver' },
  { key: 'woods', label: 'Wood' },
  { key: 'longirons', label: 'Long' },
  { key: 'shortirons', label: 'Short' },
  { key: 'wedges', label: 'Wedge' },
  { key: 'roughirons', label: 'Rough' },
  { key: 'sandwedges', label: 'Sand' }
];

export const ELEVATION_SHORTCUTS = [0, 10, 20, 30];
// -30% is where the rough iron rule starts, so the range reaches down to it.
export const ELEVATION_VALUES = Array.from({ length: 17 }, (_, i) => -30 + i * 5);
export const POWER_BALL_SHORTCUTS = [2, 6, 10];
export const POWER_BALL_VALUES = Array.from({ length: 11 }, (_, i) => i);

export const WIND_MIN = 0.1;
export const WIND_MAX = 25;

/** Levels a club can reach, by rarity. */
export function maxLevelFor(rarity) {
  switch (rarity) {
    case 'Common':
      return 10;
    case 'Rare':
      return 9;
    case 'Epic':
      return 8;
    default:
      return 1;
  }
}

const STORAGE_KEY = 'gcwind:v1';

function defaultSelections() {
  return Object.fromEntries(
    CLUB_TYPES.map(({ key }) => {
      const club = clubData[key][0];
      return [key, { club: club.name, level: maxLevelFor(club.type) }];
    })
  );
}

class AppState {
  clubType = $state('drivers');
  windSpeed = $state(10);
  powerBall = $state(2);
  elevation = $state(10);
  /** Shot distance as a percentage of the club's usable range. */
  distance = $state(100);
  selections = $state(defaultSelections());

  get clubs() {
    return clubData[this.clubType] ?? [];
  }

  get selection() {
    return this.selections[this.clubType];
  }

  get club() {
    return this.clubs.find((c) => c.name === this.selection.club) ?? this.clubs[0];
  }

  get maxLevel() {
    return maxLevelFor(this.club?.type);
  }

  get level() {
    return Math.min(this.selection.level, this.maxLevel);
  }

  get rings() {
    const { club, level, windSpeed } = this;
    if (!club || !Number.isFinite(windSpeed) || windSpeed <= 0) return null;

    try {
      return calculator.calculateWindRings(
        club.name,
        level,
        windSpeed,
        this.elevation,
        this.powerBall,
        0,
        this.distance / 100
      );
    } catch {
      return null;
    }
  }

  selectClub(name) {
    const club = this.clubs.find((c) => c.name === name);
    if (!club) return;

    const cap = maxLevelFor(club.type);
    this.selections = {
      ...this.selections,
      [this.clubType]: {
        club: name,
        // Keep the level where possible, but never above what the club allows.
        level: Math.min(this.selection.level, cap)
      }
    };
  }

  selectLevel(level) {
    this.selections = {
      ...this.selections,
      [this.clubType]: { ...this.selection, level }
    };
  }

  nudgeWind(delta) {
    const next = Math.round(((this.windSpeed || 0) + delta) * 10) / 10;
    this.windSpeed = Math.min(Math.max(next, WIND_MIN), WIND_MAX);
  }

  /** Mirrors the old input rule: a value above the maximum is a missed decimal. */
  setWind(raw) {
    if (raw === '' || raw === null) {
      this.windSpeed = NaN;
      return;
    }

    let value = Number.parseFloat(raw);
    if (!Number.isFinite(value)) return;

    if (value > WIND_MAX) value = Math.round((value / 10) * 10) / 10;
    this.windSpeed = Math.min(Math.max(value, WIND_MIN), WIND_MAX);
  }

  toJSON() {
    const { clubType, windSpeed, powerBall, elevation, distance, selections } = this;
    return { clubType, windSpeed, powerBall, elevation, distance, selections };
  }

  restore(saved) {
    if (!saved || typeof saved !== 'object') return;

    if (CLUB_TYPES.some((t) => t.key === saved.clubType)) this.clubType = saved.clubType;
    if (Number.isFinite(saved.windSpeed)) this.windSpeed = saved.windSpeed;
    if (POWER_BALL_VALUES.includes(saved.powerBall)) this.powerBall = saved.powerBall;
    if (ELEVATION_VALUES.includes(saved.elevation)) this.elevation = saved.elevation;
    if (Number.isFinite(saved.distance)) this.distance = saved.distance;

    // Only adopt selections that still exist, so stale or edited storage cannot
    // leave the app pointing at a club that is no longer in the data.
    if (saved.selections && typeof saved.selections === 'object') {
      const merged = defaultSelections();
      for (const { key } of CLUB_TYPES) {
        const entry = saved.selections[key];
        const club = clubData[key].find((c) => c.name === entry?.club);
        if (!club) continue;
        const level = Number(entry.level);
        if (!Number.isInteger(level) || level < 1) continue;
        merged[key] = { club: club.name, level: Math.min(level, maxLevelFor(club.type)) };
      }
      this.selections = merged;
    }
  }
}

export const app = new AppState();

/** Persist across visits. Storage can throw or be empty, so never assume it. */
export function persist() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) app.restore(JSON.parse(saved));
  } catch {
    // Private mode, blocked storage, or corrupt JSON: fall back to defaults.
  }

  $effect(() => {
    const snapshot = JSON.stringify(app.toJSON());
    try {
      localStorage.setItem(STORAGE_KEY, snapshot);
    } catch {
      // Nothing useful to do if writing fails.
    }
  });
}
