<script>
  import {
    app,
    persist,
    ELEVATION_SHORTCUTS,
    ELEVATION_VALUES,
    POWER_BALL_SHORTCUTS,
    POWER_BALL_VALUES
  } from './lib/state.svelte.js';
  import ClubTabs from './components/ClubTabs.svelte';
  import ClubPicker from './components/ClubPicker.svelte';
  import LevelPicker from './components/LevelPicker.svelte';
  import WindInput from './components/WindInput.svelte';
  import DistanceSlider from './components/DistanceSlider.svelte';
  import ResultPanel from './components/ResultPanel.svelte';
  import PresetControl from './components/PresetControl.svelte';

  persist();

  let feedback = $state(null);

  const distanceLabel = $derived(
    app.distance === 100
      ? 'Max'
      : app.distance === 50
        ? 'Mid'
        : app.distance === 0
          ? 'Min'
          : `${app.distance}%`
  );
</script>

<div class="page">
  <header>
    <h1>⛳ Wind Calculator</h1>
    <p class="tagline">Pick your club, read the rings.</p>
  </header>

  <ClubTabs bind:value={app.clubType} />

  <section class="panel">
    <ClubPicker
      clubs={app.clubs}
      clubType={app.clubType}
      selected={app.club?.name}
      onselect={(name) => app.selectClub(name)}
    />
    <LevelPicker
      max={app.maxLevel}
      clubType={app.clubType}
      selected={app.level}
      onselect={(level) => app.selectLevel(level)}
    />
  </section>

  <section class="controls">
    <WindInput
      value={app.windSpeed}
      oninput={(raw) => app.setWind(raw)}
      onnudge={(d) => app.nudgeWind(d)}
      onclear={() => (app.windSpeed = NaN)}
    />

    <div class="settings panel">
      <DistanceSlider value={app.distance} onchange={(v) => (app.distance = v)} />
      <PresetControl
        label="Power Ball"
        value={app.powerBall}
        shortcuts={POWER_BALL_SHORTCUTS}
        values={POWER_BALL_VALUES}
        onchange={(v) => (app.powerBall = v)}
      />

      <PresetControl
        label="Elevation"
        value={app.elevation}
        shortcuts={ELEVATION_SHORTCUTS}
        values={ELEVATION_VALUES}
        format={(v) => (v === 0 ? '0' : `${v}%`)}
        onchange={(v) => (app.elevation = v)}
      />
    </div>
  </section>

  <ResultPanel
    rings={app.rings}
    club={app.club}
    level={app.level}
    powerBall={app.powerBall}
    elevation={app.elevation}
    {distanceLabel}
  />

  <section class="links panel">
    <h2>Useful Resources</h2>
    <div class="link-row">
      <a href="https://golfclashnotebook.io" target="_blank" rel="noopener noreferrer">
        📓 Golf Clash Notebook
      </a>
      <a href="https://golfclashtommy.com" target="_blank" rel="noopener noreferrer">
        ⛳ Golf Clash Tommy
      </a>
    </div>
  </section>

  <div class="feedback">
    <button
      class="chunky feedback-btn"
      data-testid="feedback-open"
      onclick={() => feedback.showModal()}
    >
      💬 Share Feedback
    </button>
  </div>

  <footer class="disclaimer">
    <p>
      Not affiliated with, endorsed by, or sponsored by Electronic Arts Inc. or Playdemic. Golf
      Clash is a trademark of Electronic Arts Inc. Club names, artwork and statistics are the
      property of their respective owners.
    </p>
  </footer>
</div>

<dialog
  bind:this={feedback}
  data-testid="feedback-dialog"
  onclick={(e) => e.target === feedback && feedback.close()}
>
  <div class="dialog-body">
    <h2>Feedback</h2>
    <iframe
      title="Feedback form"
      src="https://docs.google.com/forms/d/e/1FAIpQLSd11Q3XrrcepBKiVpuVaU9ErwumYj3MMg79_UE9KJcbV2zsgA/viewform?embedded=true"
    ></iframe>
    <button class="chunky close" data-testid="feedback-close" onclick={() => feedback.close()}>
      Close
    </button>
  </div>
</dialog>

<style>
  .page {
    max-width: 820px;
    margin: 0 auto;
    padding: 20px 16px 48px;
    display: grid;
    /* minmax(0, 1fr), not the implicit auto: an auto column is sized by its
       widest child's min-content, so a single row that refuses to shrink
       stretches the whole page and forces horizontal scrolling. */
    grid-template-columns: minmax(0, 1fr);
    gap: 16px;
  }

  header {
    text-align: center;
    display: grid;
    gap: 2px;
  }

  h1 {
    font-size: clamp(26px, 7vw, 34px);
  }

  .tagline {
    margin: 0;
    color: var(--ink-muted);
    font-size: 14px;
  }

  .panel {
    padding: 14px;
    background: var(--surface);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-card);
    display: grid;
    gap: 12px;
  }

  .controls {
    display: grid;
    grid-template-columns: minmax(0, 260px) minmax(0, 1fr);
    gap: 14px;
    align-items: stretch;
  }

  .settings {
    align-content: center;
    gap: 14px;
  }

  .links h2 {
    font-size: 15px;
    color: var(--ink-muted);
  }

  .link-row {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }

  .link-row a {
    flex: 1 1 180px;
    padding: 12px 14px;
    border-radius: var(--radius);
    background: var(--surface-sunken);
    color: var(--ink);
    text-decoration: none;
    font-weight: 600;
    font-size: 14px;
  }

  .link-row a:hover {
    background: var(--green-100);
  }

  .feedback {
    display: grid;
    justify-items: center;
  }

  .feedback-btn {
    padding: 0 20px;
    font-weight: 700;
  }

  .disclaimer {
    border-top: 1px solid var(--edge);
    padding-top: 16px;
    text-align: center;
  }

  .disclaimer p {
    margin: 0 auto;
    max-width: 60ch;
    font-size: 12px;
    line-height: 1.6;
    color: var(--ink-faint);
  }

  dialog {
    border: none;
    border-radius: var(--radius-lg);
    padding: 0;
    max-width: 94vw;
    background: var(--surface);
    color: var(--ink);
  }

  dialog::backdrop {
    background: rgb(8 20 12 / 55%);
  }

  .dialog-body {
    padding: 18px;
    display: grid;
    gap: 12px;
    justify-items: center;
  }

  iframe {
    width: min(640px, 86vw);
    height: min(560px, 62vh);
    border: none;
  }

  .close {
    padding: 0 26px;
    font-weight: 700;
  }

  @media (max-width: 680px) {
    .controls {
      grid-template-columns: 1fr;
    }
  }
</style>
