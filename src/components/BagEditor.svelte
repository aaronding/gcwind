<script>
  // Sets up one bag: its name, and the club and level for each type. The cards
  // pick the type; under them are the same club and level pickers Flex uses.
  // Changes apply as they are made, so Done only closes.
  import Modal from './Modal.svelte';
  import BagClubs from './BagClubs.svelte';
  import ClubPicker from './ClubPicker.svelte';
  import LevelPicker from './LevelPicker.svelte';
  import { app } from '../lib/state.svelte.js';
  import { CLUB_TYPES, clubData, clubFor, maxLevelFor } from '../lib/clubs.js';
  import { NAME_MAX_LENGTH, defaultBagName } from '../lib/bags.js';

  let dialog = $state();
  /** Rendered only while open, so its pickers never duplicate the page's test ids. */
  let isOpen = $state(false);
  let index = $state(0);
  let type = $state('drivers');

  const bag = $derived(app.account.bags[index] ?? app.bag);
  const pick = $derived(bag.selections[type]);
  const typeName = $derived(CLUB_TYPES.find((t) => t.key === type)?.name);

  /** Opens on a bag of the active account, at the club type in hand. */
  export function open(bagIndex = app.account.activeBag, clubType = app.clubType) {
    index = bagIndex;
    type = clubType;
    isOpen = true;
    dialog.showModal();
  }

  function rename(e) {
    app.renameBag(index, e.currentTarget.value);
    // Put back the cleaned name, which also restores the default when the
    // field was emptied while the bag already had it.
    e.currentTarget.value = bag.name;
  }

  $effect(() => {
    if (!dialog) return;
    const closed = () => (isOpen = false);
    dialog.addEventListener('close', closed);
    return () => dialog.removeEventListener('close', closed);
  });
</script>

<Modal bind:dialog testid="bag-editor" title={`Edit ${defaultBagName(index)}`}>
  {#if isOpen}
    <div class="editor">
      <label class="field">
        <span class="label">Name</span>
        <input
          type="text"
          value={bag.name}
          maxlength={NAME_MAX_LENGTH}
          autocomplete="off"
          data-testid="bag-editor-name"
          onchange={rename}
        />
      </label>

      <div class="group">
        <span class="label" aria-hidden="true">Clubs</span>
        <BagClubs
          selections={bag.selections}
          selected={type}
          label="Club type to change"
          onselect={(t) => (type = t)}
        />
      </div>

      <div class="group pickers">
        <h3>{typeName}</h3>
        <ClubPicker
          clubs={clubData[type]}
          clubType={type}
          selected={pick.club}
          onselect={(name) => app.setBagClub(index, type, name)}
        />
        <LevelPicker
          max={maxLevelFor(clubFor(type, pick.club)?.type)}
          clubType={type}
          selected={pick.level}
          onselect={(level) => app.setBagLevel(index, type, level)}
        />
      </div>

      <div class="actions">
        <button
          class="chunky compact primary"
          data-testid="bag-editor-done"
          onclick={() => dialog.close()}
        >
          Done
        </button>
      </div>
    </div>
  {/if}
</Modal>

<style>
  .editor {
    width: min(500px, calc(92vw - 36px));
    display: grid;
    gap: 14px;
  }

  .field,
  .group {
    display: grid;
    gap: 6px;
    min-width: 0;
  }

  .label {
    font-size: 13px;
    font-weight: 600;
    color: var(--ink-muted);
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

  input:focus-visible {
    outline: 3px solid var(--green-500);
    outline-offset: 1px;
  }

  .pickers {
    gap: 10px;
    padding: 12px;
    border-radius: var(--radius);
    background: var(--surface-sunken);
  }

  h3 {
    font-size: 15px;
    color: var(--ink);
  }

  .actions {
    display: flex;
    justify-content: flex-end;
  }
</style>
