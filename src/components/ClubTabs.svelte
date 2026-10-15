<script>
  import { CLUB_TYPES } from '../lib/state.svelte.js';

  let { value = $bindable() } = $props();
</script>

<div class="tabs" role="tablist" aria-label="Club type" data-testid="club-tabs">
  {#each CLUB_TYPES as type (type.key)}
    <button
      class="tab"
      class:selected={value === type.key}
      role="tab"
      aria-selected={value === type.key}
      onclick={() => (value = type.key)}
    >
      {type.label}
    </button>
  {/each}
</div>

<style>
  .tabs {
    display: flex;
    gap: 4px;
    padding: 4px;
    background: var(--surface-sunken);
    border-radius: var(--radius-lg);
    overflow-x: auto;
    scrollbar-width: none;
  }

  .tabs::-webkit-scrollbar {
    display: none;
  }

  .tab {
    flex: 1 0 auto;
    min-width: 62px;
    padding: 10px 12px;
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
