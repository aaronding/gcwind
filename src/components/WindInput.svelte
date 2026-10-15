<script>
  import { WIND_MIN, WIND_MAX } from '../lib/state.svelte.js';

  let { value, oninput, onnudge, onclear } = $props();

  const display = $derived(Number.isFinite(value) ? value.toFixed(1) : '');
</script>

<div class="wind">
  <button class="clear" data-testid="wind-clear" aria-label="Clear wind speed" onclick={onclear}>
    ×
  </button>

  <label class="label" for="wind">Wind Speed</label>

  <div class="readout">
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
  </div>

  <div class="steppers">
    <button
      class="step chunky"
      data-testid="wind-decrease"
      aria-label="Decrease wind speed"
      onclick={() => onnudge(-0.1)}
    >
      −
    </button>
    <button
      class="step chunky"
      data-testid="wind-increase"
      aria-label="Increase wind speed"
      onclick={() => onnudge(0.1)}
    >
      +
    </button>
  </div>
</div>

<style>
  .wind {
    position: relative;
    display: grid;
    gap: 10px;
    justify-items: center;
    padding: 16px 14px;
    border-radius: var(--radius-lg);
    /* The one place a gradient earns its keep: this is the input you touch most. */
    background: linear-gradient(160deg, var(--green-500), var(--green-700));
    box-shadow:
      0 5px 0 var(--green-900),
      var(--shadow-card);
  }

  .label {
    font-family: var(--font-display);
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: rgb(255 255 255 / 85%);
  }

  .readout {
    position: relative;
    display: flex;
    align-items: center;
  }

  input {
    width: 100%;
    max-width: 180px;
    border: none;
    background: transparent;
    color: var(--on-dark);
    font-family: var(--font-display);
    font-size: 54px;
    font-weight: 800;
    line-height: 1;
    text-align: center;
    padding: 0;
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

  .clear {
    position: absolute;
    right: 10px;
    top: 10px;
    width: 30px;
    height: 30px;
    border: none;
    border-radius: 50%;
    background: rgb(255 255 255 / 22%);
    color: var(--on-dark);
    font-size: 19px;
    line-height: 1;
    cursor: pointer;
  }

  .clear:hover {
    background: rgb(255 255 255 / 34%);
  }

  .steppers {
    display: flex;
    gap: 14px;
  }

  .step {
    width: 54px;
    min-height: 40px;
    border-radius: 999px;
    background: rgb(255 255 255 / 20%);
    color: var(--on-dark);
    font-size: 22px;
    font-weight: 700;
    line-height: 1;
    box-shadow: 0 3px 0 rgb(0 0 0 / 22%);
  }

  .step:active:not(:disabled) {
    transform: translateY(3px);
    box-shadow: 0 0 0 rgb(0 0 0 / 22%);
  }
</style>
