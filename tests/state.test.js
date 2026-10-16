import { describe, it, expect, beforeEach } from 'vitest';
import { AppState } from '../src/lib/state.svelte.js';
import { defaultSelections } from '../src/lib/clubs.js';

const starter = defaultSelections();

/** A round trip through JSON, as storage does it. */
const stored = (state) => JSON.parse(JSON.stringify(state.toJSON()));

/** Adds bags until the account has `count`, then goes back to the first. */
function withBags(state, count) {
  while (state.account.bags.length < count) state.addBag();
  state.switchBag(0);
}

let state;

beforeEach(() => {
  state = new AppState();
});

describe('a first visit', () => {
  it('opens on the only bag of one account, with starter clubs', () => {
    expect(state.mode).toBe('bag');
    expect(state.accounts).toHaveLength(1);
    expect(state.account.name).toBe('Account 1');
    expect(state.account.activeBag).toBe(0);
    expect(state.account.bags).toEqual([{ name: 'Bag 1', selections: starter }]);
  });

  it('gives the same rings as before bags: the first driver at its top level', () => {
    expect(state.club.name).toBe('The Rocket');
    expect(state.level).toBe(10);
    expect(state.rings.current).toBe(8.3);
  });
});

describe('Flex', () => {
  it('plays from the bag, or from the Flex picks', () => {
    state.setBagClub(0, 'drivers', 'The Apocalypse');
    expect(state.club.name).toBe('The Apocalypse');

    state.useFlex();
    expect(state.mode).toBe('flex');
    expect(state.club.name).toBe('The Rocket');
  });

  it('keeps its picks apart from the bags, and a bag takes over again when chosen', () => {
    state.useFlex();
    state.selectClub('Big Topper');
    state.selectLevel(5);

    expect(state.flex.drivers).toEqual({ club: 'Big Topper', level: 5 });
    expect(state.account.bags[0].selections).toEqual(starter);

    state.switchBag(0);
    expect(state.mode).toBe('bag');
    expect(state.club.name).toBe('The Rocket');
  });

  it('shares the club type in hand and the shot settings with the bags', () => {
    state.clubType = 'wedges';
    state.windSpeed = 12.5;
    state.useFlex();
    expect(state.clubType).toBe('wedges');
    expect(state.windSpeed).toBe(12.5);
  });
});

describe('bags', () => {
  it('switching bags swaps every club and the rings follow', () => {
    withBags(state, 2);
    state.setBagClub(1, 'drivers', 'The Apocalypse');
    state.setBagLevel(1, 'drivers', 3);
    const before = state.rings.current;

    state.switchBag(1);
    expect(state.club.name).toBe('The Apocalypse');
    expect(state.level).toBe(3);
    expect(state.rings.current).not.toBe(before);

    state.switchBag(0);
    expect(state.club.name).toBe('The Rocket');
    expect(state.rings.current).toBe(before);
  });

  it('edits a bag that is not in use without touching the one that is', () => {
    withBags(state, 4);
    state.setBagClub(3, 'woods', 'The Viper');
    expect(state.account.bags[3].selections.woods.club).toBe('The Viper');
    expect(state.bag.selections.woods).toEqual(starter.woods);
  });

  it('ignores a bag number that does not exist', () => {
    withBags(state, 2);
    for (const index of [-1, 2, 5, 1.5, '1']) state.switchBag(index);
    expect(state.account.activeBag).toBe(0);
  });

  it('copies clubs but not the name, and the copy is independent', () => {
    withBags(state, 4);
    state.renameBag(0, 'Main');
    state.setBagClub(0, 'drivers', 'The Apocalypse');
    state.copyBag(0, 3);

    expect(state.account.bags[3].name).toBe('Bag 4');
    expect(state.account.bags[3].selections.drivers.club).toBe('The Apocalypse');

    state.setBagLevel(0, 'drivers', 2);
    expect(state.account.bags[3].selections.drivers.level).toBe(8);
  });

  it('ignores a copy onto itself or out of range', () => {
    withBags(state, 2);
    state.setBagClub(0, 'drivers', 'The Apocalypse');
    state.copyBag(0, 0);
    state.copyBag(0, 7);
    state.copyBag(9, 1);
    expect(state.account.bags[1].selections).toEqual(starter);
  });

  it('resets a bag to the starter clubs and keeps its name', () => {
    withBags(state, 3);
    state.renameBag(2, 'Windy days');
    state.setBagClub(2, 'wedges', 'The Firefly');
    state.resetBag(2);
    expect(state.account.bags[2]).toEqual({ name: 'Windy days', selections: starter });
  });

  it('cleans names, and an empty name brings back the default', () => {
    withBags(state, 2);
    state.renameBag(1, '  Approach\n');
    expect(state.account.bags[1].name).toBe('Approach');
    state.renameBag(1, '   ');
    expect(state.account.bags[1].name).toBe('Bag 2');
  });
});

describe('adding and removing bags', () => {
  it('adds a bag holding a copy of the clubs in use, and plays from it', () => {
    state.setBagClub(0, 'drivers', 'The Apocalypse');
    state.addBag();

    const [first, second] = state.account.bags;
    expect(second.name).toBe('Bag 2');
    expect(second.selections).toEqual(first.selections);
    expect(state.account.activeBag).toBe(1);

    // A copy, not the same clubs: changing one leaves the other.
    state.setBagLevel(1, 'drivers', 2);
    expect(first.selections.drivers.level).toBe(8);
  });

  it('adds from Flex with the Flex picks, and plays from the new bag', () => {
    state.useFlex();
    state.selectClub('Big Topper');
    state.addBag();

    expect(state.mode).toBe('bag');
    expect(state.account.bags[1].selections.drivers.club).toBe('Big Topper');
    expect(state.club.name).toBe('Big Topper');
  });

  it('stops at five bags', () => {
    for (let i = 0; i < 7; i++) state.addBag();
    expect(state.account.bags.map((b) => b.name)).toEqual([
      'Bag 1',
      'Bag 2',
      'Bag 3',
      'Bag 4',
      'Bag 5'
    ]);
  });

  it('moves the later bags up a number, and default names move with them', () => {
    withBags(state, 4);
    state.renameBag(2, 'Windy');
    state.removeBag(1);
    expect(state.account.bags.map((b) => b.name)).toEqual(['Bag 1', 'Windy', 'Bag 3']);
  });

  it('keeps playing the same bag when another one is removed', () => {
    withBags(state, 3);
    state.setBagClub(2, 'drivers', 'The Apocalypse');
    state.switchBag(2);
    state.removeBag(0);

    expect(state.account.activeBag).toBe(1);
    expect(state.club.name).toBe('The Apocalypse');
  });

  it('switches to the bag before when the one in use is removed', () => {
    withBags(state, 3);
    state.switchBag(2);
    state.removeBag(2);
    expect(state.account.activeBag).toBe(1);

    state.switchBag(0);
    state.removeBag(0);
    expect(state.account.activeBag).toBe(0);
  });

  it('never removes the only bag, nor one that does not exist', () => {
    state.removeBag(0);
    withBags(state, 2);
    for (const index of [-1, 2, 1.5, '1']) state.removeBag(index);
    expect(state.account.bags).toHaveLength(2);
  });
});

describe('restore', () => {
  it('migrates v1: the picks become the only bag and Flex, and the settings stay', () => {
    const v1 = {
      clubType: 'woods',
      windSpeed: 14.2,
      powerBall: 6,
      elevation: 20,
      distance: 50,
      selections: {
        drivers: { club: 'The Apocalypse', level: 3 },
        woods: { club: 'The Big Dawg', level: 7 }
      }
    };
    state.restore(v1);

    const expected = { ...starter, ...v1.selections };
    expect(state.mode).toBe('bag');
    expect(state.flex).toEqual(expected);
    expect(state.account.bags).toEqual([{ name: 'Bag 1', selections: expected }]);
    expect(state.clubType).toBe('woods');
    expect(state.windSpeed).toBe(14.2);
    expect(state.powerBall).toBe(6);
    expect(state.elevation).toBe(20);
    expect(state.distance).toBe(50);
    expect(state.club.name).toBe('The Big Dawg');
  });

  it('round-trips everything through storage', () => {
    state.useFlex();
    state.selectClub('The Extra Mile');
    withBags(state, 3);
    state.switchBag(2);
    state.renameBag(2, 'Windy days');
    state.setBagClub(2, 'longirons', 'The Goliath');
    state.setBagLevel(2, 'longirons', 4);
    state.clubType = 'longirons';
    state.elevation = 30;

    const saved = stored(state);
    expect(saved.version).toBe(2);

    const reloaded = new AppState();
    reloaded.restore(saved);
    expect(stored(reloaded)).toEqual(saved);
  });

  it('remembers Flex', () => {
    state.useFlex();
    const reloaded = new AppState();
    reloaded.restore(stored(state));
    expect(reloaded.mode).toBe('flex');
  });

  it('opens on a bag for a mode it does not know', () => {
    for (const mode of ['tour', 'checkpoint', 'tournament', 3, null]) {
      const reloaded = new AppState();
      reloaded.restore({ ...stored(state), mode });
      expect(reloaded.mode, `mode ${mode}`).toBe('bag');
    }
  });

  it('keeps defaults for values it cannot use', () => {
    state.restore({
      mode: {},
      clubType: 'putters',
      windSpeed: 'gusty',
      powerBall: 11,
      elevation: 7,
      distance: null,
      flex: 'none',
      activeAccount: 4,
      accounts: 'many'
    });
    expect(stored(state)).toEqual(stored(new AppState()));
  });

  it('keeps the accounts storage holds, up to the limit, and the active one', () => {
    const second = { name: 'Alt', activeBag: 1, bags: [{}, {}] };
    state.restore({ activeAccount: 1, accounts: [{ name: 'Main', bags: [] }, second] });
    expect(state.accounts.map((a) => a.name)).toEqual(['Main', 'Alt']);
    expect(state.account.name).toBe('Alt');
    expect(state.account.activeBag).toBe(1);
  });
});
