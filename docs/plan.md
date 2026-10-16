# Plan

Status: October 2026, revised after review. What gcwind does now, what is queued, what
other Golf Clash tools offer, and the order for the next pieces of work. As before, each
step is its own pull request, reviewed before the next one starts.

The research was done on 16 October 2026 from each tool's own site, store listing or source
code. Every claim links to where it came from, and anything that could not be checked is
marked "unverified". Reddit could not be read, so r/GolfClash threads are not covered.

## In short

1. **Backup and sync bags**, next: a backup code and link to move bags between devices
   and keep them safe, then an optional sync code.
2. **Easier wind, ball and elevation controls**, with the ring count on a phone's first
   screen.
3. **Tips**: power hooks and slices, and working out wedge rings without the app.
4. **Tournament planner** (step 4): 9 or 18 holes, a plan and a free note per hole, no
   sign-in.
5. **Accounts** (step 3), last.

See [Decisions](#decisions) for what review settled, and [Open questions](#open-questions)
for what is still open.

## Where gcwind is now

Live at gcwind.webthinking.io:

- bags and Flex: one to five bags per account, each with a club and level per type, and
  Flex for any club at any level;
- 49 clubs: the common, rare and epic clubs of each type;
- wind with a stepper and a slider, power ball 0 to 10, elevation from −30% to +50%, and
  shot distance from max to min. The wind field opens the number pad, and typing 87 or 087
  gives 8.7;
- rings at the current distance, and at max, mid and min, with the ring count as the
  largest number on the page;
- the rough iron and sand wedge adjustments built in, and explained on the result;
- light and dark themes, a first-party feedback form, no sign-in, no ads, nothing tracked.

gcwind's club data matches Golf Clash Tommy's published data for all 49 clubs: power and
accuracy agree at every level ([his data](https://golfclashtommy.com/data/clubs/drivers.json)).

## To-do list

| #   | Item                                     | Status           | Notes                                                                                                            |
| --- | ---------------------------------------- | ---------------- | ---------------------------------------------------------------------------------------------------------------- |
| 1   | Backup and sync bags                     | Next             | Was step 5 of [modes-and-bags.md](modes-and-bags.md#plan); now first. See [below](#1-backup-and-sync-bags-next). |
| 2   | Easier wind, ball and elevation controls | Then             | Includes the ring count on a phone's first screen: at 390×844 it sits 822 to 876px down the page.                |
| 3   | Tips                                     | Then             | Power hooks and slices; wedge rings without the app.                                                             |
| 4   | Tournament planner                       | Step 4           | A switch that adds a row of holes and a plan per hole.                                                           |
| 5   | Accounts                                 | Step 3, now last | Up to three, each with its own bags. The saved data already holds the list.                                      |
| 6   | Retire `gcwind:v1`                       | Later            | Kept so a rollback still finds it; remove after a couple of releases.                                            |

There are no open GitHub issues.

## How players use a calculator

- **Tour matches.** The bag is chosen before the match; the club, distance, lie and wind
  change every shot. From Tour 7 players can take debuffs such as reduced power or accuracy
  for bigger rewards ([Help](https://playdemic.helpshift.com/hc/en/6-golf-clash/faq/1390-tour-difficulty-levels/)).
- **Week-long tournaments.** Qualifying runs Monday to Wednesday, then the Opening and
  Weekend rounds ([Help](https://playdemic.helpshift.com/hc/en/6-golf-clash/faq/1470-how-do-week-long-tournaments-work/)).
  The holes are known days ahead, practice can replay a hole
  ([Help](https://playdemic.helpshift.com/hc/en/6-golf-clash/faq/1305-how-do-i-practice-for-tournaments/)),
  and the wind stays roughly the same across rounds, so players keep notes per hole
  ([Notebook](https://golfclashnotebook.io/tournaments/), about 2020).
- **Cups.** 9-hole cups play three rounds of 9 holes
  ([Help](https://playdemic.helpshift.com/hc/en/6-golf-clash/faq/1474-what-is-a-9-hole-cup-tournament/));
  18-hole cups use 18 different holes across two courses. Some add wind modifiers: Strong
  Winds (50% stronger, [EA](https://www.ea.com/en-gb/games/golf-clash/news/lakeside-lodge-18-hole-cup)),
  Steady Winds (each hole has the same wind every round,
  [EA](https://www.ea.com/games/golf-clash/news/wm-phoenix-open-18-hole-cup-announcement))
  and tailwinds only.
- **Checkpoint Challenge.** The game hands out random clubs, shown on the load screen, and
  the wind is random per hole ([Tommy](https://golfclashtommy.com/checkpointchallenge)).
  Perks do not apply ([Help](https://playdemic.helpshift.com/hc/en/6-golf-clash/faq/1478-what-are-perks-in-golf-clash/)).
  This is what Flex is for.
- **The shot clock.** Each shot has 30 seconds. Speed is the complaint reviewers raise most:
  "Too slow and you hurry a shot or time out completely"
  ([Clash Caddie reviews](https://itunes.apple.com/us/rss/customerreviews/id=1388535114/sortBy=mostRecent/json)).
- **Perks and debuffs.** Perks (since October 2025) and Tour Difficulty debuffs change a
  club's stats, which no fixed table covers
  ([Help](https://playdemic.helpshift.com/hc/en/6-golf-clash/faq/1479-how-do-i-equip-perks/)).
- **Elevation.** Players find it by trial and error, and guides give it per hole. Tommy
  calls it a "floating number" ([Tommy](https://golfclashtommy.com/wind)), and guides
  disagree on the sign.
- **Curl and spin.** They do not change the ring count; players apply them on top
  ([Notebook](https://golfclashnotebook.io/tools/windchartcreator/)).
- **References.** Golf Clash Tommy's site, YouTube channel, Discord and Patreon guides;
  TG Radu's shootout guides ([tgradu.com](https://tgradu.com)); a community Masterlist
  spreadsheet ([sheet](https://docs.google.com/spreadsheets/d/17nrOcQWTqBV8cz7U3IHanBKc9DFkMma3WTP09QqkoVY/edit#gid=0)).

## What else is out there

### On the web

| Tool                                                                | Status                         | Model                            | What stands out                                                                                                                                                                                                                          |
| ------------------------------------------------------------------- | ------------------------------ | -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Golf Clash Tommy](https://golfclashtommy.com/windtool)             | Active                         | Free with ads; Patreon guides    | PDF wind charts per club and level, with power ball, wind ball, elevation and wind ranges by tour. Tournament pages with per-hole videos and the elevation for each tee and shot; the written guides are on Patreon. No live calculator. |
| [Wind Buddy](https://www.wind-buddy.com/)                           | Active (commit 8 Oct 2026)     | Free; sign-in for bags and notes | Three-digit wind entry ("087" is 8.7), elevation ±65%, rings at max, 75%, mid, 25% and min, 5 bags, notes for 18 holes in each of 3 tournaments, a Checkpoint Challenge mode, and "Endbringer School" wedge rings from 140% to 5%.       |
| [The Caddie's Compass](https://gcn.kielbyrne.com/)                  | Active (August–September 2026) | Free                             | Wind angle with a compass, ring tables, printable charts, a split-screen "widget mode", bags, share links that carry a bag, JSON import and export; installable, works offline.                                                          |
| [Golf Clash Wind](https://silvernine209.github.io/golf-clash-wind/) | Last commit June 2026          | Free, no sign-up                 | A big number pad; installable, works offline. From a shot distance it gives the club, slider % and rings, and shows the working.                                                                                                         |
| [RingCaddy](https://ringcaddy.app/)                                 | Beta                           | Ads; Pro $6.99 a month           | Several golf games. Splits the rings into left or right and toward or away; installable, works offline. Bags and per-hole notes are Pro only.                                                                                            |
| [Golf Clash Notebook](https://golfclashnotebook.io/)                | Frozen since February 2020     | Free, open source                | Club stats, a wind chart creator, ring adjustments for power hooks and slices, animated hole guides with notes per tier.                                                                                                                 |
| [Golf Clash Boss](https://golfclashboss.com/wind-calculator)        | New, about March 2026          | Ads; the site is for sale        | A calculator and a club guide. Some of its stats contradict Tommy's.                                                                                                                                                                     |
| WindChum                                                            | Defunct                        | Was free                         | Once promoted by Tommy; the domain is now a placeholder.                                                                                                                                                                                 |

Also found: Golf Clash University's ring calculator on Tableau (dormant since May 2023),
AllClash (its calculator is broken), codingace (everything typed in by hand), and shared
Google Sheets from about 2017–18.

### In the app stores

| App                                                                                                       | Status                                                              | Model                    | What stands out                                                                                                  |
| --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- | ------------------------ | ---------------------------------------------------------------------------------------------------------------- |
| [Clash Caddie](https://apps.apple.com/us/app/id1388535114) (iOS)                                          | Updated April 2026; 2.0★ from 142 ratings                           | $5.99, plus paid add-ons | Accounts with bags, keypad wind entry, rings at min, mid, slider and max, paid club detection from a screenshot. |
| [Clash Caddie](https://play.google.com/store/apps/details?id=com.clashcaddie.caddie) (Android)            | Updated August 2026; 2.7★ from 43 ratings                           | $7.99, plus paid grids   | A movable overlay with the rings; manual backup and restore.                                                     |
| [Notebook for Golf Clash](https://play.google.com/store/apps/details?id=org.golfclash.notebook) (Android) | Last updated July 2024; 3.6★ from 2.53K; gone from the US App Store | $3.99                    | An overlay, a full-screen calculator for a second device, several bags, 1,500+ hole tutorials.                   |
| [Clash Caddie Notes](https://apps.apple.com/us/app/id1481579268) (iPad)                                   | Last updated 2020                                                   | $5.99                    | Tournament shot notes with ring adjustments, printable PDFs.                                                     |

Two more Android apps, Caddie (Green Gloves) and Golf Clash Wind Ruler, are no longer in
the store.

### What their users say

- **Speed** comes first: slow entry under the shot clock, and too many steps to switch bags
  ([Clash Caddie reviews](https://itunes.apple.com/us/rss/customerreviews/id=1388535114/sortBy=mostRecent/json)).
- **Redesigns and paywalls** cost goodwill: after Clash Caddie's 3.0 redesign, about half
  of its 50 most recent iOS reviews (August to November 2024) were 1★, over bags that would
  not load and a paid add-on that crashed (same link).
- **Neglect**: crashes mid-match, no answer from support
  ([Notebook](https://play.google.com/store/apps/details?id=org.golfclash.notebook)), holes
  not ready in time ([Clash Caddie Notes](https://apps.apple.com/us/app/id1481579268)), and
  club data that lags the game, such as missing Road to Fame and Golden clubs.
- **Bags stuck on one device**: bags and purchases do not carry across devices
  ([Clash Caddie on Android](https://play.google.com/store/apps/details?id=com.clashcaddie.caddie)).
- **Overlays are fragile**: Playdemic began restricting them in 2019
  ([Notebook's notice](https://golfclashnotebook.io/)).

## Where gcwind can stand out

- **Free, no sign-in, no ads, on any device.** The paid apps are poorly rated and tied to
  one store; the free web tools either need a sign-in (Wind Buddy) or are frozen.
- **Bags that follow the player without an account.** A backup code, a link or a sync
  code moves bags between a phone, a tablet and a computer. Elsewhere bags are stuck on one
  device or need a sign-in.
- **Fast.** The ring count on the first screen of a phone, and as few taps as possible
  from the wind to the rings.
- **A live calculator tied to a per-hole plan, with free notes.** No one offers this
  without a paywall or a sign-in.
- **Tips that work without the app.** Short, credited write-ups of the techniques players
  look up elsewhere.
- **Data you can trust.** No tool says how current its club data is or publishes test
  cases, and the tools disagree with each other. gcwind's clubs match Tommy's data; it can
  say so, with a date, and check its numbers against his formula in its tests.
- **Languages.** Every tool checked is in English only, while the game is localised
  ([Japanese App Store listing](https://apps.apple.com/JP/app/id1089225191)).

## Order of work

### 1. Backup and sync bags (next)

Bags now hold real set-up work, and they live in one browser. Safari on iOS deletes a
site's saved data after 7 days of use without a visit, unless the site is on the Home
Screen ([WebKit](https://webkit.org/blog/10218/full-third-party-cookie-blocking-and-more/)),
and players move between a phone, a tablet and a computer. Two parts, in this order:

**Backup, with no server (medium):**

- A backup code to copy, and a link that opens gcwind on another device and offers to
  import it. A QR code of the link makes phone to phone quick.
- Import checks everything the way storage does, says what it will replace, and asks
  first.
- `navigator.storage.persist()`, and a one-time hint on iOS to add gcwind to the Home
  Screen.
- An installable app that works offline. On iOS, an app on the Home Screen also keeps its
  saved data.
- Share one bag as a link, as The Caddie's Compass does.

**Sync code, optional (medium):** instead of an account, a random code that stores the
bags on gcwind's own Worker and D1 database. Another device that enters the code gets the
same bags, and later changes follow; the last change wins. It needs a size limit, a rate
limit, an expiry for codes left unused, a way to delete, and a new line in About, since
the bags would then leave the browser.

### 2. Easier wind, ball and elevation controls (medium)

Starts with a clickable preview of options, as bags did. Ideas from the research:

- **Wind**: a large number and the number pad (typing 087 already gives 8.7), with the
  steppers and the slider.
- **Power ball**: all of 0 to 10 in one row, or the shortcuts plus a picker, and the ball
  remembered per bag, as Clash Caddie and Golf Clash Wind do.
- **Elevation**: − and + in 5% steps with a quick reset to 0, and "+ adds rings" next to it.
- **The ring count on a phone's first screen**: at 390×844 it sits 822 to 876px down the
  page today.

Done when a typical shot takes fewer taps than now, counted before and after, and the ring
count is in view at 390×844 and 375×667 while the wind is entered.

### 3. Tips (small to medium)

Short write-ups in gcwind's own words, crediting and linking the sources:

- **Power hooks and slices.** What the shot is, and ring adjustments for each driver at
  each level, from Golf Clash Notebook's chart ([power slice](https://golfclashnotebook.io/powerslice/)).
  The page calls them "not proven values", a starting point, and links Zachary Jones's
  videos and Nathan Taylor's charts for the other club types. The Notebook is open source;
  its licence needs checking for the chart's data.
- **Wedge rings without the app.** The "Endbringer School" method from Jared A.'s YouTube
  video, which Wind Buddy builds on: rings for distances from 140% down to 5%, for wedges
  with accuracy of 90 or more, with elevation at +20% on flat ground. The method needs
  checking against the video before it is written up.

### 4. Tournament planner (step 4, medium to large)

As designed in [modes-and-bags.md](modes-and-bags.md#tournament-designed-now-built-in-step-4),
extended by the research:

- 9 or 18 holes, since 18-hole cups use 18 different holes;
- per hole: club type, elevation, distance, ball, the expected wind (for Steady Winds), and
  a free note, such as a ring tweak learned in practice;
- a name and division for each plan, so a player can keep more than one week;
- free, no sign-in, saved with the bags, so the backup and sync code carry it too.

### 5. Accounts (step 3, small to medium)

As designed: up to three accounts, each with its own bags, and no account control on the
main screen while there is only one.

### Later

- Accuracy checks: compare the power ball factors with Tommy's tool (his code may use
  ×1.04 for power 1 but ×1.03 for power 2, unverified; gcwind uses 1.01 and 1.03), find a
  source for the 0.9 factor gcwind applies to The B52 and The Grizzly from level 5, test a
  sample of ring counts against his formula, and show "club data as of" a date.
- Custom club stats, for perks and Tour Difficulty debuffs.
- A printable wind chart of a bag, with wind ranges by tour.
- Rings at 75% and 25% distance as well.
- A compact view for split screen or a second device.
- Languages.
- A shot log, to learn the elevation for a hole from where shots landed.

## Decisions

Settled in review, October 2026:

1. **Backup and sync bags come next**, ahead of the tournament planner and accounts.
2. **The wind, ball and elevation controls get reworked** to be easier to use.
3. **Club data**: Golf Clash Tommy's data may be used.
4. **Tips**: power hooks and slices, and wedge rings without the app.
5. **Backup code first**, then the sync code. The technical details are discussed before
   the backup code is built.

## Open questions

1. **Sync code.** How long should an unused sync code last, for example 12 months?
2. **Controls.** What feels hardest today: the wind, the ball or the elevation? The preview
   will show options for all three either way.
3. **Tips.** A Tips page of its own, or short tips next to the controls, behind a "?"?
