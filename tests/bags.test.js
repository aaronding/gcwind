import { describe, it, expect } from 'vitest';
import {
  MAX_ACCOUNTS,
  MAX_BAGS,
  NAME_MAX_LENGTH,
  bagLabel,
  cleanAccounts,
  cleanName,
  migrateSelections,
  newAccount,
  readBags
} from '../src/lib/bags.js';
import {
  CLUB_TYPES,
  cleanSelections,
  defaultSelections,
  withClub,
  withLevel
} from '../src/lib/clubs.js';

// What v1 saved under gcwind:v1: one club and level per type.
const V1_PICKS = {
  drivers: { club: 'The Apocalypse', level: 3 },
  woods: { club: 'The Big Dawg', level: 7 },
  wedges: { club: 'The Firefly', level: 6 }
};

const starter = defaultSelections();

/** A well-formed v2 account of five bags, each with its driver at a different level. */
function account(name = 'Main') {
  return {
    name,
    activeBag: 2,
    bags: Array.from({ length: MAX_BAGS }, (_, i) => ({
      name: `Bag ${i + 1}`,
      selections: { ...starter, drivers: { club: 'The Rocket', level: i + 1 } }
    }))
  };
}

describe('starter clubs', () => {
  it('are the first club of each type at its top level', () => {
    expect(starter).toEqual({
      drivers: { club: 'The Rocket', level: 10 },
      woods: { club: 'The Horizon', level: 8 },
      longirons: { club: 'The Grim Reaper', level: 8 },
      shortirons: { club: 'The Apache', level: 9 },
      wedges: { club: 'The Dart', level: 10 },
      roughirons: { club: 'The Roughcutter', level: 9 },
      sandwedges: { club: 'The Castaway', level: 8 }
    });
  });
});

describe('a new account', () => {
  it('starts with one bag of starter clubs; the player adds the rest', () => {
    expect(newAccount('Main')).toEqual({
      name: 'Main',
      activeBag: 0,
      bags: [{ name: 'Bag 1', selections: starter }]
    });
  });
});

describe('migration from v1', () => {
  const { activeAccount, accounts } = migrateSelections(V1_PICKS);

  it('makes one account, named by default, on its first bag', () => {
    expect(activeAccount).toBe(0);
    expect(accounts).toHaveLength(1);
    expect(accounts[0].name).toBe('Account 1');
    expect(accounts[0].activeBag).toBe(0);
  });

  it('puts the v1 picks in a single bag with the default name', () => {
    expect(accounts[0].bags).toEqual([{ name: 'Bag 1', selections: { ...starter, ...V1_PICKS } }]);
  });

  it('checks the picks the way storage always has', () => {
    const migrated = migrateSelections({
      drivers: { club: 'No Such Club', level: 5 },
      woods: { club: 'The Horizon', level: 10 }
    });
    const { selections } = migrated.accounts[0].bags[0];
    expect(selections.drivers).toEqual(starter.drivers);
    // The Horizon is Epic, so it stops at 8.
    expect(selections.woods).toEqual({ club: 'The Horizon', level: 8 });
  });
});

describe('readBags', () => {
  it('reads a v2 store', () => {
    const bags = readBags({ activeAccount: 0, accounts: [account()] });
    expect(bags.activeAccount).toBe(0);
    expect(bags.accounts[0].name).toBe('Main');
    expect(bags.accounts[0].activeBag).toBe(2);
    expect(bags.accounts[0].bags[3].selections.drivers.level).toBe(4);
  });

  it('migrates a v1 store', () => {
    const bags = readBags({ clubType: 'woods', windSpeed: 12, selections: V1_PICKS });
    expect(bags.accounts[0].bags).toHaveLength(1);
    expect(bags.accounts[0].bags[0].selections.drivers).toEqual(V1_PICKS.drivers);
  });

  it('uses the accounts when a store has both, rather than migrating again', () => {
    const bags = readBags({ accounts: [account()], selections: V1_PICKS });
    expect(bags.accounts[0].bags[0].selections.drivers).toEqual({ club: 'The Rocket', level: 1 });
  });

  it.each([
    ['null', null],
    ['a string', 'gcwind'],
    ['a number', 42],
    ['an array', [account()]],
    ['an empty object', {}],
    ['no accounts', { accounts: [] }],
    ['accounts that are not a list', { accounts: { 0: account() } }],
    ['accounts that are not objects', { accounts: [null, 5, 'Main', [account()]] }],
    ['selections that are not an object', { selections: 'drivers' }]
  ])('finds nothing in %s', (_, saved) => {
    expect(readBags(saved)).toBeNull();
  });

  it('falls back to the first account when the active one is out of range', () => {
    for (const activeAccount of [-1, 1, 2.5, '0', null]) {
      expect(readBags({ activeAccount, accounts: [account()] }).activeAccount).toBe(0);
    }
  });
});

describe('cleanAccounts', () => {
  it(`keeps at most ${MAX_ACCOUNTS} accounts`, () => {
    const saved = Array.from({ length: MAX_ACCOUNTS + 2 }, (_, i) => account(`A${i}`));
    const accounts = cleanAccounts(saved);
    expect(accounts.map((a) => a.name)).toEqual(['A0', 'A1', 'A2']);
  });

  it('skips entries that are not accounts before counting', () => {
    const accounts = cleanAccounts([null, 'x', 7, account('Real')]);
    expect(accounts.map((a) => a.name)).toEqual(['Real']);
  });

  it(`keeps at most ${MAX_BAGS} bags, dropping extras`, () => {
    const saved = account();
    saved.bags.push({ name: 'Bag 6', selections: starter }, { name: 'Bag 7', selections: starter });
    const [cleaned] = cleanAccounts([saved]);
    expect(cleaned.bags.map((b) => b.name)).toEqual(['Bag 1', 'Bag 2', 'Bag 3', 'Bag 4', 'Bag 5']);
  });

  it('keeps fewer bags as they are, rather than filling them up', () => {
    const [cleaned] = cleanAccounts([{ name: 'Main', bags: account().bags.slice(0, 2) }]);
    expect(cleaned.bags).toHaveLength(2);
    expect(cleaned.bags[1].selections.drivers.level).toBe(2);
  });

  it('gives an account without bags one bag of starter clubs', () => {
    for (const bags of [undefined, null, 'bags', { 0: {} }, []]) {
      const [cleaned] = cleanAccounts([{ name: 'Main', bags }]);
      expect(cleaned.bags, `bags ${JSON.stringify(bags)}`).toEqual([
        { name: 'Bag 1', selections: starter }
      ]);
    }
  });

  it('falls back to the starter club for a club that is not in the data', () => {
    const saved = account();
    saved.bags[0].selections = {
      ...starter,
      drivers: { club: 'The Retired Driver', level: 5 },
      // A real club under the wrong type is just as unknown.
      woods: { club: 'The Rocket', level: 5 }
    };
    const { selections } = cleanAccounts([saved])[0].bags[0];
    expect(selections.drivers).toEqual(starter.drivers);
    expect(selections.woods).toEqual(starter.woods);
  });

  it('clamps levels to what the club can reach', () => {
    const saved = account();
    saved.bags[0].selections = {
      ...starter,
      drivers: { club: 'The Apocalypse', level: 10 }, // Epic: 8
      woods: { club: 'The Big Dawg', level: 99 }, // Rare: 9
      wedges: { club: 'The Dart', level: 10 } // Common: 10
    };
    const { selections } = cleanAccounts([saved])[0].bags[0];
    expect(selections.drivers.level).toBe(8);
    expect(selections.woods.level).toBe(9);
    expect(selections.wedges.level).toBe(10);
  });

  it('falls back for a level that is not a whole number from 1', () => {
    for (const level of [0, -3, 2.5, 'seven', null, undefined, NaN]) {
      const saved = account();
      saved.bags[0].selections = { ...starter, drivers: { club: 'The Apocalypse', level } };
      const { selections } = cleanAccounts([saved])[0].bags[0];
      expect(selections.drivers, `level ${level}`).toEqual(starter.drivers);
    }
  });

  it('falls back to the first bag when the active one is out of range', () => {
    for (const activeBag of [-1, 5, 1.5, '2', null]) {
      const [cleaned] = cleanAccounts([{ ...account(), activeBag }]);
      expect(cleaned.activeBag, `activeBag ${activeBag}`).toBe(0);
    }
    // In range for five bags, but this account has two.
    const [cleaned] = cleanAccounts([{ name: 'Main', activeBag: 3, bags: [{}, {}] }]);
    expect(cleaned.activeBag).toBe(0);
  });

  it('names accounts and bags by position when their names are unusable', () => {
    const saved = account('   ');
    saved.bags[1].name = 42;
    saved.bags[2].name = '';
    const [cleaned] = cleanAccounts([saved]);
    expect(cleaned.name).toBe('Account 1');
    expect(cleaned.bags[1].name).toBe('Bag 2');
    expect(cleaned.bags[2].name).toBe('Bag 3');
  });

  it('turns entries that are not bags into starter bags, keeping every number', () => {
    const saved = account();
    saved.bags = [null, 'Bag', 5, [], { selections: 'none' }];
    const [cleaned] = cleanAccounts([saved]);
    expect(cleaned.bags).toHaveLength(5);
    cleaned.bags.forEach((bag, i) =>
      expect(bag).toEqual({ name: `Bag ${i + 1}`, selections: starter })
    );
  });
});

describe('cleanName', () => {
  it('trims, joins whitespace and drops control characters', () => {
    expect(cleanName('  Windy\n\tdays\u0000 ', 'Bag 1')).toBe('Windy days');
  });

  it(`stops at ${NAME_MAX_LENGTH} characters without splitting an emoji`, () => {
    // 🎯 is two UTF-16 units, so a cap by .length would cut the last one in half.
    const name = cleanName('🎯'.repeat(30), 'Bag 1');
    expect(Array.from(name)).toHaveLength(NAME_MAX_LENGTH);
    expect(name).toBe('🎯'.repeat(NAME_MAX_LENGTH));
  });

  it('falls back when nothing is left', () => {
    for (const value of ['', '   ', '\u0007', undefined, null, 5, {}]) {
      expect(cleanName(value, 'Bag 3')).toBe('Bag 3');
    }
  });
});

describe('bagLabel', () => {
  it('adds the name only when it is not the default', () => {
    expect(bagLabel({ name: 'Bag 2' }, 1)).toBe('Bag 2');
    expect(bagLabel({ name: 'Approach' }, 1)).toBe('Bag 2: Approach');
  });
});

describe('editing a club', () => {
  it('keeps the level when switching clubs, unless the new club stops lower', () => {
    const atNine = withLevel(starter, 'drivers', 9);
    expect(withClub(atNine, 'drivers', 'The Extra Mile').drivers).toEqual({
      club: 'The Extra Mile',
      level: 9
    });
    expect(withClub(atNine, 'drivers', 'The Apocalypse').drivers).toEqual({
      club: 'The Apocalypse',
      level: 8
    });
  });

  it('ignores a club that is not of that type', () => {
    expect(withClub(starter, 'drivers', 'The Firefly')).toBe(starter);
    expect(withClub(starter, 'drivers', 'Nope')).toBe(starter);
  });

  it('clamps a level to the club and ignores one that is not a level', () => {
    expect(withLevel(starter, 'woods', 10).woods.level).toBe(8);
    for (const level of [0, 2.5, '3', null]) {
      expect(withLevel(starter, 'woods', level)).toBe(starter);
    }
  });

  it('leaves the other types alone', () => {
    const changed = withClub(starter, 'wedges', 'The Firefly');
    for (const { key } of CLUB_TYPES.filter((t) => t.key !== 'wedges')) {
      expect(changed[key]).toBe(starter[key]);
    }
  });
});

describe('cleanSelections', () => {
  it('starts from the starter clubs for anything missing', () => {
    expect(cleanSelections(undefined)).toEqual(starter);
    expect(cleanSelections({ drivers: { club: 'The Rock', level: 4 } })).toEqual({
      ...starter,
      drivers: { club: 'The Rock', level: 4 }
    });
  });
});
