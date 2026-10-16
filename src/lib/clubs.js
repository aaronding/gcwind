// The club data and the rules read straight from it. Plain JavaScript, with no
// runes, so the storage code built on it can be unit tested on its own.

import clubData from './clubs.json';

export { clubData };

/** `label` fits a tab; `name` is the full name, for screen readers and headings. */
export const CLUB_TYPES = [
  { key: 'drivers', label: 'Driver', name: 'Driver' },
  { key: 'woods', label: 'Wood', name: 'Wood' },
  { key: 'longirons', label: 'Long', name: 'Long iron' },
  { key: 'shortirons', label: 'Short', name: 'Short iron' },
  { key: 'wedges', label: 'Wedge', name: 'Wedge' },
  { key: 'roughirons', label: 'Rough', name: 'Rough iron' },
  { key: 'sandwedges', label: 'Sand', name: 'Sand wedge' }
];

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

/** The first club of each type at its top level: what a new bag holds. */
export function defaultSelections() {
  return Object.fromEntries(
    CLUB_TYPES.map(({ key }) => {
      const club = clubData[key][0];
      return [key, { club: club.name, level: maxLevelFor(club.type) }];
    })
  );
}

/**
 * Only adopts selections that still exist, so stale or edited storage cannot
 * leave the app pointing at a club that is no longer in the data. Anything
 * unusable falls back to that type's default; levels are clamped to the club.
 */
export function cleanSelections(saved) {
  const merged = defaultSelections();
  if (!saved || typeof saved !== 'object') return merged;

  for (const { key } of CLUB_TYPES) {
    const entry = saved[key];
    const club = clubData[key].find((c) => c.name === entry?.club);
    if (!club) continue;
    const level = Number(entry.level);
    if (!Number.isInteger(level) || level < 1) continue;
    merged[key] = { club: club.name, level: Math.min(level, maxLevelFor(club.type)) };
  }

  return merged;
}

/** The club a selection names, or undefined when it is not in the data. */
export function clubFor(type, name) {
  return clubData[type]?.find((c) => c.name === name);
}

/**
 * The selections with `type` switched to the named club, keeping the level
 * where the new club allows it. Unchanged when the club is not of that type.
 */
export function withClub(selections, type, name) {
  const club = clubFor(type, name);
  if (!club) return selections;
  const level = Math.min(selections[type].level, maxLevelFor(club.type));
  return { ...selections, [type]: { club: club.name, level } };
}

/** The selections with `type` at `level`, clamped to what its club allows. */
export function withLevel(selections, type, level) {
  const club = clubFor(type, selections[type].club);
  if (!club || !Number.isInteger(level) || level < 1) return selections;
  return {
    ...selections,
    [type]: { ...selections[type], level: Math.min(level, maxLevelFor(club.type)) }
  };
}
