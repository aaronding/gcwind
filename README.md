# ⛳ gcwind

A wind ring calculator for Golf Clash. Pick your club and level, enter the wind speed,
adjust for power ball, elevation and shot distance, and it tells you how many rings to aim off.

**Live:** <https://gcwind.webthinking.io>

## Features

- All seven club categories, with per-club stats at every level
- Rings at four distances: current, max, mid and min
- Adjusts for power ball, elevation and shot distance
- Clubs tinted by rarity, so tier is readable at a glance
- Remembers your selections between visits
- Light and dark themes
- Built for one-handed use on a phone

## Running locally

```bash
pnpm install
pnpm run dev
```

## Development

```bash
pnpm run build       # production build into _site/
pnpm run preview     # serve the build
pnpm run lint
pnpm run format
pnpm run validate    # sanity-check the club data
pnpm run images      # re-encode the club art
pnpm test            # calculator unit and golden tests
pnpm run test:e2e    # browser tests against a local build
pnpm run deploy      # publish to the Cloudflare Worker
pnpm run dev:worker  # run the Worker locally, including /api/feedback
pnpm run feedback    # print the latest feedback from D1
pnpm run db:migrate  # apply migrations/ to the D1 database
```

The dev server does not run the Worker, so `/api/feedback` only answers under
`pnpm run dev:worker` or once deployed.

`pnpm run test:e2e:prod` runs the same browser tests against the live site.

Linting, formatting, data validation, unit tests and end-to-end tests all run in CI on every
push and pull request.

## Feedback

The app has a feedback form that posts to this site's own `/api/feedback`, so no
third-party form service sees what people write. Messages go to a Cloudflare D1
database, are kept for a year, and are deleted after that by the Worker's daily
Cron Trigger. Nothing is sent until Send is pressed, and nothing beyond the
message itself is collected.

Read them with `pnpm run feedback`, or open an issue here.

## Disclaimer

This is an unofficial fan-made tool. It is not affiliated with, endorsed by, or sponsored by
Electronic Arts Inc. or Playdemic. Golf Clash is a trademark of Electronic Arts Inc. Club names,
artwork and statistics are the property of their respective owners.

## License

The MIT licence covers the code in this repository, not the Golf Clash assets it references.
See [LICENSE](LICENSE).
