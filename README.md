# ⛳ gcwind

A wind ring calculator for Golf Clash. Pick your club and level, enter the wind speed,
adjust for power ball, elevation and shot distance, and it tells you how many rings to aim off.

**Live:** <https://gcwind.webthinking.io>

## Features

- All seven club categories, with per-club stats at every level
- Rings at four distances: current, max, mid and min
- Adjusts for power ball, elevation and shot distance
- Light and dark themes
- Built for one-handed use on a phone

## Running locally

```bash
npm start
```

Serves the app on <http://localhost:8000>.

## Development

```bash
npm install       # dev tooling only
npm run lint
npm run format
npm run validate  # sanity-check the club data
npm run images    # re-encode the club art
```

Linting, formatting and club data validation run in CI on every push and pull request.

## Feedback

There's a feedback button in the app, or open an issue here.

## Disclaimer

This is an unofficial fan-made tool. It is not affiliated with, endorsed by, or sponsored by
Electronic Arts Inc. or Playdemic. Golf Clash is a trademark of Electronic Arts Inc. Club names,
artwork and statistics are the property of their respective owners.

## License

The MIT licence covers the code in this repository, not the Golf Clash assets it references.
See [LICENSE](LICENSE).
