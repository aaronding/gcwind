<script>
  import { MediaQuery } from 'svelte/reactivity';

  // Replaces createPresetButtonsWithMenu(): shortcuts inline, everything else
  // behind a menu. The old version declared its update function inside an
  // if/else block and called it from the enclosing scope, which only worked
  // because classic scripts are sloppy mode.
  //
  // `shortcuts` are the buttons on a phone. Where the row has room for them
  // (not a phone, and wide enough), `wideShortcuts` are shown instead, which
  // leaves fewer values for the menu, or none, and then the label is only a label.
  //
  // The menu opens from the label, which carries the arrow and, when the value
  // is not one of the shortcuts, the value itself.
  //
  // With `onnudge`, a − and a + button on the label line move the value by
  // `step`, the way the wind stepper does, and the presets take the line below.
  //
  // On a phone every row is a single line, so the label gives way to
  // `shortLabel`, the steppers sit at the two ends of the presets, and `unit`
  // (shown after every value but 0) is dropped from the buttons.
  let {
    label,
    value,
    shortcuts: phoneShortcuts,
    wideShortcuts = phoneShortcuts,
    values,
    format = (v) => String(v),
    onchange,
    unit,
    shortLabel,
    step,
    onnudge
  } = $props();

  // The narrowest a button can be and still hold its number, with the gap, and
  // the room the unit takes where it shows.
  const WIDE_BUTTON = 34;
  const WIDE_UNIT = 11;
  const phone = new MediaQuery('max-width: 440px');

  let open = $state(false);
  let rowWidth = $state(0);
  const shortcuts = $derived(
    !phone.current && rowWidth >= wideShortcuts.length * (WIDE_BUTTON + (unit ? WIDE_UNIT : 0))
      ? wideShortcuts
      : phoneShortcuts
  );
  const extras = $derived(values.filter((v) => !shortcuts.includes(v)));
  const inMenu = $derived(!shortcuts.includes(value));

  function pick(next) {
    open = false;
    onchange(next);
  }
</script>

{#snippet shown(v)}
  <span
    >{format(v)}{#if unit && v !== 0}<span class="unit">{unit}</span>{/if}</span
  >
{/snippet}

{#snippet name()}
  <span id={`preset-${label}`}>
    <span class="full" class:swapped={!!shortLabel}>{label}</span>
    {#if shortLabel}<span class="short" aria-hidden="true">{shortLabel}</span>{/if}
  </span>
{/snippet}

<div
  class="row"
  class:stacked={!!onnudge || shortcuts.length > 4}
  class:nudging={!!onnudge}
  bind:clientWidth={rowWidth}
  data-testid={`${label.toLowerCase().replace(/\s+/g, '')}-control`}
>
  <div class="label-cell">
    {#if extras.length}
      <div class="menu-wrap">
        <button
          class="label label-trigger chunky"
          class:selected={inMenu}
          data-testid="preset-menu"
          aria-haspopup="listbox"
          aria-expanded={open}
          onclick={() => (open = !open)}
        >
          {@render name()}
          {#if inMenu}<span class="current" data-testid="preset-current"
              >{@render shown(value)}</span
            >{/if}
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
                {@render shown(option)}
              </button>
            {/each}
          </div>
        {/if}
      </div>
    {:else}
      <span class="label">{@render name()}</span>
    {/if}
  </div>

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

  <div class="control">
    {#each shortcuts as shortcut (shortcut)}
      <button
        class="preset chunky"
        class:selected={value === shortcut}
        data-testid={`preset-${shortcut}`}
        aria-pressed={value === shortcut}
        onclick={() => pick(shortcut)}
      >
        {@render shown(shortcut)}
      </button>
    {/each}
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
  @media (max-width: 440px) {
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
  }

  /* Only phones swap to the short label and drop the unit; see the last media
     query. */
  .short {
    display: none;
  }

  .label {
    font-family: var(--font-display);
    font-weight: 700;
    color: var(--ink-muted);
    font-size: 15px;
  }

  .label-cell {
    min-width: 0;
  }

  /* The label as the button that opens the menu: the arrow after the name says
     so, and a value from the menu shows after it, on green like a chosen
     preset. */
  .label-trigger {
    min-height: 40px;
    padding: 0 10px;
    display: inline-flex;
    align-items: center;
    gap: 5px;
    white-space: nowrap;
  }

  .label-trigger svg {
    width: 9px;
    height: 6px;
    flex: none;
    fill: none;
    stroke: currentColor;
    stroke-width: 1.8;
    stroke-linecap: round;
  }

  .label-trigger.selected {
    background: var(--green-500);
    color: var(--on-dark);
    box-shadow: 0 var(--bevel) 0 var(--green-700);
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

  .stacked .label-cell {
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

  /* Tight side padding, so six presets fit a 320px phone. */
  .stacked .control .preset {
    flex: 1 1 0;
    min-width: 0;
    padding: 0 4px;
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
    display: inline-block;
  }

  .menu {
    position: absolute;
    top: calc(100% + 8px);
    left: 0;
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

  /* On a phone each control is a single line, to save height: the short label
     as the menu button, then the presets, with the steppers (when there are
     any) at the two ends. The buttons are narrow, so the type is smaller and
     the padding tight. The full label stays in the accessibility tree. */
  @media (max-width: 440px) {
    .row.stacked {
      grid-template-columns: auto minmax(0, 1fr);
      grid-template-areas: 'label control';
      align-items: center;
      gap: 0 6px;
    }

    .row.stacked.nudging {
      grid-template-columns: auto 30px minmax(0, 1fr) 30px;
      grid-template-areas: 'label dec control inc';
      gap: 0 4px;
    }

    /* The same width for both labels, so the presets start together. */
    .label-trigger {
      min-width: 58px;
      padding: 0 8px;
    }

    .full.swapped,
    .unit {
      position: absolute;
      width: 1px;
      height: 1px;
      overflow: hidden;
      clip-path: inset(50%);
      white-space: nowrap;
    }

    .short {
      display: inline;
    }

    .nudges {
      display: contents;
    }

    .nudge {
      width: 100%;
      min-width: 0;
      font-size: 20px;
    }

    .nudge:first-child {
      grid-area: dec;
    }

    .nudge:last-child {
      grid-area: inc;
    }

    .stacked .control {
      gap: 3px;
    }

    .stacked .control .preset {
      padding: 0 1px;
      font-size: 14px;
    }
  }
</style>
