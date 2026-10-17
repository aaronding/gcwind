<script>
  // Everything about bags except switching, which BagBar does in one tap: each
  // bag's name, Edit and Remove, then Add a bag, and Export and Import of
  // everything saved. Removing asks nothing and offers Undo instead.
  import { tick } from 'svelte';
  import Modal from './Modal.svelte';
  import MiniClubs from './MiniClubs.svelte';
  import BackupPanel from './BackupPanel.svelte';
  import { app } from '../lib/state.svelte.js';
  import { MAX_BAGS, NAME_MAX_LENGTH } from '../lib/bags.js';

  /** `onedit(i)` opens the bag editor on bag i, above this dialog. */
  let { onedit } = $props();

  let dialog = $state();
  let list = $state();
  let backup = $state();

  export function open() {
    reset();
    dialog.showModal();
  }

  /** Clears what the last visit left showing, and the chance to undo it. */
  function reset() {
    app.forgetRemoved();
    backup?.reset();
  }

  function rename(e, i) {
    app.forgetRemoved();
    app.renameBag(i, e.currentTarget.value);
    // Put back the cleaned name, which also restores the default when the
    // field was emptied while the bag already had it.
    e.currentTarget.value = app.account.bags[i].name;
  }

  function edit(i) {
    app.forgetRemoved();
    onedit(i);
  }

  /** Adds a bag and puts the cursor in its name, the first thing to change. */
  async function add() {
    reset();
    app.addBag();
    await tick();
    const field = list?.querySelector(`[data-testid="bag-name-${app.account.bags.length}"]`);
    field?.focus();
    field?.select();
  }
</script>

<Modal bind:dialog testid="bags-dialog" title="Bags">
  <div class="manager">
    <ol class="bags" aria-label={`Bags in ${app.account.name}`} bind:this={list}>
      {#each app.account.bags as bag, i (i)}
        {@const active = i === app.account.activeBag}
        <li class="bag" class:active data-testid={`manage-bag-${i + 1}`}>
          <span class="num" aria-hidden="true">{i + 1}</span>
          <input
            class="bag-name"
            type="text"
            value={bag.name}
            maxlength={NAME_MAX_LENGTH}
            autocomplete="off"
            aria-label={`Name of bag ${i + 1}${active ? ' (in use)' : ''}`}
            data-testid={`bag-name-${i + 1}`}
            onchange={(e) => rename(e, i)}
          />
          <div class="row-actions">
            <button
              class="icon-button"
              title="Edit clubs"
              aria-label={`Edit the clubs in bag ${i + 1}`}
              data-testid={`bag-edit-${i + 1}`}
              onclick={() => edit(i)}
            >
              <svg viewBox="0 0 16 16" aria-hidden="true">
                <path d="M10.5 2.5l3 3L6 13H3v-3z" />
                <path d="M9 4l3 3" />
              </svg>
            </button>
            {#if app.account.bags.length > 1}
              <button
                class="icon-button danger"
                title="Remove"
                aria-label={`Remove bag ${i + 1}`}
                data-testid={`bag-remove-${i + 1}`}
                onclick={() => app.removeBag(i)}
              >
                <svg viewBox="0 0 16 16" aria-hidden="true">
                  <path d="M2.5 4.5h11M6.5 4.5V3h3v1.5M4 4.5l.7 8.5h6.6l.7-8.5M6.8 7v4M9.2 7v4" />
                </svg>
              </button>
            {/if}
          </div>

          <div class="clubs">
            <MiniClubs selections={bag.selections} label={`Clubs in bag ${i + 1}`} />
          </div>
        </li>
      {/each}
    </ol>

    {#if app.removed}
      <p class="removed" role="status" data-testid="bag-removed">
        Removed “{app.removed.name}”.
        <button class="text-button" data-testid="bag-undo-remove" onclick={() => app.undoRemove()}>
          Undo
        </button>
      </p>
    {/if}

    <div class="add">
      {#if app.account.bags.length < MAX_BAGS}
        <button class="chunky compact filled" data-testid="bag-add-manager" onclick={add}>
          Add a bag
        </button>
      {/if}
      <button
        class="chunky compact filled"
        data-testid="backup-export"
        onclick={() => backup.exportFile()}
      >
        Export
      </button>
      <button
        class="chunky compact filled"
        data-testid="backup-import"
        onclick={() => backup.chooseFile()}
      >
        Import
      </button>
    </div>

    <BackupPanel bind:this={backup} />
  </div>
</Modal>

<style>
  .manager {
    /* A fixed width, so a removal or the import summary does not resize the
       dialog under the pointer. */
    width: min(480px, calc(92vw - 36px));
    display: grid;
    gap: 14px;
  }

  .text-button:focus-visible,
  input:focus-visible {
    outline: 3px solid var(--green-500);
    outline-offset: 1px;
  }

  input {
    width: 100%;
    min-height: 40px;
    padding: 0 10px;
    border: 1px solid var(--edge);
    border-radius: var(--radius-sm);
    background: var(--surface-sunken);
    color: var(--ink);
    font: inherit;
    /* 16px stops iOS zooming the page when the field takes focus. */
    font-size: 16px;
  }

  .text-button {
    flex: 0 0 auto;
    min-height: 40px;
    padding: 0 8px;
    border: none;
    border-radius: var(--radius-sm);
    background: none;
    font-size: 14px;
    font-weight: 700;
    color: var(--accent-ink);
    cursor: pointer;
  }

  .text-button.danger {
    color: var(--danger);
  }

  .bags {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 8px;
  }

  .bag {
    display: grid;
    grid-template-columns: 30px minmax(0, 1fr) auto;
    align-items: center;
    column-gap: 8px;
    row-gap: 6px;
    padding: 8px;
    border-radius: var(--radius);
    background: var(--surface-sunken);
  }

  .num {
    display: grid;
    place-items: center;
    width: 30px;
    height: 30px;
    border-radius: 50%;
    background: var(--surface);
    color: var(--ink-muted);
    font-family: var(--font-display);
    font-weight: 800;
    font-size: 15px;
  }

  .bag.active .num {
    background: var(--green-500);
    color: var(--on-dark);
  }

  .bag-name {
    min-height: 36px;
    background: var(--surface);
    font-weight: 600;
  }

  .row-actions {
    display: flex;
  }

  .icon-button {
    display: grid;
    place-items: center;
    width: 40px;
    height: 40px;
    padding: 0;
    border: none;
    border-radius: var(--radius-sm);
    background: none;
    color: var(--accent-ink);
    cursor: pointer;
  }

  .icon-button:hover {
    background: var(--surface);
  }

  .icon-button:focus-visible {
    outline: 3px solid var(--green-500);
    outline-offset: 1px;
  }

  .icon-button.danger {
    color: var(--danger);
  }

  .icon-button svg {
    width: 20px;
    height: 20px;
    fill: none;
    stroke: currentColor;
    stroke-width: 1.5;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  .clubs {
    grid-column: 2 / -1;
  }

  .removed {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px 8px;
    margin: 0;
    color: var(--ink);
  }

  .add {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
  }

  /* On the dialog's own white, a plain .chunky face would read as text. */
  .filled {
    background: var(--surface-sunken);
  }
</style>
