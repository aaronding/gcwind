// Application state. Everything on screen is derived from the handful of values
// here, which is what makes the imperative DOM syncing of the old app
// unnecessary.

import {
  clubData,
  CLUB_TYPES,
  maxLevelFor,
  defaultSelections,
  cleanSelections,
  withClub,
  withLevel
} from './clubs.js';
import {
  MAX_BAGS,
  cleanName,
  defaultAccountName,
  defaultBagName,
  newAccount,
  newBag,
  readBags
} from './bags.js';
import { WindCalculator } from './windCalculator.js';

export { CLUB_TYPES, maxLevelFor };

export const calculator = new WindCalculator(clubData);

export const ELEVATION_SHORTCUTS = [0, 10, 20, 30];
// Down to -30% for steep downhill shots. The "rough iron rule" players quote is
// not one of them: the calculator already applies it (see categoryAdjustment).
export const ELEVATION_VALUES = Array.from({ length: 17 }, (_, i) => -30 + i * 5);
export const ELEVATION_STEP = 5;
// Wedges are played from 20% elevation so often (the Endbringer rule above all)
// that picking one starts the elevation there.
export const WEDGE_ELEVATION = 20;
export const POWER_BALL_SHORTCUTS = [0, 2, 4, 6, 8, 10];
export const POWER_BALL_VALUES = Array.from({ length: 11 }, (_, i) => i);

export const WIND_MIN = 0.1;
export const WIND_MAX = 25;

/**
 * The wind keypad has no decimal key: wind always has one decimal place, so
 * the digits fill in from the right like a till. 1, 2, 5 is 12.5 and 8, 0 is
 * 8.0. `entry` is the digits typed so far and the result is the new digits.
 * A fourth digit, or one that would go past the maximum, starts a new number,
 * so a slip never leaves the wind stuck out of range.
 */
export function keyWindDigit(entry, digit) {
  let next = String(Number(`${entry}${digit}`));
  if (entry.length >= 3 || Number(next) / 10 > WIND_MAX) next = String(digit);
  return next;
}

/**
 * Where the club in hand comes from: one of the account's bags, or Flex, which
 * is any club at any level. Both are chosen in the bag row. See
 * docs/modes-and-bags.md.
 */
export const MODES = ['bag', 'flex'];

const STORAGE_KEY = 'gcwind:v2';
// Read once to migrate, and never deleted, so rolling back to the build before
// bags still finds the picks it saved.
const LEGACY_STORAGE_KEY = 'gcwind:v1';
// What the last import replaced, for one undo.
const UNDO_KEY = 'gcwind:v2:undo';

/** Exported for the tests; the app uses the single `app` below. */
export class AppState {
  mode = $state('bag');
  /** The club type in hand: a club card on a bag, a tab in Flex. */
  clubType = $state('drivers');
  windSpeed = $state(10);
  powerBall = $state(2);
  elevation = $state(10);
  /** Shot distance as a percentage of the club's usable range. */
  distance = $state(100);

  /** Flex picks: any club at any level, one per type. Not a bag. */
  flex = $state(defaultSelections());

  /** Each account holds one to MAX_BAGS bags; see bags.js. */
  accounts = $state([newAccount(defaultAccountName(0))]);
  activeAccount = $state(0);

  /** The bags as they were before the last removal, for one undo. Not saved. */
  removed = $state(null);

  get account() {
    return this.accounts[this.activeAccount] ?? this.accounts[0];
  }

  get bag() {
    return this.account.bags[this.account.activeBag] ?? this.account.bags[0];
  }

  /** The clubs in use: the bag's, or the Flex picks. */
  get selections() {
    return this.mode === 'flex' ? this.flex : this.bag.selections;
  }

  set selections(value) {
    if (this.mode === 'flex') this.flex = value;
    else this.bag.selections = value;
  }

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

  /**
   * How much the club type's own wind adjustment lowers the rings, as a whole
   * percentage (31 for rough irons, 13 for sand wedges), or 0 for none. Shown
   * so players who know the rough iron rule don't apply it again as elevation.
   */
  get categoryAdjustment() {
    const multiplier = calculator.getCategoryMultiplier(this.clubType);
    return Math.round((1 - 1 / multiplier) * 100);
  }

  get level() {
    return Math.min(this.selection.level, this.maxLevel);
  }

  /**
   * Everything the calculator needs for the shot being played. A bag and Flex
   * fill it the same way, and a tournament plan will fill it from the hole; the
   * rings and the result panel only ever read this.
   */
  get shot() {
    const { club, level, windSpeed, elevation, powerBall, distance } = this;
    return { club, level, windSpeed, elevation, powerBall, distance };
  }

  get rings() {
    const { club, level, windSpeed, elevation, powerBall, distance } = this.shot;
    if (!club || !Number.isFinite(windSpeed) || windSpeed <= 0) return null;

    try {
      return calculator.calculateWindRings(
        club.name,
        level,
        windSpeed,
        elevation,
        powerBall,
        0,
        distance / 100
      );
    } catch {
      return null;
    }
  }

  /**
   * Puts a club type in hand. Switching to wedges sets the elevation to 20%,
   * which the player can still change; picking the type that is already in hand
   * leaves the elevation alone.
   */
  selectClubType(type) {
    if (type === this.clubType) return;
    this.clubType = type;
    if (type === 'wedges') this.elevation = WEDGE_ELEVATION;
  }

  selectClub(name) {
    this.selections = withClub(this.selections, this.clubType, name);
  }

  selectLevel(level) {
    this.selections = withLevel(this.selections, this.clubType, level);
  }

  /** Edits one club of a bag in the active account, whichever bag is in use. */
  setBagClub(index, type, name) {
    const bag = this.account.bags[index];
    if (bag) bag.selections = withClub(bag.selections, type, name);
  }

  setBagLevel(index, type, level) {
    const bag = this.account.bags[index];
    if (bag) bag.selections = withLevel(bag.selections, type, level);
  }

  useFlex() {
    this.mode = 'flex';
  }

  /** Plays from one of the active account's bags, which also leaves Flex. */
  switchBag(index) {
    if (Number.isInteger(index) && index >= 0 && index < this.account.bags.length) {
      this.account.activeBag = index;
      this.mode = 'bag';
    }
  }

  /**
   * Adds a bag after the last one and plays from it. It starts as a copy of
   * the clubs in use, so the player changes only what differs.
   */
  addBag() {
    const { bags } = this.account;
    if (bags.length >= MAX_BAGS) return;
    bags.push(newBag(bags.length, $state.snapshot(this.selections)));
    this.switchBag(bags.length - 1);
  }

  /**
   * Removes a bag, unless it is the only one. The bags after it move up a
   * number, and a default name moves with its number. Removing the bag in use
   * switches to the one before it. What was removed is kept in `removed` until
   * undoRemove() or forgetRemoved().
   */
  removeBag(index) {
    const account = this.account;
    const { bags } = account;
    if (bags.length < 2 || !Number.isInteger(index) || !bags[index]) return;

    this.removed = {
      name: bags[index].name,
      account: this.activeAccount,
      bags: $state.snapshot(bags),
      activeBag: account.activeBag
    };
    bags.splice(index, 1);
    for (let i = index; i < bags.length; i++) {
      if (bags[i].name === defaultBagName(i + 1)) bags[i].name = defaultBagName(i);
    }

    if (account.activeBag > index) account.activeBag -= 1;
    else if (account.activeBag === index) account.activeBag = Math.max(index - 1, 0);
  }

  renameBag(index, name) {
    const bag = this.account.bags[index];
    if (!bag) return;
    bag.name = cleanName(name, defaultBagName(index));
  }

  /** Puts back the bag removeBag() last took out, numbers and bag in use as they were. */
  undoRemove() {
    const account = this.accounts[this.removed?.account];
    if (account) {
      account.bags = this.removed.bags;
      account.activeBag = this.removed.activeBag;
    }
    this.removed = null;
  }

  /** Ends the chance to undo a removal: anything else changed since may not fit it. */
  forgetRemoved() {
    this.removed = null;
  }

  nudgeWind(delta) {
    const next = Math.round(((this.windSpeed || 0) + delta) * 10) / 10;
    this.windSpeed = Math.min(Math.max(next, WIND_MIN), WIND_MAX);
  }

  /** Steps the elevation by `delta` percent, stopping at the ends of the range. */
  nudgeElevation(delta) {
    const [min, max] = [ELEVATION_VALUES[0], ELEVATION_VALUES.at(-1)];
    this.elevation = Math.min(Math.max(this.elevation + delta, min), max);
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
    const { mode, clubType, windSpeed, powerBall, elevation, distance, activeAccount } = this;
    return {
      version: 2,
      mode,
      clubType,
      windSpeed,
      powerBall,
      elevation,
      distance,
      flex: { selections: $state.snapshot(this.flex) },
      activeAccount,
      accounts: $state.snapshot(this.accounts)
    };
  }

  restore(saved) {
    if (!saved || typeof saved !== 'object') return;

    if (CLUB_TYPES.some((t) => t.key === saved.clubType)) this.clubType = saved.clubType;
    if (Number.isFinite(saved.windSpeed)) this.windSpeed = saved.windSpeed;
    if (POWER_BALL_VALUES.includes(saved.powerBall)) this.powerBall = saved.powerBall;
    if (ELEVATION_VALUES.includes(saved.elevation)) this.elevation = saved.elevation;
    if (Number.isFinite(saved.distance)) this.distance = saved.distance;
    if (MODES.includes(saved.mode)) this.mode = saved.mode;

    // Flex picks are v1's selections, which were picked the same way: any
    // club at any level.
    const picks = saved.flex?.selections ?? saved.selections;
    if (picks && typeof picks === 'object') this.flex = cleanSelections(picks);

    // A v2 store, or the single set of picks a v1 store kept, which becomes
    // Account 1's bag. Every bag is checked the same way: see bags.js.
    const bags = readBags(saved);
    if (bags) {
      this.accounts = bags.accounts;
      this.activeAccount = bags.activeAccount;
    }
  }

  /**
   * Everything saved, replaced by `saved`: what an imported backup does.
   * restore() keeps whatever `saved` lacks or cannot use, which suits loading
   * storage over a fresh start but would mix two sets of data here, so the
   * backup is restored over defaults first and then taken whole.
   */
  replaceWith(saved) {
    const next = new AppState();
    next.restore(saved);
    for (const key of SAVED_FIELDS) this[key] = $state.snapshot(next[key]);
    this.removed = null;
  }

  /**
   * The bags and Flex picks from a store another tab saved, leaving this tab's
   * shot as it is. Returns whether anything changed, which is how two tabs
   * stop answering each other's writes.
   */
  adoptBags(saved) {
    const next = new AppState();
    next.restore(saved);
    const bags = (state) => JSON.stringify([state.flex, state.activeAccount, state.accounts]);
    if (bags(next) === bags(this)) return false;
    for (const key of ['flex', 'activeAccount', 'accounts']) this[key] = $state.snapshot(next[key]);
    this.removed = null;
    return true;
  }
}

/** What toJSON() saves, apart from its version. */
const SAVED_FIELDS = [
  'mode',
  'clubType',
  'windSpeed',
  'powerBall',
  'elevation',
  'distance',
  'flex',
  'activeAccount',
  'accounts'
];

export const app = new AppState();

/** Whether the data an import replaced is kept, so the import can be undone. */
export const undo = $state({ available: false });

/** The undo copy, for when storage refuses to keep it. */
let undoCopy = null;

/**
 * Replaces everything saved with an imported store, keeping what was there
 * for one undo. The copy goes to storage, so it outlives a reload; if storage
 * refuses it, it is kept for this visit only.
 */
export function replaceSaved(saved) {
  undoCopy = JSON.stringify(app.toJSON());
  try {
    localStorage.setItem(UNDO_KEY, undoCopy);
  } catch {
    // Kept in memory instead.
  }
  app.replaceWith(saved);
  undo.available = true;
}

/** Puts back what the last import replaced. Once only. */
export function undoReplace() {
  let copy = undoCopy;
  try {
    copy = localStorage.getItem(UNDO_KEY) ?? copy;
    localStorage.removeItem(UNDO_KEY);
  } catch {
    // Use the copy in memory.
  }
  undoCopy = null;
  undo.available = false;
  if (!copy) return;
  try {
    app.replaceWith(JSON.parse(copy));
  } catch {
    // A damaged copy: nothing to put back.
  }
}

/** Persist across visits. Storage can throw or be empty, so never assume it. */
export function persist() {
  // The current store, else the one from before bags. A corrupt current store
  // falls through to the older one rather than straight to defaults.
  for (const key of [STORAGE_KEY, LEGACY_STORAGE_KEY]) {
    try {
      const saved = localStorage.getItem(key);
      if (!saved) continue;
      app.restore(JSON.parse(saved));
      break;
    } catch {
      // Private mode, blocked storage, or corrupt JSON: try the next, then defaults.
    }
  }

  try {
    undo.available = localStorage.getItem(UNDO_KEY) !== null;
  } catch {
    // No storage, so nothing kept to undo.
  }

  // Another tab saved: take its bags, so an older tab never writes its own
  // bags back over an import or an edit. Each tab keeps its own shot. The
  // write this causes holds the same bags, so the other tab leaves it there.
  addEventListener('storage', (e) => {
    if (e.key === UNDO_KEY) undo.available = e.newValue !== null;
    if (e.key !== STORAGE_KEY || !e.newValue) return;
    try {
      app.adoptBags(JSON.parse(e.newValue));
    } catch {
      // A damaged write from the other tab: keep what this tab has.
    }
  });

  $effect(() => {
    const snapshot = JSON.stringify(app.toJSON());
    try {
      localStorage.setItem(STORAGE_KEY, snapshot);
    } catch {
      // Nothing useful to do if writing fails.
    }
  });
}
