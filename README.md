# ⛳ gcwind

A wind ring calculator for Golf Clash. Choose your bag and the club in hand (or any club
and level), enter the wind speed, adjust for ball power, elevation and shot distance, and it
tells you how many rings to aim off.

**Live:** <https://gcwind.webthinking.io>

## Features

- **Bags**: up to five, as in the game. Set each one up once, then switch bags in one tap and
  tap the club the game picked
- **Flex**, beside the bags: any club at any level, for checkpoints
- All seven club categories, with per-club stats at every level
- Rings at four distances: current, max, mid and min
- Adjusts for ball power, elevation and shot distance
- Elevation steps up and down by 5% with − and +, and starts at 20% when you pick a wedge
  (the Endbringer rule)
- Clubs tinted by rarity, so tier is readable at a glance
- Remembers your bags and picks between visits, in this browser only
- Light, dark, or follow the system, remembered between visits
- Built for one-handed use on a phone

How bags, Flex and accounts work, and what is planned next, is in
[docs/modes-and-bags.md](docs/modes-and-bags.md).

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
pnpm run icons       # redraw the app icon and favicon
pnpm test            # calculator unit and golden tests
pnpm run test:e2e    # browser tests against a local build
pnpm run deploy      # publish to the Cloudflare Worker, then check nothing was injected
pnpm run check:deploy # check the live page on its own
pnpm run dev:worker  # run the Worker locally, including /api/feedback
pnpm run feedback    # print the latest feedback from D1
pnpm run db:migrate  # apply migrations/ to the D1 database
```

The dev server does not run the Worker, so `/api/feedback` only answers under
`pnpm run dev:worker` or once deployed.

`pnpm run test:e2e:prod` runs the same browser tests against the live site.

Linting, formatting, data validation, unit tests and end-to-end tests all run in CI on every
push and pull request.

Built with help from [Claude Code](https://claude.com/claude-code).

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
