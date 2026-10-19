<script>
  import { CLUB_TYPES } from '../lib/state.svelte.js';

  /** `onselect(key)` asks for another club type; the app decides what that changes. */
  let { value, onselect } = $props();
</script>

<div class="tabs" role="tablist" aria-label="Club type" data-testid="club-tabs">
  {#each CLUB_TYPES as type (type.key)}
    <button
      class="tab"
      class:selected={value === type.key}
      role="tab"
      aria-selected={value === type.key}
      onclick={() => onselect(type.key)}
    >
      {type.label}
    </button>
  {/each}
</div>

<style>
  /* All seven are always visible. "Driver" needs 51px at 15px type, and a
     375px phone leaves only 50px per tab across one row, so below the
     breakpoint they wrap to two rows rather than shrinking to an unreadable
     12px or scrolling out of sight. */
  .tabs {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 4px;
    padding: 4px;
    background: var(--surface-sunken);
    border-radius: var(--radius-lg);
  }

  @media (min-width: 560px) {
    .tabs {
      grid-template-columns: repeat(7, 1fr);
    }
  }

  .tab {
    min-width: 0;
    padding: 11px 6px;
    border: none;
    border-radius: calc(var(--radius-lg) - 4px);
    background: transparent;
    color: var(--ink-muted);
    font-family: var(--font-display);
    font-size: 15px;
    font-weight: 700;
    cursor: pointer;
    transition:
      background-color 140ms ease,
      color 140ms ease;
  }

  .tab:hover:not(.selected) {
    color: var(--ink);
  }

  .tab.selected {
    background: var(--green-500);
    color: var(--on-dark);
    box-shadow: 0 2px 0 var(--green-700);
  }

  .tab:focus-visible {
    outline: 3px solid var(--green-500);
    outline-offset: -1px;
  }
</style>
