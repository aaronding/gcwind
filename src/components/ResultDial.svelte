<script>
  // The number you came for, drawn as the thing it describes: concentric aim
  // rings. The filled arc tracks the value against the dial's range, so the
  // reading is legible at a glance before you read the digits.
  let { rings } = $props();

  const RING_COUNT = 5;
  const RADIUS = 86;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
  const SCALE_MAX = 20;

  const value = $derived(rings?.current ?? null);
  const fraction = $derived(value === null ? 0 : Math.min(value / SCALE_MAX, 1));
  const dash = $derived(`${fraction * CIRCUMFERENCE} ${CIRCUMFERENCE}`);
</script>

<div class="dial" data-testid="result-dial">
  <svg viewBox="0 0 200 200" aria-hidden="true">
    {#each Array.from({ length: RING_COUNT }, (_, i) => i) as i (i)}
      <circle class="ring" cx="100" cy="100" r={28 + i * 15} />
    {/each}

    <circle
      class="arc"
      cx="100"
      cy="100"
      r={RADIUS}
      stroke-dasharray={dash}
      transform="rotate(-90 100 100)"
    />
  </svg>

  <div class="face">
    <span class="number" data-testid="result-current">{value ?? '-'}</span>
    <span class="caption">rings</span>
  </div>
</div>

<style>
  .dial {
    position: relative;
    width: min(216px, 62vw);
    aspect-ratio: 1;
    display: grid;
    place-items: center;
    flex: 0 0 auto;
  }

  svg {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
  }

  .ring {
    fill: none;
    stroke: var(--edge);
    stroke-width: 1.5;
  }

  .arc {
    fill: none;
    stroke: var(--gold-500);
    stroke-width: 9;
    stroke-linecap: round;
    transition: stroke-dasharray 260ms cubic-bezier(0.22, 1, 0.36, 1);
  }

  .face {
    position: relative;
    display: grid;
    justify-items: center;
    gap: 2px;
  }

  .number {
    font-family: var(--font-display);
    font-size: clamp(44px, 14vw, 62px);
    font-weight: 800;
    line-height: 1;
    color: var(--ink);
    font-variant-numeric: tabular-nums;
  }

  .caption {
    font-family: var(--font-display);
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--ink-faint);
  }
</style>
