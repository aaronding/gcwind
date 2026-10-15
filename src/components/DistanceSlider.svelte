<script>
  let { value, onchange } = $props();

  const label = $derived(
    value === 100 ? 'Max' : value === 50 ? 'Mid' : value === 0 ? 'Min' : `${value}%`
  );
</script>

<div class="row">
  <label class="label" for="distance">Distance</label>

  <input
    id="distance"
    type="range"
    min="0"
    max="100"
    step="1"
    {value}
    data-testid="distance-slider"
    oninput={(e) => onchange(Number(e.currentTarget.value))}
  />

  <output class="value" data-testid="distance-value" for="distance">{label}</output>
</div>

<style>
  .row {
    display: grid;
    grid-template-columns: auto 1fr auto;
    align-items: center;
    gap: 12px;
  }

  .label {
    font-family: var(--font-display);
    font-weight: 700;
    color: var(--ink-muted);
    font-size: 15px;
  }

  .value {
    font-family: var(--font-display);
    font-weight: 800;
    font-size: 15px;
    min-width: 52px;
    text-align: right;
    font-variant-numeric: tabular-nums;
  }

  input[type='range'] {
    appearance: none;
    width: 100%;
    height: 22px;
    background: transparent;
    cursor: pointer;
  }

  input[type='range']::-webkit-slider-runnable-track {
    height: 10px;
    border-radius: 999px;
    background: var(--surface-sunken);
    box-shadow: inset 0 1px 2px rgb(0 0 0 / 12%);
  }

  input[type='range']::-moz-range-track {
    height: 10px;
    border-radius: 999px;
    background: var(--surface-sunken);
  }

  input[type='range']::-webkit-slider-thumb {
    appearance: none;
    width: 24px;
    height: 24px;
    margin-top: -7px;
    border-radius: 50%;
    background: var(--green-500);
    border: 3px solid var(--surface);
    box-shadow: 0 2px 0 var(--green-700);
  }

  input[type='range']::-moz-range-thumb {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: var(--green-500);
    border: 3px solid var(--surface);
  }

  input[type='range']:focus-visible {
    outline: 3px solid var(--green-500);
    outline-offset: 4px;
    border-radius: 999px;
  }
</style>
