<script>
  import { WIND_MIN, WIND_MAX, keyWindDigit } from '../lib/state.svelte.js';

  let { value, oninput, onnudge, onclear } = $props();

  // How long the keypad waits after a digit before the next one starts a new
  // number. Long enough to read the in-game wind digit by digit, short enough
  // that the next shot's wind never runs on from this one's.
  const ENTRY_TIMEOUT = 2500;

  const display = $derived(Number.isFinite(value) ? value.toFixed(1) : '');

  let field;
  // True while someone types into the field, so it keeps what they typed
  // instead of reformatting it under the cursor: rewritten as 1.0 after the
  // first key, 12.5 came out as 1.025. Formatted again once they leave it.
  let typing = $state(false);
  // Set by focus and spent by the mouseup that follows, which would otherwise
  // put the cursor down and undo the select-all.
  let justFocused = false;

  $effect(() => {
    if (!typing) field.value = display;
  });

  // The keypad's digits so far; empty when the next digit starts a new number.
  let entry = $state('');
  let entryTimer;

  function endEntry() {
    clearTimeout(entryTimer);
    entry = '';
  }

  function key(digit) {
    clearTimeout(entryTimer);
    entry = keyWindDigit(entry, digit);
    // All zeros so far has no wind to show yet; the next digit gives it one.
    oninput(Number(entry) ? String(Number(entry) / 10) : '');
    entryTimer = setTimeout(endEntry, ENTRY_TIMEOUT);
  }

  function clear() {
    endEntry();
    onclear();
    // The key just pressed holds focus, so digits typed next would go nowhere.
    // A fine pointer means a keyboard to type them on; on a phone the keypad is
    // the way in, and focusing the field would raise the on-screen keyboard
    // over it.
    if (matchMedia('(pointer: fine)').matches) field.focus();
  }

  function nudge(delta) {
    endEntry();
    onnudge(delta);
  }

  // A tap on + or − moves the wind a tenth, the step of the in-game wind. Held
  // this long, it moves a whole point instead, for the bigger changes between
  // shots without reaching for the keypad.
  const LONG_PRESS = 450;
  let holdTimer;
  // Set once a hold has moved the wind, so the click that ends it does not move
  // it a tenth more.
  let held = false;

  function pressStep(direction) {
    held = false;
    clearTimeout(holdTimer);
    holdTimer = setTimeout(() => {
      held = true;
      nudge(direction);
    }, LONG_PRESS);
  }

  function releaseStep() {
    clearTimeout(holdTimer);
  }

  function step(e, direction) {
    // A click from the keyboard has no press before it, so it is never a hold.
    if (held && e.detail > 0) {
      held = false;
      return;
    }
    nudge(direction / 10);
  }

  function type(e) {
    const input = e.currentTarget;
    // "12." on the way to "12.5" reads back as empty; wait for the next key.
    if (input.validity.badInput) return;
    endEntry();
    typing = true;
    oninput(input.value);
    // Past the maximum is a missed decimal (137 for 13.7), so show the fix now.
    if (Number(input.value) > WIND_MAX) input.value = display;
  }

  function select(e) {
    justFocused = true;
    e.currentTarget.select();
  }

  function keepSelection(e) {
    if (justFocused) e.preventDefault();
    justFocused = false;
  }
</script>

<div class="wind" class:entering={entry !== ''}>
  <label class="label" for="wind">Wind Speed</label>

  <div class="stepper">
    <button
      class="step"
      data-testid="wind-decrease"
      aria-label="Decrease wind speed"
      title="Tap for 0.1, hold for 1"
      onpointerdown={() => pressStep(-1)}
      onpointerup={releaseStep}
      onpointerleave={releaseStep}
      onpointercancel={releaseStep}
      oncontextmenu={(e) => e.preventDefault()}
      onclick={(e) => step(e, -1)}
    >
      −
    </button>

    <input
      id="wind"
      type="number"
      inputmode="decimal"
      step="0.1"
      min={WIND_MIN}
      max={WIND_MAX}
      data-testid="wind-input"
      bind:this={field}
      oninput={type}
      onfocus={select}
      onmouseup={keepSelection}
      onblur={() => (typing = false)}
      onkeydown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
    />

    <button
      class="step"
      data-testid="wind-increase"
      aria-label="Increase wind speed"
      title="Tap for 0.1, hold for 1"
      onpointerdown={() => pressStep(1)}
      onpointerup={releaseStep}
      onpointerleave={releaseStep}
      onpointercancel={releaseStep}
      oncontextmenu={(e) => e.preventDefault()}
      onclick={(e) => step(e, 1)}
    >
      +
    </button>

    <!-- The buttons' title says the same to assistive technology. -->
    <p class="hint" aria-hidden="true">Hold to +/- 1</p>
  </div>

  <!-- Typing the wind is quicker and surer against the shot clock than
       dragging to it. No decimal key: see keyWindDigit. -->
  <div class="keypad" role="group" aria-label="Wind speed keypad" data-testid="wind-keypad">
    {#each [7, 8, 9, 4, 5, 6, 1, 2, 3] as digit (digit)}
      <button class="key" data-testid="wind-key-{digit}" onclick={() => key(digit)}>
        {digit}
      </button>
    {/each}
    <button
      class="key clear"
      data-testid="wind-clear"
      aria-label="Clear wind speed"
      onclick={clear}
    >
      C
    </button>
    <button class="key zero" data-testid="wind-key-0" onclick={() => key(0)}>0</button>
  </div>
</div>

<style>
  /* The most-used control in the app, so it is laid out for a thumb: the
     keypad runs down the right-hand side, and the label, the value and the
     steppers sit beside it, centred on its height by the two flexible rows.
     Steppers flanking the value no longer fit beside the keypad on a phone,
     so they sit under it. */
  .wind {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    grid-template-rows: 1fr auto auto 1fr;
    grid-template-areas:
      '. keypad'
      'label keypad'
      'stepper keypad'
      '. keypad';
    align-content: center;
    column-gap: 12px;
    row-gap: 6px;
    padding: 10px 12px 14px;
    border-radius: var(--radius-lg);
    /* A pale green rather than a solid one: it marks the card the wind goes
       into without outweighing the gold result. */
    background: var(--green-100);
    box-shadow: var(--shadow-card);
  }

  .label {
    grid-area: label;
    font-family: var(--font-display);
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--accent-ink);
  }

  .stepper {
    grid-area: stepper;
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-template-areas: 'value value';
    align-items: center;
    gap: 8px;
  }

  .hint {
    grid-column: 1 / -1;
    margin: -3px 0 0;
    color: var(--ink-muted);
    font-size: 12px;
    line-height: 1.2;
    text-align: center;
  }

  .step {
    height: 44px;
    border: none;
    border-radius: 999px;
    background: var(--green-500);
    color: var(--on-dark);
    font-size: 26px;
    font-weight: 700;
    line-height: 1;
    cursor: pointer;
    box-shadow: 0 3px 0 var(--green-700);
    touch-action: manipulation;
    /* A hold must not select the sign or raise the touch callout. */
    -webkit-user-select: none;
    user-select: none;
    -webkit-touch-callout: none;
    transition:
      transform 90ms ease,
      box-shadow 90ms ease,
      background-color 120ms ease;
  }

  .step:hover {
    background: var(--green-600);
  }

  .step:active {
    transform: translateY(3px);
    box-shadow: 0 0 0 var(--green-700);
  }

  .step:focus-visible,
  .key:focus-visible {
    outline: 3px solid var(--green-700);
    outline-offset: 2px;
  }

  /* A recessed well, so the number reads as something to click and type
     into rather than a label. */
  #wind {
    grid-area: value;
    padding: 4px 0;
    border: 1.5px solid var(--edge);
    border-radius: var(--radius-sm);
    background: var(--surface);
    box-shadow: inset 0 2px 3px rgb(0 0 0 / 8%);
    cursor: text;
    transition:
      background-color 120ms ease,
      border-color 120ms ease;
  }

  #wind:hover {
    border-color: var(--green-500);
  }

  input {
    width: 100%;
    min-width: 0;
    border: none;
    background: transparent;
    color: var(--ink);
    font-family: var(--font-display);
    font-size: clamp(38px, 11vw, 48px);
    font-weight: 800;
    line-height: 1.05;
    text-align: center;
    padding: 0;
    font-variant-numeric: tabular-nums;
    -moz-appearance: textfield;
    appearance: textfield;
  }

  input::-webkit-outer-spin-button,
  input::-webkit-inner-spin-button {
    appearance: none;
    margin: 0;
  }

  #wind:focus {
    outline: none;
    border-color: var(--green-500);
    box-shadow:
      inset 0 2px 3px rgb(0 0 0 / 8%),
      0 0 0 2px var(--green-500);
  }

  /* While keypad digits are still going into the number, it is shown in gold,
     so it is clear the next digit adds to it rather than starting afresh. On
     the white well of the light theme that is a deeper amber, which keeps 3:1
     at this size. */
  .entering #wind {
    color: light-dark(#a86a00, var(--gold-400));
  }

  .keypad {
    grid-area: keypad;
    display: grid;
    grid-template-columns: repeat(3, 44px);
    grid-auto-rows: 44px;
    gap: 6px;
    align-self: center;
  }

  .key {
    border: none;
    border-radius: var(--radius-sm);
    background: var(--green-500);
    color: var(--on-dark);
    font-family: var(--font-display);
    font-size: 20px;
    font-weight: 700;
    line-height: 1;
    font-variant-numeric: tabular-nums;
    cursor: pointer;
    box-shadow: 0 3px 0 var(--green-700);
    touch-action: manipulation;
    transition:
      transform 90ms ease,
      box-shadow 90ms ease,
      background-color 120ms ease;
  }

  .key:hover {
    background: var(--green-600);
  }

  .key:active {
    transform: translateY(3px);
    box-shadow: 0 0 0 var(--green-700);
  }

  .zero {
    grid-column: span 2;
  }

  /* A darker key, so it is not mistaken for a digit; its letter is the
     digits' size, so it is as easy to find. */
  .clear,
  .clear:hover {
    background: var(--green-700);
  }

  .clear {
    box-shadow: 0 3px 0 var(--green-900);
  }

  /* On a phone the keypad turns on its side, four keys across and three down
     like a keyboard's number pad: C at the top of the last column and a tall
     0 under it. That is one row of keys less, which sets the height of the
     card, and the number and the steppers still fit beside it. */
  @media (min-width: 360px) and (max-width: 680px) {
    .wind {
      padding: 10px 12px 12px;
      row-gap: 4px;
    }

    .keypad {
      grid-template-columns: repeat(4, 44px);
      gap: 6px 5px;
    }

    .clear {
      grid-column: 4;
      grid-row: 1;
    }

    .zero {
      grid-column: 4;
      grid-row: 2 / span 2;
    }

    input {
      font-size: clamp(34px, 9.5vw, 40px);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .key:active,
    .step:active {
      transform: none;
    }
  }
</style>
