<script>
  import { WIND_MIN, WIND_MAX } from '../lib/state.svelte.js';

  let { value, oninput, onnudge, onclear } = $props();

  const display = $derived(Number.isFinite(value) ? value.toFixed(1) : '');
</script>

<div class="wind">
  <div class="top">
    <label class="label" for="wind">Wind Speed</label>
    <button class="clear" data-testid="wind-clear" aria-label="Clear wind speed" onclick={onclear}>
      ×
    </button>
  </div>

  <div class="stepper">
    <button
      class="step"
      data-testid="wind-decrease"
      aria-label="Decrease wind speed"
      onclick={() => onnudge(-0.1)}
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
      value={display}
      data-testid="wind-input"
      oninput={(e) => oninput(e.currentTarget.value)}
    />

    <button
      class="step"
      data-testid="wind-increase"
      aria-label="Increase wind speed"
      onclick={() => onnudge(0.1)}
    >
      +
    </button>
  </div>
</div>

<style>
  /* The most-used control in the app, so it is laid out for a thumb: both
     steppers flank the value rather than sitting below it. That also stops the
     card being a tall block of green with the number floating in dead space. */
  .wind {
    display: grid;
    gap: 6px;
    padding: 10px 12px 14px;
    border-radius: var(--radius-lg);
    background: linear-gradient(165deg, var(--green-500), var(--green-700));
    box-shadow:
      0 5px 0 var(--green-900),
      var(--shadow-card);
  }

  .top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    min-height: 26px;
  }

  .label {
    font-family: var(--font-display);
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: rgb(255 255 255 / 80%);
  }

  .clear {
    width: 26px;
    height: 26px;
    border: none;
    border-radius: 50%;
    background: rgb(255 255 255 / 16%);
    color: rgb(255 255 255 / 85%);
    font-size: 16px;
    line-height: 1;
    cursor: pointer;
    flex: 0 0 auto;
  }

  .clear:hover {
    background: rgb(255 255 255 / 30%);
    color: var(--on-dark);
  }

  .stepper {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    align-items: center;
    gap: 8px;
  }

  .step {
    width: 50px;
    height: 50px;
    border: none;
    border-radius: 50%;
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
  .clear:focus-visible {
    outline: 3px solid var(--gold-400);
    outline-offset: 2px;
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

  input:focus-visible {
    outline: 3px solid var(--gold-400);
    outline-offset: 4px;
    border-radius: var(--radius-sm);
  }

  @media (prefers-reduced-motion: reduce) {
    .step:active {
      transform: none;
    }
  }
</style>
