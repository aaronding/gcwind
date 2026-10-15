<script>
  let { max, clubType, selected, onselect } = $props();
</script>

<div class="levels" data-testid={`level-list-${clubType}`} role="group" aria-label="Club level">
  {#each Array.from({ length: max }, (_, i) => i + 1) as level (level)}
    <button
      class="level chunky"
      class:selected={level === selected}
      data-testid={`level-${level}`}
      aria-pressed={level === selected}
      onclick={() => onselect(level)}
    >
      {level}
    </button>
  {/each}
</div>

<style>
  .levels {
    /* Grid, not flex-wrap: a wrapped flex row stretches its last line, which
       left levels 9 and 10 four times the width of the rest. */
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(40px, 1fr));
    gap: 6px;
  }

  .level {
    min-width: 0;
    min-height: 42px;
    padding: 0;
    font-family: var(--font-display);
    font-size: 15px;
    font-weight: 700;
    color: var(--ink-muted);
  }

  .level.selected {
    background: var(--green-500);
    color: var(--on-dark);
    box-shadow: 0 var(--bevel) 0 var(--green-700);
  }
</style>
