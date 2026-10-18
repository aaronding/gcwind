<script>
  // Replaces createPresetButtonsWithMenu(): shortcuts inline, everything else
  // behind a menu. The old version declared its update function inside an
  // if/else block and called it from the enclosing scope, which only worked
  // because classic scripts are sloppy mode.
  //
  // With `onnudge`, a − and a + button on the label line move the value by
  // `step`, the way the wind stepper does, and the presets take the line below.
  let {
    label,
    value,
    shortcuts,
    values,
    format = (v) => String(v),
    onchange,
    step,
    onnudge
  } = $props();

  let open = $state(false);
  const extras = $derived(values.filter((v) => !shortcuts.includes(v)));
  const inMenu = $derived(!shortcuts.includes(value));

  function pick(next) {
    open = false;
    onchange(next);
  }
</script>

<div class="row" class:stacked={!!onnudge || shortcuts.length > 4}>
  <span class="label" id={`preset-${label}`}>{label}</span>

  {#if onnudge}
    <div class="nudges">
      <button
        class="preset chunky nudge"
        data-testid="preset-decrease"
        aria-label={`Decrease ${label.toLowerCase()} by ${step}`}
        disabled={value <= values[0]}
        onclick={() => onnudge(-step)}
      >
        −
      </button>
      <button
        class="preset chunky nudge"
        data-testid="preset-increase"
        aria-label={`Increase ${label.toLowerCase()} by ${step}`}
        disabled={value >= values.at(-1)}
        onclick={() => onnudge(step)}
      >
        +
      </button>
    </div>
  {/if}

  <div class="control" data-testid={`${label.toLowerCase().replace(/\s+/g, '')}-control`}>
    {#each shortcuts as shortcut (shortcut)}
      <button
        class="preset chunky"
        class:selected={value === shortcut}
        data-testid={`preset-${shortcut}`}
        aria-pressed={value === shortcut}
        onclick={() => pick(shortcut)}
      >
        {format(shortcut)}
      </button>
    {/each}

    {#if extras.length}
      <div class="menu-wrap">
        <button
          class="preset chunky menu-trigger"
          class:selected={inMenu}
          data-testid="preset-menu"
          aria-haspopup="listbox"
          aria-expanded={open}
          onclick={() => (open = !open)}
        >
          {inMenu ? format(value) : '-'}
          <svg viewBox="0 0 10 6" aria-hidden="true"><path d="M1 1l4 4 4-4" /></svg>
        </button>

        {#if open}
          <!-- Closing on blur rather than mouseleave: the old hover-to-open
               behaviour meant a click on the trigger toggled it straight shut. -->
          <div
            class="menu"
            role="listbox"
            aria-labelledby={`preset-${label}`}
            tabindex="-1"
            onfocusout={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget)) open = false;
            }}
          >
            {#each extras as option (option)}
              <button
                class="option"
                class:selected={value === option}
                role="option"
                aria-selected={value === option}
                data-testid={`preset-option-${option}`}
                onclick={() => pick(option)}
              >
                {format(option)}
              </button>
            {/each}
          </div>
        {/if}
      </div>
    {/if}
  </div>
</div>

<svelte:window
  onclick={(e) => {
    if (open && !e.target.closest('.menu-wrap')) open = false;
  }}
/>

<style>
  .row {
    display: flex;
    align-items: center;
    gap: 12px;
    justify-content: space-between;
  }

  /* Below this the label and five buttons cannot share a line without
     overflowing, so the label moves above and the buttons spread the width,
     which also makes them easier to hit. */
  @media (max-width: 430px) {
    .row {
      display: grid;
      grid-template-columns: minmax(0, 1fr);
      gap: 6px;
    }

    .control {
      justify-content: stretch;
    }

    .preset {
      flex: 1 1 0;
      min-width: 0;
    }

    .menu-wrap {
      flex: 0 0 auto;
    }
  }

  .label {
    font-family: var(--font-display);
    font-weight: 700;
    color: var(--ink-muted);
    font-size: 15px;
  }

  .control {
    display: flex;
    gap: 6px;
    min-width: 0;
  }

  .preset {
    min-width: 46px;
    min-height: 40px;
    padding: 0 10px;
    font-family: var(--font-display);
    font-size: 15px;
    font-weight: 700;
    color: var(--ink-muted);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
  }

  /* With steppers, or more presets than fit beside the label, the label (and
     the steppers) take the first line and the presets spread across the
     second, at every width: even a desktop's narrow settings card is too
     narrow for them side by side. */
  .row.stacked {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    grid-template-areas:
      'label nudges'
      'control control';
    gap: 6px 12px;
  }

  .stacked .label {
    grid-area: label;
  }

  .nudges {
    grid-area: nudges;
    display: flex;
    gap: 6px;
  }

  .stacked .control {
    grid-area: control;
    justify-content: stretch;
  }

  /* Tight side padding, so six presets and the menu fit a 320px phone. */
  .stacked .control .preset {
    flex: 1 1 0;
    min-width: 0;
    padding: 0 4px;
  }

  .stacked .menu-wrap {
    flex: 0 0 auto;
  }

  /* The − and + steppers: green like the wind's, and no wider than a thumb needs. */
  .nudge {
    flex: none;
    min-width: 52px;
    padding: 0;
    font-size: 22px;
    color: var(--accent-ink);
    background: var(--green-100);
  }

  .nudge:disabled {
    opacity: 0.4;
    cursor: default;
  }

  .preset.selected {
    background: var(--green-500);
    color: var(--on-dark);
    box-shadow: 0 var(--bevel) 0 var(--green-700);
  }

  .menu-wrap {
    position: relative;
  }

  .menu-trigger svg {
    width: 9px;
    height: 6px;
    fill: none;
    stroke: currentColor;
    stroke-width: 1.8;
    stroke-linecap: round;
  }

  .menu {
    position: absolute;
    top: calc(100% + 8px);
    right: 0;
    z-index: 20;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 4px;
    padding: 8px;
    min-width: 168px;
    background: var(--surface);
    border: 1px solid var(--edge);
    border-radius: var(--radius);
    box-shadow: 0 10px 28px rgb(18 51 27 / 18%);
  }

  .option {
    border: none;
    border-radius: var(--radius-sm);
    background: var(--surface-sunken);
    padding: 9px 6px;
    font-family: var(--font-display);
    font-weight: 700;
    font-size: 14px;
    cursor: pointer;
  }

  .option:hover {
    background: var(--green-100);
  }

  .option.selected {
    background: var(--green-500);
    color: var(--on-dark);
  }
</style>
