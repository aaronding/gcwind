# ⛳ Wind Calculator

A wind-ring calculator for [Golf Clash](https://www.playdemic.com/golf-clash). Pick a club and level,
enter the wind speed, adjust for power ball, elevation and shot distance, and it tells you how many
wind rings to aim off.

**Live site:** <https://gcwind.webthinking.io>

## Features

- **7 club categories** — drivers, woods, long irons, short irons, wedges, rough irons, sand wedges
- **Per-club levels** — power and accuracy curves for levels 1–10 of every club
- **Wind ring output** at four distances: current, max, mid and min
- **Adjustments** for power ball tier, elevation (%), and shot distance (% of max)
- **Light and dark themes**, following your OS preference
- **No build step, no backend** — open `index.html` and it runs

## Running locally

The app is plain static files, so any HTTP server works:

```bash
python3 -m http.server 8000
```

Then open <http://localhost:8000>.

Opening `index.html` directly via `file://` also works, since there are no `fetch` calls or ES
modules — but a server is closer to production.

## Project structure

```
index.html                 # Markup: tabs, wind input, controls, result panel
styles.css                 # All styling, including light/dark theme variables
scripts/
  windCalculator.js        # WindCalculator class — club data + all wind math
  app.js                   # DOM wiring, state, and rendering
images/clubs/              # Club artwork (PNG), referenced by club data
```

Scripts are loaded as classic `<script>` tags in that order, so `WindCalculator` is a global by the
time `app.js` runs.

## The calculation

`WindCalculator.calculateWindRings()` is the single entry point:

```js
const calculator = new WindCalculator();

calculator.calculateWindRings(
  clubName,      // e.g. "The Rocket"
  level,         // 1–10
  windSpeed,     // in-game wind speed
  elevation,     // percent, default 0
  powerBall,     // power ball tier, default 0
  windBall,      // wind ball tier, default 0
  powerRatio     // shot distance as a fraction of max, default 1
);
// => { current, max, mid, min }
```

Roughly, it looks up the club's power and accuracy at the given level, prorates power for the shot
distance, applies the power ball multiplier, derives wind-per-ring from power and accuracy, then
divides the elevation- and wind-ball-adjusted wind speed by it.

Club stats are currently embedded in `scripts/windCalculator.js` as the `clubData` object.

## Dependencies

[Shoelace](https://shoelace.style/) 2.15.0 for the UI components (tabs, ranges, dialog, buttons),
loaded from jsDelivr's CDN. Nothing is installed or bundled.

## Feedback

There's a feedback button in the app that opens a Google Form, or open an issue on this repo.

## License

MIT — see [LICENSE](LICENSE).
