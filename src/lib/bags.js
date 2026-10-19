// Bags and accounts: what is stored and how it is checked.
//
// Golf Clash lets a player keep up to five bags, and many players keep more
// than one account. An account here holds the bags its player uses, one to
// five, numbered in order. Each bag is one selections map (club type →
// { club, level }), the same shape the app has always kept for its single set
// of picks. Everything here is plain data in and plain data out, so storage and
// the tests go through the same checks, as the backup code will later
// (docs/modes-and-bags.md).

import { cleanSelections, defaultSelections } from './clubs.js';

export const MAX_BAGS = 5;
/**
 * The account limit. Storage already keeps up to this many; adding and
 * switching accounts comes in step 3 (docs/modes-and-bags.md).
 */
export const MAX_ACCOUNTS = 3;
export const NAME_MAX_LENGTH = 24;

export const defaultBagName = (index) => `Bag ${index + 1}`;
export const defaultAccountName = (index) => `Account ${index + 1}`;

/** "Bag 2: Approach", or just "Bag 2" while it has its default name. */
export const bagLabel = (bag, index) =>
  bag.name === defaultBagName(index) ? bag.name : `${defaultBagName(index)}: ${bag.name}`;

export function newBag(index, selections = defaultSelections()) {
  return { name: defaultBagName(index), selections };
}

const pick = (club, level) => ({ club, level });

/**
 * What a new player starts with: two bags that differ only in the driver and
 * the wood, so a player edits them into their own rather than building from
 * the first club of each type.
 */
export function starterBags() {
  const shared = {
    longirons: pick('The B52', 8),
    shortirons: pick('The Thorn', 9),
    wedges: pick('The Endbringer', 8),
    roughirons: pick('Nirvana', 9),
    sandwedges: pick('Spitfire', 8)
  };
  return [
    { drivers: pick('The Apocalypse', 8), woods: pick('The Sniper', 10), ...shared },
    { drivers: pick("Thor's Hammer", 8), woods: pick('The Cataclysm', 8), ...shared }
  ].map((selections, i) => newBag(i, cleanSelections(selections)));
}

/** A new account starts with the two starter bags; the player adds the rest as needed. */
export function newAccount(name) {
  return { name, activeBag: 0, bags: starterBags() };
}

/** One line of printable text, trimmed and capped; the fallback when nothing is left. */
export function cleanName(value, fallback) {
  if (typeof value !== 'string') return fallback;
  const name = value
    .replace(/\p{Cc}/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  // Array.from counts characters rather than UTF-16 units, so the cap never
  // splits an emoji in half.
  return Array.from(name).slice(0, NAME_MAX_LENGTH).join('') || fallback;
}

export function cleanIndex(value, length) {
  return Number.isInteger(value) && value >= 0 && value < length ? value : 0;
}

const isRecord = (value) => Boolean(value) && typeof value === 'object' && !Array.isArray(value);

/**
 * Up to MAX_ACCOUNTS accounts of one to MAX_BAGS bags each. Extra accounts and
 * bags are dropped, an account with no bags gets one, and every bag goes
 * through cleanSelections. Empty when nothing usable is left.
 */
export function cleanAccounts(saved) {
  if (!Array.isArray(saved)) return [];

  return saved
    .filter(isRecord)
    .slice(0, MAX_ACCOUNTS)
    .map((account, i) => {
      const kept = Array.isArray(account.bags) ? account.bags.slice(0, MAX_BAGS) : [];
      // An entry that is not a bag still holds its place, so the bags after it
      // keep their numbers.
      const bags = (kept.length ? kept : [{}]).map((bag, j) => ({
        name: cleanName(bag?.name, defaultBagName(j)),
        selections: cleanSelections(bag?.selections)
      }));
      return {
        name: cleanName(account.name, defaultAccountName(i)),
        activeBag: cleanIndex(account.activeBag, bags.length),
        bags
      };
    });
}

/**
 * The single set of picks from v1 becomes Account 1's only bag. Adding a bag
 * copies the clubs in use, so a second bag starts from these too.
 */
export function migrateSelections(selections) {
  return {
    activeAccount: 0,
    accounts: [
      { name: defaultAccountName(0), activeBag: 0, bags: [newBag(0, cleanSelections(selections))] }
    ]
  };
}

/** Bags from a saved v2 store, or migrated from a v1 one; null when there are none. */
export function readBags(saved) {
  if (!isRecord(saved)) return null;

  const accounts = cleanAccounts(saved.accounts);
  if (accounts.length) {
    return { activeAccount: cleanIndex(saved.activeAccount, accounts.length), accounts };
  }

  if (isRecord(saved.selections)) return migrateSelections(saved.selections);
  return null;
}
