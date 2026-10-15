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
  import Modal from './components/Modal.svelte';
  import FeedbackDialog from './components/FeedbackDialog.svelte';
  import ThemeToggle from './components/ThemeToggle.svelte';
  import { applyTheme } from './lib/theme.svelte.js';

  persist();
  applyTheme();

  let feedback = $state(null);
  let about = $state(null);

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
    <div class="titles">
      <h1>⛳ Wind Calculator</h1>
      <p class="tagline">Pick your club, read the rings.</p>
    </div>
    <ThemeToggle />
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
      <a href="https://golfclashtommy.com" target="_blank" rel="noopener noreferrer">
        ⛳ Golf Clash Tommy
      </a>
      <a href="https://www.youtube.com/@GolfClashTommy" target="_blank" rel="noopener noreferrer">
        ▶️ Tommy on YouTube
      </a>
      <a href="https://www.reddit.com/r/GolfClash/" target="_blank" rel="noopener noreferrer">
        💬 r/GolfClash
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

  <footer class="site-footer">
    <button class="footer-link" data-testid="about-open" onclick={() => about.showModal()}>
      About &amp; disclaimer
    </button>
    <span aria-hidden="true">·</span>
    <a
      class="footer-link"
      href="https://webthinking.io"
      data-testid="webthinking-link"
      target="_blank"
      rel="noopener noreferrer"
    >
      webthinking.io
    </a>
  </footer>
</div>

<Modal bind:dialog={about} testid="about-dialog" title="About this tool">
  <p>
    A wind ring calculator for Golf Clash. Pick your club and level, enter the wind speed, adjust
    for power ball, elevation and shot distance, and it tells you how many rings to aim off.
  </p>
  <p>
    One of a few small browser tools at
    <a href="https://webthinking.io" target="_blank" rel="noopener noreferrer">webthinking.io</a>.
    The calculation runs entirely on your device; nothing you pick is sent anywhere.
  </p>
  <p>
    This is an unofficial fan-made tool. It is not affiliated with, endorsed by, or sponsored by
    Electronic Arts Inc. or Playdemic. Golf Clash is a trademark of Electronic Arts Inc. Club names,
    artwork and statistics are the property of their respective owners.
  </p>
</Modal>

<FeedbackDialog bind:dialog={feedback} />

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
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  .titles {
    display: grid;
    gap: 2px;
    min-width: 0;
  }

  h1 {
    /* Small enough that the title does not wrap beside the theme toggle on a
       375px phone, and still the largest thing in the header. */
    font-size: clamp(21px, 5.6vw, 34px);
    line-height: 1.15;
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

  .site-footer {
    border-top: 1px solid var(--edge);
    padding-top: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 2px;
    color: var(--ink-faint);
    font-size: 13px;
  }

  .footer-link {
    border: none;
    background: none;
    font: inherit;
    padding: 6px 10px;
    font-size: 13px;
    color: var(--ink-faint);
    text-decoration: underline;
    text-underline-offset: 3px;
    cursor: pointer;
    border-radius: var(--radius-sm);
  }

  .footer-link:hover {
    color: var(--ink);
  }

  .footer-link:focus-visible {
    outline: 3px solid var(--green-500);
    outline-offset: 2px;
  }

  @media (max-width: 680px) {
    .controls {
      grid-template-columns: 1fr;
    }
  }
</style>
