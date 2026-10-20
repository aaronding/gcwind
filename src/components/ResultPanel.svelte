<script>
  import ResultDial from './ResultDial.svelte';

  let { rings, club, level, powerBall, elevation, distanceLabel, distanceAdjusted } = $props();

  const show = (v) => (rings ? v : '-');
</script>

<section class="result">
  <div class="dial">
    <ResultDial {rings} />
  </div>

  <div class="spread">
    {#each [['Max', rings?.max, 'result-max'], ['Mid', rings?.mid, 'result-mid'], ['Min', rings?.min, 'result-min']] as [name, value, id] (id)}
      <div class="stat">
        <span class="stat-label">{name}</span>
        <span class="stat-value" data-testid={id}>{show(value)}</span>
      </div>
    {/each}
  </div>

  <div class="details">
    <div class="club">
      <!-- The level sits on the picture, the way the game shows it. -->
      <span class="pic">
        {#if club}
          <img
            src={`images/${club.image}`}
            alt=""
            width="52"
            height="52"
            data-testid="detail-club-image"
          />
        {/if}
        <span
          class="level-badge"
          data-rarity={club?.type}
          data-testid="detail-level"
          aria-hidden="true">{level}</span
        >
      </span>
      <span class="club-name">
        {club?.name ?? '–'}<span class="visually-hidden">, level {level}</span>
      </span>
    </div>

    <dl>
      <div>
        <dt>Ball Power</dt>
        <dd data-testid="detail-powerball">{powerBall}</dd>
      </div>
      <div>
        <dt>Elevation</dt>
        <dd data-testid="detail-elevation">{elevation}%</dd>
      </div>
      <div>
        <dt>Distance</dt>
        <!-- Max is the usual shot; anything else is easy to miss on the
             slider, so the card flags it. -->
        <dd data-testid="detail-distance" data-adjusted={distanceAdjusted}>{distanceLabel}</dd>
      </div>
    </dl>
  </div>
</section>

<style>
  /* Max, Mid and Min always stack beside the dial. On a phone the club and its
     settings go underneath, side by side; on a wider screen they move to the
     other side of the dial, which leaves it in the middle of the card. */
  .result {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    grid-template-areas:
      'dial spread'
      'details details';
    align-items: center;
    gap: 16px 14px;
    padding: 16px;
    background: var(--result-surface);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-card);
  }

  .dial {
    grid-area: dial;
  }

  .spread {
    grid-area: spread;
    align-self: stretch;
    display: grid;
    grid-auto-rows: 1fr;
    gap: 8px;
  }

  .stat {
    display: grid;
    justify-items: center;
    align-content: center;
    gap: 2px;
    padding: 9px 6px;
    background: var(--result-sunken);
    border-radius: var(--radius-sm);
  }

  .stat-label {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.09em;
    text-transform: uppercase;
    color: var(--ink-faint);
  }

  .stat-value {
    font-family: var(--font-display);
    font-size: 20px;
    font-weight: 800;
    font-variant-numeric: tabular-nums;
  }

  .details {
    grid-area: details;
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    align-items: center;
    gap: 12px 16px;
  }

  /* The app's own breakpoint for side-by-side controls. */
  @media (min-width: 681px) {
    .result {
      grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
      grid-template-areas: 'details dial spread';
      gap: 22px;
      padding: 18px 22px;
    }

    .details {
      grid-template-columns: minmax(0, 1fr);
      gap: 14px;
    }
  }

  /* In a wide, short window (see App.svelte) the card is a column beside the
     controls, laid out as on a phone: Max, Mid and Min beside the dial, and
     the club and its settings side by side under both. */
  @media (min-width: 1024px) and (max-height: 899px) {
    /* Stretched to the controls' height, the dial's row takes the room. */
    .result {
      grid-template-columns: auto minmax(0, 1fr);
      grid-template-rows: 1fr auto;
      grid-template-areas:
        'dial spread'
        'details details';
      gap: 16px;
      padding: 20px;
    }

    /* The club's side a little wider, so a name like The Hammerhead fits
       beside its picture in the narrowest column. */
    .details {
      grid-template-columns: minmax(0, 1.25fr) minmax(0, 1fr);
      gap: 12px 16px;
      padding-top: 16px;
      border-top: 1px solid var(--result-sunken);
    }

    .details .club {
      gap: 12px;
    }
  }

  .club {
    display: flex;
    align-items: center;
    gap: 16px;
    min-width: 0;
  }

  .pic {
    position: relative;
    flex: 0 0 auto;
    display: grid;
    place-items: center;
    width: 52px;
    height: 52px;
  }

  .pic img {
    width: 52px;
    height: 52px;
    object-fit: contain;
  }

  /* The same badge as the bag's club cards, on this card's gold. */
  .level-badge {
    --badge-ring: var(--result-surface);
    right: -8px;
    bottom: -4px;
  }

  .club-name {
    min-width: 0;
    font-family: var(--font-display);
    font-weight: 800;
    font-size: 15px;
    line-height: 1.2;
  }

  dl {
    margin: 0;
    display: grid;
    gap: 4px;
  }

  dl div {
    display: flex;
    justify-content: space-between;
    gap: 10px;
    font-size: 14px;
  }

  dt {
    color: var(--ink-muted);
  }

  dd {
    margin: 0;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
  }

  /* A gold pill with dark text, which keeps its contrast in both themes. Its
     padding hangs out past the edge, so the text stays in line with the
     values above it. */
  dd[data-adjusted='true'] {
    margin-right: -9px;
    padding: 0 9px;
    border-radius: 999px;
    background: var(--gold-400);
    color: var(--green-900);
  }
</style>
