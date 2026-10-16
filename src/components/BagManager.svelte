<script>
  // Everything about bags except switching, which BagBar does in one tap: each
  // bag's name, and Edit clubs, Copy to, Reset and Remove, then Add a bag.
  import { tick } from 'svelte';
  import Modal from './Modal.svelte';
  import { app, CLUB_TYPES } from '../lib/state.svelte.js';
  import { clubFor } from '../lib/clubs.js';
  import { MAX_BAGS, NAME_MAX_LENGTH, bagLabel } from '../lib/bags.js';

  /** `onedit(i)` opens the bag editor on bag i, above this dialog. */
  let { onedit } = $props();

  let dialog = $state();
  /** The bag whose actions are showing. */
  let expanded = $state(null);
  let copyTarget = $state(1);
  /** @type {null | { kind: 'copy', from: number, to: number } | { kind: 'reset' | 'remove', bag: number }} */
  let confirming = $state(null);
  let list = $state();

  export function open() {
    reset();
    dialog.showModal();
  }

  function reset() {
    expanded = null;
    confirming = null;
  }

  function toggle(i) {
    confirming = null;
    expanded = expanded === i ? null : i;
    copyTarget = i === 0 ? 1 : 0;
  }

  function rename(e, i) {
    app.renameBag(i, e.currentTarget.value);
    // Put back the cleaned name, which also restores the default when the
    // field was emptied while the bag already had it.
    e.currentTarget.value = app.account.bags[i].name;
  }

  function confirmed() {
    if (confirming?.kind === 'copy') app.copyBag(confirming.from, confirming.to);
    if (confirming?.kind === 'reset') app.resetBag(confirming.bag);
    if (confirming?.kind === 'remove') app.removeBag(confirming.bag);
    reset();
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

  const quoted = (i) => `“${app.account.bags[i].name}”`;

  function removeQuestion(i) {
    const after = i < app.account.bags.length - 1 ? ' The bags after it move up a number.' : '';
    return `Remove ${quoted(i)} and its clubs?${after}`;
  }

  function clubsOf(bag) {
    return CLUB_TYPES.map(({ key }) => {
      const { club: name, level } = bag.selections[key];
      return { key, name, level, image: clubFor(key, name)?.image };
    });
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
          <button
            class="more"
            aria-expanded={expanded === i}
            aria-controls={`bag-actions-${i}`}
            aria-label={`Edit, copy, reset or remove bag ${i + 1}`}
            data-testid={`bag-more-${i + 1}`}
            onclick={() => toggle(i)}
          >
            <svg viewBox="0 0 16 16" aria-hidden="true">
              <circle cx="3.5" cy="8" r="1.2" />
              <circle cx="8" cy="8" r="1.2" />
              <circle cx="12.5" cy="8" r="1.2" />
            </svg>
          </button>

          <ul class="mini" aria-label={`Clubs in bag ${i + 1}`}>
            {#each clubsOf(bag) as club (club.key)}
              <li title={`${club.name} · Lv ${club.level}`}>
                {#if club.image}
                  <img src={`images/${club.image}`} alt="" width="26" height="26" loading="lazy" />
                {/if}
                <span class="visually-hidden">{club.name}, level {club.level}</span>
              </li>
            {/each}
          </ul>

          {#if expanded === i}
            <div class="actions" id={`bag-actions-${i}`}>
              {#if confirming?.kind === 'copy'}
                <div class="confirm" role="alert" data-testid="bag-copy-confirm">
                  <p>
                    Replace the clubs in {quoted(confirming.to)} with the clubs from {quoted(i)}?
                  </p>
                  <div class="confirm-actions">
                    <button class="chunky compact" onclick={() => (confirming = null)}>
                      Cancel
                    </button>
                    <button
                      class="chunky compact primary"
                      data-testid="bag-copy-yes"
                      onclick={confirmed}
                    >
                      Replace
                    </button>
                  </div>
                </div>
              {:else if confirming?.kind === 'reset'}
                <div class="confirm" role="alert" data-testid="bag-reset-confirm">
                  <p>Put the starter clubs back in {quoted(i)}?</p>
                  <div class="confirm-actions">
                    <button class="chunky compact" onclick={() => (confirming = null)}>
                      Cancel
                    </button>
                    <button
                      class="chunky compact danger"
                      data-testid="bag-reset-yes"
                      onclick={confirmed}
                    >
                      Reset
                    </button>
                  </div>
                </div>
              {:else if confirming?.kind === 'remove'}
                <div class="confirm" role="alert" data-testid="bag-remove-confirm">
                  <p>{removeQuestion(i)}</p>
                  <div class="confirm-actions">
                    <button class="chunky compact" onclick={() => (confirming = null)}>
                      Cancel
                    </button>
                    <button
                      class="chunky compact danger"
                      data-testid="bag-remove-yes"
                      onclick={confirmed}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              {:else}
                <button
                  class="chunky compact"
                  data-testid={`bag-edit-${i + 1}`}
                  onclick={() => onedit(i)}
                >
                  Edit clubs
                </button>
                {#if app.account.bags.length > 1}
                  <div class="copy">
                    <label for={`bag-copy-${i}`}>Copy to</label>
                    <select
                      id={`bag-copy-${i}`}
                      bind:value={copyTarget}
                      data-testid={`bag-copy-target-${i + 1}`}
                    >
                      {#each app.account.bags as other, j (j)}
                        {#if j !== i}
                          <option value={j}>{bagLabel(other, j)}</option>
                        {/if}
                      {/each}
                    </select>
                    <button
                      class="chunky compact"
                      data-testid={`bag-copy-${i + 1}`}
                      onclick={() => (confirming = { kind: 'copy', from: i, to: copyTarget })}
                    >
                      Copy
                    </button>
                  </div>
                {/if}
                <div class="risky">
                  <button
                    class="text-button danger"
                    data-testid={`bag-reset-${i + 1}`}
                    onclick={() => (confirming = { kind: 'reset', bag: i })}
                  >
                    Reset
                  </button>
                  {#if app.account.bags.length > 1}
                    <button
                      class="text-button danger"
                      data-testid={`bag-remove-${i + 1}`}
                      onclick={() => (confirming = { kind: 'remove', bag: i })}
                    >
                      Remove
                    </button>
                  {/if}
                </div>
              {/if}
            </div>
          {/if}
        </li>
      {/each}
    </ol>

    {#if app.account.bags.length < MAX_BAGS}
      <div class="add">
        <button class="chunky compact" data-testid="bag-add-manager" onclick={add}>
          Add a bag
        </button>
        <p>It starts with the clubs in use.</p>
      </div>
    {:else}
      <p class="add-note">Five bags is the most, as in the game.</p>
    {/if}
  </div>
</Modal>

<style>
  .manager {
    /* A fixed width, so opening a bag's actions does not resize the dialog
       under the pointer. */
    width: min(480px, calc(92vw - 36px));
    display: grid;
    gap: 14px;
  }

  .more:focus-visible,
  .text-button:focus-visible,
  input:focus-visible,
  select:focus-visible {
    outline: 3px solid var(--green-500);
    outline-offset: 1px;
  }

  .copy label {
    font-size: 13px;
    font-weight: 600;
    color: var(--ink-muted);
  }

  input,
  select {
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
    padding: 0 6px;
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
    grid-template-columns: 30px minmax(0, 1fr) 40px;
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

  .more {
    display: grid;
    place-items: center;
    width: 40px;
    height: 36px;
    padding: 0;
    border: none;
    border-radius: var(--radius-sm);
    background: none;
    color: var(--ink-muted);
    cursor: pointer;
  }

  .more[aria-expanded='true'] {
    background: var(--surface);
    color: var(--ink);
  }

  .more svg {
    width: 18px;
    height: 18px;
    fill: currentColor;
  }

  .mini {
    grid-column: 2 / -1;
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    gap: 4px;
  }

  .mini li {
    display: grid;
    place-items: center;
    width: 30px;
    height: 30px;
    border-radius: 8px;
    background: var(--surface);
  }

  .mini img {
    width: 26px;
    height: 26px;
    object-fit: contain;
  }

  .actions {
    grid-column: 1 / -1;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 8px 12px;
    padding: 10px;
    border-radius: var(--radius-sm);
    background: var(--surface);
  }

  .copy {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .copy select {
    width: auto;
    max-width: 150px;
  }

  .confirm {
    width: 100%;
    display: grid;
    gap: 10px;
    padding: 12px;
    border-radius: var(--radius-sm);
    background: var(--surface-sunken);
    color: var(--ink);
  }

  .confirm p {
    margin: 0;
  }

  .confirm-actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
  }

  .risky {
    display: flex;
    gap: 4px;
  }

  .add {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px 12px;
  }

  .add p,
  .add-note {
    margin: 0;
    font-size: 13px;
    color: var(--ink-muted);
  }
</style>
