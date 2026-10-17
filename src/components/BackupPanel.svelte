<script>
  // Export and Import, inside the bag manager. Export saves everything gcwind
  // keeps in this browser to a JSON file; Import reads such a file, shows what
  // it holds and what it replaces, and replaces only on Replace. The last
  // import can be undone. The manager's buttons call exportFile() and
  // chooseFile(); this shows what follows. See docs/backup.md.
  import { tick } from 'svelte';
  import MiniClubs from './MiniClubs.svelte';
  import { app, AppState, replaceSaved, undo, undoReplace } from '../lib/state.svelte.js';
  import { MAX_BACKUP_BYTES, backupDocument, backupFileName, readBackup } from '../lib/backup.js';
  import { bagLabel } from '../lib/bags.js';

  const ERRORS = {
    foreign: [
      'This file is not a gcwind backup.',
      'Choose a file that Export saved, named like gcwind-backup-2026-10-16.json.'
    ],
    damaged: [
      'This file is damaged or incomplete.',
      'Export it again on the other device, then import the new file.'
    ],
    newer: [
      'This backup comes from a newer gcwind.',
      'Reload this page to update gcwind, then import the file again.'
    ],
    large: ['This file is too large to be a gcwind backup.', 'Choose the file that Export saved.'],
    unreadable: ['The file could not be read.', 'Try again, or choose another copy of it.']
  };

  let picker = $state();
  let panel = $state();
  /** @type {null | keyof typeof ERRORS} */
  let error = $state(null);
  /** One line on what just happened: an export, an import or an undo. */
  let status = $state('');
  /** A file that has been read and checked, waiting for Replace or Cancel. */
  let pending = $state(null);

  const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;
  const names = (bags) => bags.map((b) => `“${b.name}”`).join(', ');
  const day = (date) =>
    date?.toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' });

  /** Clears what the last visit to the manager left showing. */
  export function reset() {
    error = null;
    status = '';
    pending = null;
  }

  export function exportFile() {
    reset();
    const now = new Date();
    const name = backupFileName(now);
    const text = `${JSON.stringify(backupDocument(app.toJSON(), now), null, 2)}\n`;
    const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = name;
    document.body.append(link);
    link.click();
    link.remove();
    // Revoked a little later: some browsers start the download after click()
    // returns.
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
    show(`Saved ${name}.`);
  }

  export function chooseFile() {
    picker.click();
  }

  /** Brings what changed into view: the manager's list can push it below the fold. */
  async function show(line = '') {
    status = line;
    await tick();
    panel?.scrollIntoView?.({ block: 'nearest', behavior: 'smooth' });
  }

  async function chosen(e) {
    const file = e.currentTarget.files?.[0];
    // Cleared, so choosing the same file again still counts as a choice.
    e.currentTarget.value = '';
    if (!file) return;

    reset();
    if (file.size > MAX_BACKUP_BYTES) {
      error = 'large';
      return show();
    }

    let text;
    try {
      text = await file.text();
    } catch {
      error = 'unreadable';
      return show();
    }

    const read = readBackup(text);
    if (read.error) {
      error = read.error;
      return show();
    }

    // What the app would hold after the import, checked as storage is.
    const after = new AppState();
    after.replaceWith(read.data);
    pending = {
      data: read.data,
      file: file.name,
      exported: read.exported,
      bags: after.account.bags,
      active: after.account.activeBag,
      same: JSON.stringify(after.toJSON()) === JSON.stringify(app.toJSON())
    };
    show();
  }

  function replace() {
    const file = pending.file;
    replaceSaved(pending.data);
    pending = null;
    show(`Imported ${plural(app.account.bags.length, 'bag')} from ${file}.`);
  }

  function undoImport() {
    reset();
    undoReplace();
    show('Your previous data is back.');
  }
</script>

<input
  bind:this={picker}
  class="visually-hidden"
  type="file"
  accept=".json,application/json"
  tabindex="-1"
  aria-hidden="true"
  data-testid="backup-file"
  onchange={chosen}
/>

<div class="panel" bind:this={panel}>
  {#if pending}
    <div class="confirm" role="alert" data-testid="backup-confirm">
      <p data-testid="backup-source">
        Replace your saved data with <b>{pending.file}</b>{#if pending.exported}, exported {day(
            pending.exported
          )}{/if}? It holds <b>{plural(pending.bags.length, 'bag')}</b>, Flex picks and shot
        settings.
      </p>

      <ol class="bags" aria-label="Bags in the file">
        {#each pending.bags as bag, i (i)}
          <li class="bag" class:active={i === pending.active} data-testid={`backup-bag-${i + 1}`}>
            <span class="num" aria-hidden="true">{i + 1}</span>
            <span class="name">{bagLabel(bag, i)}</span>
            <div class="clubs">
              <MiniClubs selections={bag.selections} label={`Clubs in ${bag.name}`} />
            </div>
          </li>
        {/each}
      </ol>

      {#if pending.same}
        <p>This is the same data you have here. Nothing would change.</p>
      {:else}
        <p data-testid="backup-replaces">
          It replaces your {plural(app.account.bags.length, 'bag')} here ({names(
            app.account.bags
          )}), your Flex picks and shot settings. You can undo it afterwards.
        </p>
      {/if}

      <div class="confirm-actions">
        <button class="chunky compact" data-testid="backup-cancel" onclick={reset}>Cancel</button>
        {#if !pending.same}
          <button class="chunky compact primary" data-testid="backup-replace" onclick={replace}>
            Replace
          </button>
        {/if}
      </div>
    </div>
  {/if}

  {#if error}
    <div class="error" role="alert" data-testid="backup-error">
      <b>{ERRORS[error][0]}</b>
      <span>{ERRORS[error][1]}</span>
    </div>
  {/if}

  {#if status || undo.available}
    <p class="status" role="status">
      {#if status}<span data-testid="backup-status">{status}</span>{/if}
      {#if undo.available}
        <button class="text-button" data-testid="backup-undo" onclick={undoImport}>
          Undo the last import
        </button>
      {/if}
    </p>
  {/if}
</div>

<style>
  .panel {
    display: grid;
    gap: 10px;
  }

  .panel:empty {
    display: none;
  }

  p {
    margin: 0;
  }

  b {
    color: var(--ink);
  }

  .confirm {
    display: grid;
    gap: 10px;
    padding: 12px;
    border-radius: var(--radius-sm);
    background: var(--surface-sunken);
    color: var(--ink);
  }

  .confirm-actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
  }

  .error {
    display: grid;
    gap: 2px;
    padding: 10px 12px;
    border-left: 4px solid var(--danger);
    border-radius: var(--radius-sm);
    background: color-mix(in srgb, var(--danger) 10%, var(--surface));
    color: var(--ink);
  }

  .error b {
    color: var(--danger);
  }

  .status {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px 10px;
    font-size: 13px;
    color: var(--ink-muted);
  }

  .text-button {
    min-height: 36px;
    padding: 0 6px;
    border: none;
    border-radius: var(--radius-sm);
    background: none;
    font-size: 14px;
    font-weight: 700;
    color: var(--accent-ink);
    cursor: pointer;
  }

  .text-button:focus-visible {
    outline: 3px solid var(--green-500);
    outline-offset: 1px;
  }

  .bags {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 6px;
  }

  .bag {
    display: grid;
    grid-template-columns: 30px minmax(0, 1fr);
    align-items: center;
    column-gap: 8px;
    row-gap: 6px;
    padding: 8px;
    border-radius: var(--radius);
    background: var(--surface);
  }

  .num {
    display: grid;
    place-items: center;
    width: 30px;
    height: 30px;
    border-radius: 50%;
    background: var(--surface-sunken);
    color: var(--ink-muted);
    font-family: var(--font-display);
    font-weight: 800;
    font-size: 15px;
  }

  .bag.active .num {
    background: var(--green-500);
    color: var(--on-dark);
  }

  .name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-weight: 700;
  }

  .clubs {
    grid-column: 2;
  }

  /* The pictures sit on the bag's own fill here, so their tiles take the
     sunken one. */
  .clubs :global(.mini li) {
    background: var(--surface-sunken);
  }
</style>
