<script>
  import ResultDial from './ResultDial.svelte';

  let { rings, club, level, powerBall, elevation, distanceLabel } = $props();

  const show = (v) => (rings ? v : '-');
</script>

<section class="result">
  <ResultDial {rings} />

  <div class="side">
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
        {#if club}
          <img
            src={`images/${club.image}`}
            alt=""
            width="44"
            height="44"
            data-testid="detail-club-image"
          />
        {/if}
        <div class="club-text">
          <span class="club-name">{club?.name ?? '–'}</span>
          <span class="club-level" data-testid="detail-level">Lv. {level}</span>
        </div>
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
  </div>
</section>

<style>
  .result {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 18px;
    padding: 18px;
    background: var(--surface);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-card);
  }

  .side {
    flex: 1 1 210px;
    display: grid;
    gap: 14px;
  }

  .spread {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
  }

  .stat {
    display: grid;
    justify-items: center;
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
    display: grid;
    gap: 12px;
  }

  .club {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .club img {
    width: 44px;
    height: 44px;
    object-fit: contain;
  }

  .club-text {
    display: grid;
  }

  .club-name {
    font-family: var(--font-display);
    font-weight: 800;
    font-size: 15px;
    line-height: 1.2;
  }

  .club-level {
    font-size: 13px;
    color: var(--ink-muted);
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
</style>
