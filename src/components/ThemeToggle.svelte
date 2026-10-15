<script>
  import { theme, THEMES } from '../lib/theme.svelte.js';

  const LABELS = { auto: 'System theme', light: 'Light theme', dark: 'Dark theme' };
</script>

<div class="toggle" role="group" aria-label="Theme" data-testid="theme-toggle">
  {#each THEMES as option (option)}
    <button
      class="option"
      class:selected={theme.current === option}
      data-testid={`theme-${option}`}
      aria-pressed={theme.current === option}
      title={LABELS[option]}
      onclick={() => theme.set(option)}
    >
      <span class="visually-hidden">{LABELS[option]}</span>

      {#if option === 'auto'}
        <svg viewBox="0 0 16 16" aria-hidden="true">
          <circle cx="8" cy="8" r="6" />
          <path d="M8 2a6 6 0 0 0 0 12z" class="fill" />
        </svg>
      {:else if option === 'light'}
        <svg viewBox="0 0 16 16" aria-hidden="true">
          <circle cx="8" cy="8" r="3.4" />
          <path
            d="M8 1v1.6M8 13.4V15M1 8h1.6M13.4 8H15M3.1 3.1l1.1 1.1M11.8 11.8l1.1 1.1M12.9 3.1l-1.1 1.1M4.2 11.8l-1.1 1.1"
          />
        </svg>
      {:else}
        <svg viewBox="0 0 16 16" aria-hidden="true">
          <path d="M13.2 9.6A5.6 5.6 0 0 1 6.4 2.8a5.6 5.6 0 1 0 6.8 6.8z" />
        </svg>
      {/if}
    </button>
  {/each}
</div>

<style>
  .toggle {
    display: inline-flex;
    gap: 2px;
    padding: 3px;
    background: var(--surface-sunken);
    border-radius: 999px;
  }

  .option {
    display: grid;
    place-items: center;
    width: 28px;
    height: 28px;
    padding: 0;
    border: none;
    border-radius: 50%;
    background: transparent;
    color: var(--ink-faint);
    cursor: pointer;
    transition:
      background-color 140ms ease,
      color 140ms ease;
  }

  .option:hover {
    color: var(--ink);
  }

  .option.selected {
    background: var(--surface);
    color: var(--green-600);
    box-shadow: 0 1px 3px rgb(0 0 0 / 14%);
  }

  .option:focus-visible {
    outline: 3px solid var(--green-500);
    outline-offset: 1px;
  }

  svg {
    width: 16px;
    height: 16px;
    fill: none;
    stroke: currentColor;
    stroke-width: 1.5;
    stroke-linecap: round;
  }

  /* The filled half of the auto icon, which reads as "a bit of both". */
  svg .fill {
    fill: currentColor;
    stroke: none;
  }

  .option.selected svg path:not(.fill) {
    stroke-width: 1.8;
  }
</style>
