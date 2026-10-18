<script>
  import {
    app,
    persist,
    ELEVATION_SHORTCUTS,
    ELEVATION_STEP,
    ELEVATION_VALUES,
    POWER_BALL_SHORTCUTS,
    POWER_BALL_VALUES
  } from './lib/state.svelte.js';
  import logo from './assets/logo.svg';
  import ClubTabs from './components/ClubTabs.svelte';
  import ClubPicker from './components/ClubPicker.svelte';
  import LevelPicker from './components/LevelPicker.svelte';
  import BagBar from './components/BagBar.svelte';
  import BagClubs from './components/BagClubs.svelte';
  import BagEditor from './components/BagEditor.svelte';
  import BagManager from './components/BagManager.svelte';
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
  let editor = $state(null);
  let manager = $state(null);

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

<header class="site-header">
  <div class="bar">
    <!-- The flag is hidden from assistive technology and the gradient span is
         inline, so the heading's accessible name is exactly "gcwind". -->
    <h1 class="wordmark" data-testid="wordmark">
      <img class="logo" src={logo} alt="" />gc<span class="wind">wind</span>
    </h1>
    <div class="actions">
      <button
        class="feedback-button"
        data-testid="feedback-open"
        onclick={() => feedback.showModal()}
      >
        <svg viewBox="0 0 16 16" aria-hidden="true">
          <path d="M2.5 3.5h11v7h-6l-3 2.5v-2.5h-2z" />
        </svg>
        <span class="feedback-label">Feedback</span>
      </button>
      <ThemeToggle />
    </div>
    <p class="tagline">Golf Clash wind calculator</p>
  </div>
</header>

<div class="page">
  <div class="in-use">
    <BagBar
      account={app.account}
      flex={app.mode === 'flex'}
      onflex={() => app.useFlex()}
      onbag={(i) => app.switchBag(i)}
      onadd={() => app.addBag()}
      onmanage={() => manager.open()}
    />

    {#if app.mode === 'flex'}
      <ClubTabs bind:value={() => app.clubType, (type) => app.selectClubType(type)} />

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
    {:else}
      <section class="panel">
        <BagClubs
          selections={app.bag.selections}
          selected={app.clubType}
          onselect={(type) => app.selectClubType(type)}
          onedit={() => editor.open()}
        />
      </section>
    {/if}
  </div>

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
        step={ELEVATION_STEP}
        onnudge={(d) => app.nudgeElevation(d)}
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
    clubType={app.clubType}
    categoryAdjustment={app.categoryAdjustment}
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
      © 2006 webthinking.io
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
  <p class="version" data-testid="app-version">Version {__APP_VERSION__}</p>
</Modal>

<FeedbackDialog bind:dialog={feedback} />

<BagEditor bind:this={editor} />

<BagManager bind:this={manager} onedit={(i) => editor.open(i)} />

<style>
  .page {
    max-width: 820px;
    margin: 0 auto;
    padding: 16px 16px 48px;
    display: grid;
    /* minmax(0, 1fr), not the implicit auto: an auto column is sized by its
       widest child's min-content, so a single row that refuses to shrink
       stretches the whole page and forces horizontal scrolling. */
    grid-template-columns: minmax(0, 1fr);
    gap: 16px;
  }

  /* A full-width band one step up from the page, closed off by a hairline, so
     the header reads as chrome rather than as the first card of content. */
  .site-header {
    background: var(--surface);
    border-bottom: 1px solid var(--edge);
  }

  /* Lined up with .page: same width, same side padding. The tagline takes a
     row of its own so the wordmark and the actions share the first row even
     on a 320px phone. */
  .bar {
    max-width: 820px;
    margin: 0 auto;
    padding: 14px 16px 12px;
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    grid-template-areas:
      'brand actions'
      'tagline tagline';
    align-items: center;
    column-gap: 12px;
    row-gap: 2px;
  }

  /* "gc" in the text colour, "wind" running from fairway green to sky blue,
     after the webthinking.io and padbench.com wordmarks. */
  .wordmark {
    grid-area: brand;
    font-size: clamp(26px, 6vw, 34px);
    font-weight: 700;
    letter-spacing: -0.045em;
    line-height: 1.1;
  }

  /* The app icon, a little taller than the lowercase letters it leads. */
  .logo {
    width: 1.05em;
    height: 1.05em;
    margin-right: 0.22em;
    vertical-align: -0.17em;
  }

  .wind {
    background: linear-gradient(90deg, var(--wordmark-1), var(--wordmark-2) 55%, var(--wordmark-3));
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    /* Shown wherever background-clip: text is not supported. */
    color: var(--wordmark-2);
  }

  .actions {
    grid-area: actions;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .tagline {
    grid-area: tagline;
    margin: 0;
    color: var(--ink-muted);
    font-size: 14px;
  }

  .feedback-button {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    height: 34px;
    padding: 0 12px;
    border: 1.5px solid var(--green-500);
    border-radius: 999px;
    background: var(--green-100);
    color: var(--accent-ink);
    font-size: 14px;
    font-weight: 700;
    white-space: nowrap;
    cursor: pointer;
    transition:
      background-color 120ms ease,
      color 120ms ease;
  }

  .feedback-button:hover {
    border-color: var(--green-700);
    background: var(--green-700);
    color: var(--on-dark);
  }

  .feedback-button:focus-visible {
    outline: 3px solid var(--green-500);
    outline-offset: 2px;
  }

  .in-use {
    display: grid;
    gap: 10px;
  }

  .feedback-button svg {
    width: 16px;
    height: 16px;
    flex: none;
    fill: none;
    stroke: currentColor;
    stroke-width: 1.6;
    stroke-linejoin: round;
  }

  /* On phones the pill keeps its icon and outline and moves the word to the
     accessibility tree, which leaves the header row to the wordmark. Same
     breakpoint as the stacked .controls below. */
  @media (max-width: 680px) {
    .feedback-button {
      width: 34px;
      padding: 0;
      justify-content: center;
    }

    .feedback-label {
      position: absolute;
      width: 1px;
      height: 1px;
      overflow: hidden;
      clip-path: inset(50%);
      white-space: nowrap;
    }
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
    grid-template-columns: minmax(0, 340px) minmax(0, 1fr);
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

  .site-footer {
    border-top: 1px solid var(--edge);
    padding-top: 14px;
    display: flex;
    flex-wrap: wrap;
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

  .version {
    color: var(--muted, inherit);
    font-size: 0.85em;
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
