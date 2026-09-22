# ⛳ Wind Calculator

A wind-ring calculator for [Golf Clash](https://www.playdemic.com/golf-clash). Pick a club and level,
enter the wind speed, adjust for power ball, elevation and shot distance, and it tells you how many
wind rings to aim off.

**Live site:** <https://gcwind.webthinking.io>

## Features

- **7 club categories** — drivers, woods, long irons, short irons, wedges, rough irons, sand wedges
- **Per-club levels**, capped by rarity (Common 10, Rare 9, Epic 8)
- **Wind ring output** at four distances: current, max, mid and min
- **Adjustments** for power ball tier, elevation (%), and shot distance (% of max)
- **Light and dark themes**, following your OS preference
- **No build step and no backend** — static files served as-is

## Running locally

The app uses ES modules and fetches its club data, so it needs to be served over HTTP rather than
opened as a `file://` URL:

```bash
npm start
```

That serves the directory on <http://localhost:8000>. Any static server works equally well.

## Development

```bash
npm install          # dev tooling only — the app itself has no runtime dependencies
npm run lint         # ESLint
npm run format       # Prettier, writing changes
npm run validate     # sanity-check data/clubs.json against the calculator
```

`npm run lint`, `npm run format:check` and `npm run validate` also run in CI on every push and pull
request against `main`.

## Project structure

```
index.html                 # Markup: tabs, wind input, controls, result panel
styles.css                 # All styling, including light/dark theme variables
data/clubs.json            # Club stats: power and accuracy curves per level
scripts/
  windCalculator.js        # WindCalculator class — the wind math
  app.js                   # Entry point: DOM wiring, state, and rendering
tools/
  validate-clubs.js        # Club data sanity checks, used by CI
images/clubs/              # Club artwork (PNG), referenced from data/clubs.json
```

`index.html` loads `scripts/app.js` as a single ES module; `app.js` imports the calculator, fetches
the club data, builds the UI and only then attaches event listeners.

## The calculation

`WindCalculator.calculateWindRings()` is the single entry point:

```js
import { WindCalculator } from './scripts/windCalculator.js';

const calculator = await WindCalculator.load(); // fetches data/clubs.json

calculator.calculateWindRings(
  clubName, // e.g. "The Rocket"
  level, // 1–10, capped by rarity
  windSpeed, // in-game wind speed
  elevation, // percent, default 0
  powerBall, // power ball tier, default 0
  windBall, // wind ball tier, default 0
  powerRatio // shot distance as a fraction of max, default 1
);
// => { current, max, mid, min }
```

Roughly: it looks up the club's power and accuracy at the given level, prorates power for the shot
distance, applies the power ball multiplier, derives wind-per-ring from power and accuracy, then
divides the elevation- and wind-ball-adjusted wind speed by it.

To construct one synchronously — in a test, say — pass the data straight in:

```js
new WindCalculator(clubData);
```

## Adding or updating club data

Edit `data/clubs.json`. Each club needs a `name`, `category`, `type` (rarity), `image`, and `power`
and `accuracy` arrays with one entry per level — the two arrays must be the same length. Drop the
artwork in `images/clubs/` and point `image` at it. Then run `npm run validate`.

## Dependencies

[Shoelace](https://shoelace.style/) 2.15.0 for the UI components (tabs, ranges, dropdowns, dialog),
loaded from jsDelivr's CDN. Nothing is bundled; `npm install` only fetches lint and format tooling.

## Feedback

There's a feedback button in the app that opens a Google Form, or open an issue on this repo.

## Disclaimer

This is an unofficial fan-made tool. It is not affiliated with, endorsed by, or sponsored by
Electronic Arts Inc. or Playdemic. Golf Clash is a trademark of Electronic Arts Inc. Club names,
artwork and statistics are the property of their respective owners.

## License

The MIT licence covers the code in this repository, not the Golf Clash assets it references.
See [LICENSE](LICENSE).
