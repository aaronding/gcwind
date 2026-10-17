// The backup file: everything gcwind saves in this browser, as one JSON
// document the player can keep and import elsewhere. Plain data in and plain
// data out, so it is tested without a browser. See docs/backup.md.

import { readBags } from './bags.js';

/** The newest store this build reads; the file carries the store's own version. */
export const BACKUP_VERSION = 2;

/** A backup is a few KB; anything far bigger is not one, and is not read. */
export const MAX_BACKUP_BYTES = 64 * 1024;

/** Wraps the saved store so a gcwind file is told apart from any other JSON. */
export function backupDocument(store, now) {
  return { app: 'gcwind', version: BACKUP_VERSION, exported: now.toISOString(), data: store };
}

/** gcwind-backup-2026-10-16.json, by the player's own calendar. */
export function backupFileName(now) {
  const pad = (n) => String(n).padStart(2, '0');
  const day = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  return `gcwind-backup-${day}.json`;
}

const isRecord = (value) => Boolean(value) && typeof value === 'object' && !Array.isArray(value);

/**
 * Reads a backup file's text. Returns `{ data, exported }`, where `data` is
 * the saved store to restore and `exported` a Date or null, or `{ error }`:
 *
 * - 'foreign': JSON, but not a gcwind backup;
 * - 'damaged': not JSON, or a gcwind backup with parts missing;
 * - 'newer': written by a build with a newer store than this one reads.
 *
 * Only the wrapper is checked here. The store itself goes through the same
 * cleaning as storage when it is restored.
 */
export function readBackup(text) {
  let doc;
  try {
    doc = JSON.parse(text);
  } catch {
    return { error: 'damaged' };
  }

  if (!isRecord(doc) || doc.app !== 'gcwind') return { error: 'foreign' };
  if (!Number.isInteger(doc.version) || doc.version < 1) return { error: 'damaged' };
  if (doc.version > BACKUP_VERSION) return { error: 'newer' };
  // A store with no bags left after cleaning is not worth replacing anything with.
  if (!isRecord(doc.data) || !readBags(doc.data)) return { error: 'damaged' };

  const exported = new Date(doc.exported);
  return { data: doc.data, exported: Number.isNaN(exported.getTime()) ? null : exported };
}
