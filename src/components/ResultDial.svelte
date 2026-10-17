<script>
  // The number you came for, drawn as the thing it describes: aim rings around
  // a gold bullseye that holds the reading. Gold is the result's colour and
  // nothing else's, so the eye lands here first. The filled arc tracks the
  // value against the dial's range, so the reading is legible at a glance
  // before you read the digits.
  let { rings } = $props();

  const RADIUS = 86;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
  const SCALE_MAX = 20;
  /** The bullseye, wide enough for a reading like "12.5" at full size. */
  const CORE = 58;
  /** Faint rings inside the bullseye and plain ones around it. */
  const INNER_RINGS = [28, 43];
  const OUTER_RINGS = [73, 88];

  const value = $derived(rings?.current ?? null);
  const fraction = $derived(value === null ? 0 : Math.min(value / SCALE_MAX, 1));
  const dash = $derived(`${fraction * CIRCUMFERENCE} ${CIRCUMFERENCE}`);
</script>

<div class="dial" class:empty={value === null} data-testid="result-dial">
  <svg viewBox="0 0 200 200" aria-hidden="true">
    {#each OUTER_RINGS as r (r)}
      <circle class="ring" cx="100" cy="100" {r} />
    {/each}

    <circle class="core" cx="100" cy="100" r={CORE} />
    {#each INNER_RINGS as r (r)}
      <circle class="core-ring" cx="100" cy="100" {r} />
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
    /* 56vw leaves room for Max, Mid and Min beside it on a 320px phone. */
    width: min(240px, 56vw);
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

  /* Gold in both themes, so the digits on it are a fixed dark green rather
     than the theme's ink, which turns light in dark mode. */
  .core {
    fill: var(--gold-400);
    transition: fill 200ms ease;
  }

  .core-ring {
    fill: none;
    stroke: rgb(18 51 27 / 12%);
    stroke-width: 1.5;
  }

  .arc {
    fill: none;
    stroke: var(--gold-500);
    stroke-width: 9;
    stroke-linecap: round;
    transition: stroke-dasharray 260ms cubic-bezier(0.22, 1, 0.36, 1);
  }

  /* The number alone sits at the dial's centre; the caption hangs below it
     rather than sharing the centring, which would lift the number. */
  .face {
    position: relative;
    display: grid;
    justify-items: center;
  }

  .caption {
    position: absolute;
    top: 100%;
    margin-top: 2px;
  }

  .number {
    font-family: var(--font-display);
    font-size: clamp(44px, 14vw, 66px);
    font-weight: 800;
    line-height: 1;
    color: var(--green-900);
    font-variant-numeric: tabular-nums;
    letter-spacing: -0.02em;
  }

  .caption {
    font-family: var(--font-display);
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: rgb(18 51 27 / 70%);
  }

  /* No reading yet (the wind is cleared): a quiet grey dial, nothing gold. */
  .empty .core {
    fill: var(--surface-sunken);
  }

  .empty .core-ring {
    stroke: var(--edge);
  }

  /* A zero-length arc still draws its round cap as a dot. */
  .empty .arc {
    stroke: transparent;
  }

  .empty .number,
  .empty .caption {
    color: var(--ink-faint);
  }
</style>
