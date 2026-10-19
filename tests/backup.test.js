import { describe, it, expect, beforeEach } from 'vitest';
import {
  BACKUP_VERSION,
  MAX_BACKUP_BYTES,
  backupDocument,
  backupFileName,
  readBackup
} from '../src/lib/backup.js';
import { AppState, app, replaceSaved, undo, undoReplace } from '../src/lib/state.svelte.js';
import { defaultSelections } from '../src/lib/clubs.js';

const starter = defaultSelections();
const stored = (state) => JSON.parse(JSON.stringify(state.toJSON()));
/** A file's text, as Export writes it. */
const file = (store, now = new Date('2026-10-14T09:30:00Z')) =>
  JSON.stringify(backupDocument(store, now), null, 2);

/** Three bags, Flex and shot settings that differ from the defaults. */
function setUp(state) {
  state.setBagClub(0, 'drivers', 'The Apocalypse');
  state.renameBag(0, 'Tour 10');
  state.addBag();
  state.renameBag(1, 'Approach');
  state.setBagLevel(1, 'wedges', 4);
  state.addBag();
  state.useFlex();
  state.selectClub('Big Topper');
  state.selectLevel(3);
  state.windSpeed = 8.7;
  state.powerBall = 6;
  state.elevation = 20;
  state.distance = 50;
  state.clubType = 'wedges';
  return state;
}

describe('the file', () => {
  it('wraps the saved store with the app, the version and the time', () => {
    const store = stored(new AppState());
    const doc = backupDocument(store, new Date('2026-10-14T09:30:00Z'));
    expect(doc).toEqual({
      app: 'gcwind',
      version: BACKUP_VERSION,
      exported: '2026-10-14T09:30:00.000Z',
      data: store
    });
  });

  it('is named by the local date', () => {
    expect(backupFileName(new Date(2026, 9, 6, 23, 59))).toBe('gcwind-backup-2026-10-06.json');
  });

  it('is a few KB for five bags, far below what import accepts', () => {
    const state = setUp(new AppState());
    state.addBag();
    state.addBag();
    expect(state.account.bags).toHaveLength(5);
    expect(file(stored(state)).length).toBeLessThan(MAX_BACKUP_BYTES / 8);
  });
});

describe('reading a file', () => {
  it('gives back the store and when it was exported', () => {
    const store = stored(setUp(new AppState()));
    const read = readBackup(file(store));
    expect(read.data).toEqual(store);
    expect(read.exported.toISOString()).toBe('2026-10-14T09:30:00.000Z');
  });

  it('accepts a file without a readable export time', () => {
    const doc = { app: 'gcwind', version: 2, exported: 'soon', data: stored(new AppState()) };
    expect(readBackup(JSON.stringify(doc)).exported).toBeNull();
  });

  it('accepts a store from before bags, which restore migrates', () => {
    const doc = {
      app: 'gcwind',
      version: 1,
      data: { selections: { drivers: { club: 'Big Topper', level: 5 } } }
    };
    const read = readBackup(JSON.stringify(doc));
    const state = new AppState();
    state.replaceWith(read.data);
    expect(state.account.bags[0].selections.drivers).toEqual({ club: 'Big Topper', level: 5 });
  });

  it.each([
    ['text that is not JSON', 'Tour 10: Apocalypse 7', 'damaged'],
    ['a file cut short', file(stored(new AppState())).slice(0, 200), 'damaged'],
    ['JSON from another app', JSON.stringify({ name: 'notes', items: [] }), 'foreign'],
    ['a JSON list', '[1, 2, 3]', 'foreign'],
    ['plain JSON null', 'null', 'foreign'],
    ['a gcwind file with no version', JSON.stringify({ app: 'gcwind', data: {} }), 'damaged'],
    ['a gcwind file with no data', JSON.stringify({ app: 'gcwind', version: 2 }), 'damaged'],
    [
      'a gcwind file with no bags',
      JSON.stringify({ app: 'gcwind', version: 2, data: { windSpeed: 5 } }),
      'damaged'
    ],
    [
      'a file from a newer gcwind',
      JSON.stringify({ app: 'gcwind', version: BACKUP_VERSION + 1, data: {} }),
      'newer'
    ]
  ])('refuses %s', (_, text, error) => {
    expect(readBackup(text)).toEqual({ error });
  });
});

describe('replacing everything with a backup', () => {
  it('round-trips every saved field through the file', () => {
    const before = setUp(new AppState());
    const after = new AppState();
    after.replaceWith(readBackup(file(stored(before))).data);
    expect(stored(after)).toEqual(stored(before));
  });

  it('replaces fields the backup has at their defaults, rather than keeping the current ones', () => {
    const state = setUp(new AppState());
    state.replaceWith(stored(new AppState()));
    expect(stored(state)).toEqual(stored(new AppState()));
  });

  it('cleans the backup as storage is cleaned', () => {
    const state = new AppState();
    state.replaceWith({
      version: 2,
      mode: 'warp',
      windSpeed: 'gusty',
      accounts: [
        {
          name: 'Account 1',
          activeBag: 9,
          bags: [
            { name: '  Tour   10  ', selections: { drivers: { club: 'Golden Rocket', level: 3 } } },
            { name: 'x'.repeat(40), selections: { drivers: { club: 'Big Topper', level: 99 } } }
          ]
        }
      ]
    });
    expect(state.mode).toBe('bag');
    expect(state.windSpeed).toBe(10);
    expect(state.account.activeBag).toBe(0);
    expect(state.account.bags[0]).toEqual({ name: 'Tour 10', selections: starter });
    expect(state.account.bags[1].name).toHaveLength(24);
    expect(state.account.bags[1].selections.drivers).toEqual({ club: 'Big Topper', level: 8 });
  });

  it('keeps every account a backup holds, up to the limit', () => {
    const accounts = ['A', 'B', 'C', 'D'].map((name) => ({ name, bags: [{ name: 'Bag 1' }] }));
    const state = new AppState();
    state.replaceWith({ version: 2, activeAccount: 2, accounts });
    expect(state.accounts.map((a) => a.name)).toEqual(['A', 'B', 'C']);
    expect(state.activeAccount).toBe(2);
  });
});

describe('another tab saving', () => {
  it('takes its bags and Flex picks, and keeps this tab’s shot', () => {
    const other = setUp(new AppState());
    const state = new AppState();
    state.windSpeed = 3.2;

    expect(state.adoptBags(stored(other))).toBe(true);
    expect(state.account.bags).toEqual(other.account.bags);
    expect(state.flex).toEqual(other.flex);
    expect(state.windSpeed).toBe(3.2);
    expect(state.mode).toBe('bag');
  });

  it('does nothing when the bags are the same, so two tabs stop answering each other', () => {
    const other = setUp(new AppState());
    const state = new AppState();
    state.adoptBags(stored(other));

    other.windSpeed = 20;
    expect(state.adoptBags(stored(other))).toBe(false);
  });
});

describe('undo', () => {
  beforeEach(() => {
    app.replaceWith(stored(new AppState()));
    undo.available = false;
  });

  it('puts back what an import replaced, once', () => {
    setUp(app);
    const before = stored(app);

    replaceSaved(stored(new AppState()));
    expect(app.account.bags).toHaveLength(2);
    expect(undo.available).toBe(true);

    undoReplace();
    expect(stored(app)).toEqual(before);
    expect(undo.available).toBe(false);

    undoReplace();
    expect(stored(app)).toEqual(before);
  });
});
