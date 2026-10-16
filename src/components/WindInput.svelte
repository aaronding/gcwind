<script>
  import { WIND_MIN, WIND_MAX, keyWindDigit } from '../lib/state.svelte.js';

  let { value, oninput, onnudge, onclear } = $props();

  // How long the keypad waits after a digit before the next one starts a new
  // number. Long enough to read the in-game wind digit by digit, short enough
  // that the next shot's wind never runs on from this one's.
  const ENTRY_TIMEOUT = 2500;

  const display = $derived(Number.isFinite(value) ? value.toFixed(1) : '');

  // A cleared wind parks the thumb at the left end rather than letting the
  // browser default it to the middle of the track.
  const position = $derived(Number.isFinite(value) ? value : WIND_MIN);
  const fill = $derived(`${((position - WIND_MIN) / (WIND_MAX - WIND_MIN)) * 100}%`);

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
  }

  function nudge(delta) {
    endEntry();
    onnudge(delta);
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

  function slide(e) {
    endEntry();
    oninput(e.currentTarget.value);
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
      onclick={() => nudge(-0.1)}
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
      onclick={() => nudge(0.1)}
    >
      +
    </button>
  </div>

  <!-- Drag for the rough number, then the steppers for the last tenth. It goes
       through the same handler as typing, so clamping and saving match. -->
  <input
    class="slider"
    type="range"
    min={WIND_MIN}
    max={WIND_MAX}
    step="0.1"
    value={position}
    aria-label="Wind speed"
    data-testid="wind-slider"
    style:--fill={fill}
    oninput={slide}
  />

  <!-- Typing the wind is quicker and surer against the shot clock than
       dragging to it. No decimal key: see keyWindDigit. -->
  <div class="keypad" role="group" aria-label="Wind speed keypad">
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
     keypad runs down the right-hand side, and the value, the steppers and the
     slider stack beside it to the keypad's height. Steppers flanking the value
     no longer fit beside the keypad on a phone, so they sit under it. */
  .wind {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    grid-template-areas:
      'label keypad'
      'stepper keypad'
      'slider keypad';
    align-content: center;
    column-gap: 12px;
    row-gap: 6px;
    padding: 10px 12px 14px;
    border-radius: var(--radius-lg);
    background: linear-gradient(165deg, var(--green-500), var(--green-700));
    box-shadow:
      0 5px 0 var(--green-900),
      var(--shadow-card);
  }

  .label {
    grid-area: label;
    font-family: var(--font-display);
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: rgb(255 255 255 / 80%);
  }

  .stepper {
    grid-area: stepper;
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-template-areas: 'value value';
    align-items: center;
    gap: 8px;
  }

  .step {
    height: 44px;
    border: none;
    border-radius: 999px;
    background: rgb(255 255 255 / 20%);
    color: var(--on-dark);
    font-size: 26px;
    font-weight: 700;
    line-height: 1;
    cursor: pointer;
    box-shadow: 0 3px 0 rgb(0 0 0 / 20%);
    transition:
      transform 90ms ease,
      box-shadow 90ms ease,
      background-color 120ms ease;
  }

  .step:hover {
    background: rgb(255 255 255 / 30%);
  }

  .step:active {
    transform: translateY(3px);
    box-shadow: 0 0 0 rgb(0 0 0 / 20%);
  }

  .step:focus-visible,
  .key:focus-visible {
    outline: 3px solid var(--gold-400);
    outline-offset: 2px;
  }

  /* A recessed well, so the number reads as something to click and type
     into rather than a label. */
  #wind {
    grid-area: value;
    padding: 4px 0;
    border: 1.5px solid rgb(255 255 255 / 28%);
    border-radius: var(--radius-sm);
    background: rgb(0 0 0 / 18%);
    box-shadow: inset 0 2px 4px rgb(0 0 0 / 22%);
    cursor: text;
    transition:
      background-color 120ms ease,
      border-color 120ms ease;
  }

  #wind:hover {
    border-color: rgb(255 255 255 / 50%);
    background: rgb(0 0 0 / 24%);
  }

  input {
    width: 100%;
    min-width: 0;
    border: none;
    background: transparent;
    color: var(--on-dark);
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
    border-color: var(--gold-400);
    box-shadow:
      inset 0 2px 4px rgb(0 0 0 / 22%),
      0 0 0 2px var(--gold-400);
  }

  /* White on the green card, filled up to the thumb so the wind reads as an
     amount at a glance. */
  .slider {
    grid-area: slider;
    appearance: none;
    width: 100%;
    height: 30px;
    margin: 2px 0 0;
    background: transparent;
    cursor: pointer;
  }

  .slider::-webkit-slider-runnable-track {
    height: 8px;
    border-radius: 999px;
    background: linear-gradient(
      to right,
      rgb(255 255 255 / 85%) var(--fill),
      rgb(255 255 255 / 22%) var(--fill)
    );
  }

  .slider::-moz-range-track {
    height: 8px;
    border-radius: 999px;
    background: rgb(255 255 255 / 22%);
  }

  .slider::-moz-range-progress {
    height: 8px;
    border-radius: 999px;
    background: rgb(255 255 255 / 85%);
  }

  .slider::-webkit-slider-thumb {
    appearance: none;
    width: 26px;
    height: 26px;
    margin-top: -9px;
    border: none;
    border-radius: 50%;
    background: var(--on-dark);
    box-shadow: 0 3px 0 rgb(0 0 0 / 20%);
  }

  .slider::-moz-range-thumb {
    width: 26px;
    height: 26px;
    border: none;
    border-radius: 50%;
    background: var(--on-dark);
    box-shadow: 0 3px 0 rgb(0 0 0 / 20%);
  }

  .slider:focus-visible {
    outline: 3px solid var(--gold-400);
    outline-offset: 4px;
    border-radius: 999px;
  }

  /* While keypad digits are still going into the number, it is shown in gold,
     so it is clear the next digit adds to it rather than starting afresh. */
  .entering #wind {
    color: var(--gold-400);
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
    background: rgb(255 255 255 / 20%);
    color: var(--on-dark);
    font-family: var(--font-display);
    font-size: 20px;
    font-weight: 700;
    line-height: 1;
    font-variant-numeric: tabular-nums;
    cursor: pointer;
    box-shadow: 0 3px 0 rgb(0 0 0 / 20%);
    touch-action: manipulation;
    transition:
      transform 90ms ease,
      box-shadow 90ms ease,
      background-color 120ms ease;
  }

  .key:hover {
    background: rgb(255 255 255 / 30%);
  }

  .key:active {
    transform: translateY(3px);
    box-shadow: 0 0 0 rgb(0 0 0 / 20%);
  }

  .zero {
    grid-column: span 2;
  }

  .clear {
    background: rgb(0 0 0 / 18%);
    font-size: 16px;
  }

  @media (prefers-reduced-motion: reduce) {
    .key:active,
    .step:active {
      transform: none;
    }
  }
</style>
