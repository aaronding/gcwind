<script>
  import ResultDial from './ResultDial.svelte';

  let {
    rings,
    club,
    level,
    powerBall,
    elevation,
    distanceLabel,
    clubType,
    categoryAdjustment = 0
  } = $props();

  const categoryNames = { roughirons: 'Rough iron', sandwedges: 'Sand wedge' };

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
        <dt>Power Ball</dt>
        <dd data-testid="detail-powerball">{powerBall}</dd>
      </div>
      <div>
        <dt>Elevation</dt>
        <dd data-testid="detail-elevation">{elevation}%</dd>
      </div>
      <div>
        <dt>Distance</dt>
        <dd data-testid="detail-distance">{distanceLabel}</dd>
      </div>
    </dl>
  </div>

  {#if categoryAdjustment > 0}
    <p class="note" data-testid="category-note">
      {categoryNames[clubType] ?? 'Club type'} adjustment already applied ({categoryAdjustment}%
      fewer rings{clubType === 'roughirons' ? ', the "rough iron rule"' : ''}). Enter the elevation
      the game shows.
    </p>
  {/if}
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
    background: var(--surface);
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
    background: var(--surface-sunken);
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

  /* The same badge as the bag's club cards. */
  .level-badge {
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

  /* Placed in a row of its own only when it is shown, so its gap never
     leaves a blank strip at the bottom of the card. */
  .note {
    grid-column: 1 / -1;
    margin: 0;
    padding: 9px 12px;
    font-size: 13px;
    line-height: 1.4;
    color: var(--ink-muted);
    background: var(--surface-sunken);
    border-radius: var(--radius-sm);
  }

  dd {
    margin: 0;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
  }
</style>
