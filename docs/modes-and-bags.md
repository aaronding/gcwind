# Bags, Flex and accounts

Status: proposed, October 2026, and revised in review. Built in steps; see [Plan](#plan).

## Summary

Golf Clash players reach for a wind calculator in three of the game's modes, and the old
screen fits only one of them:

- **Tour**: the player plays from a bag set up beforehand, and the game picks the club for
  each shot.
- **Checkpoint**: the player can be handed any club at any level, which is how the app
  worked before bags.
- **Tournament**: everything is set up before the tournament; during it the player only
  picks the hole and enters the wind. Designed here, built later.

gcwind covers the first two with one row above the clubs: **Flex** (any club at any level),
then the player's **bags**, one to five as in the game, and **+** to add one. There is no
mode switch. Tournament, when it is built, is a switch that adds a row of holes on top of
whichever bag is in use. Players can also keep up to three **accounts**. Everything stays
in this browser's `localStorage`; there is no login and no server storage. A backup code to
protect bags and move them between devices comes last.

## How players use it

| Game mode  | What the player knows before the shot                      | What changes every shot                                | In gcwind               |
| ---------- | ---------------------------------------------------------- | ------------------------------------------------------ | ----------------------- |
| Tour       | Their bag. The game picks the club for each shot from it.  | Which club is in hand, wind, elevation, ball, distance | A bag                   |
| Checkpoint | Nothing fixed. The checkpoint can hand them any club.      | Club, level, wind, elevation, ball, distance           | Flex                    |
| Tournament | The bag, the ball, and each hole's elevation and distance. | Which hole, and the wind                               | A bag and the hole plan |

## The screen

Top to bottom:

1. **Bag row**: the name of the bag in use (tap it to manage bags), then **Flex**, the
   bags as buttons 1 to 5, and **+** while there are fewer than five. The buttons stretch
   across the rest of the row, so they are easy to hit on a phone, and stop at 420px on
   wide screens. One tap switches. With six buttons on the narrowest phones, the name
   gives way to its icon. Flex comes first so it stays put as bags are added and removed.
   Flex and + are not bags, so each has an end of the row to itself, on a slightly
   different fill.
   When there is more than one account, an account menu sits above the row (step 3).
2. On a bag, **the bag's clubs**: one card per club type with the club's art, its level
   as a number on the picture in the club's rarity colour (as the game shows it), and its
   type. Tapping a card makes it the club in hand; the player never picks from a list or
   a level here. The last cell is **Edit bag**. On a phone that is a 4 × 2 grid, kept
   short so more of the page fits; on wider screens one row.

   In **Flex**, the club type tabs, the club list and the levels instead: the screen the
   app had before bags. Flex picks are not a bag. They are kept separately, one club and
   level per type, the way v1 kept them.

3. Wind, distance, power ball, elevation and the rings, as before.

**Edit bag** opens a dialog for the bag in use: its name, then the same seven cards as a
type selector, and under them that type's club list and levels (the pickers Flex uses).
Changes apply as they are made; Done closes the dialog.

A first visit opens on Bag 1. After that gcwind opens on the bag, or Flex, last used, so
a player in the middle of a checkpoint event is not sent back to a bag on every visit.

Wind, power ball, elevation, distance and the club type in hand are shared by the bags and
Flex: they describe the shot being played, not where the club came from.

### Tournament (designed now, built in step 4)

Before the tournament the player sets up:

- the **ball** (power ball level) for the whole tournament,
- for each of the **9 holes**: the club type for the shot, the elevation and the distance.

The bag is the one in use in the bag row, chosen the same way as in a tour; Flex works too.
The plan stores club types, not clubs, so it works with whichever is chosen.

During the tournament the player chooses the bag, then for each hole selects the hole and
enters or adjusts the wind. Everything else comes from the plan.

A **Tournament** switch turns this on. It is not a mode: it adds a row of holes 1 to 9
under the bag row, and the selected hole's plan fills in the club type, elevation,
distance and ball. Two views:

- Plan: the ball, holes 1 to 9, and for the selected hole the club cards (to pick the
  type), elevation and distance.
- Play: holes 1 to 9, a one-line summary of the hole ("Hole 3 · The Goliath 7 · 20% ·
  Max · Ball 6"), the wind input and the rings. The summary links back to the hole's plan
  for a quick change.

Where the switch sits (the header, or the end of the bag row) is settled in step 4.

## Bags and accounts

- **One to five bags** per account, as in the game. A new player starts with one. **+** in
  the bag row, or **Add a bag** in the bag manager, adds the next one, which starts as a
  copy of the clubs in use, so a second bag only needs what differs.
- Bags are numbered in order and named "Bag 1" and so on until renamed. Removing a bag
  moves the ones after it up a number, and a default name moves with its number. The last
  bag cannot be removed. Removing the bag in use switches to the one before it.
- Up to **3 accounts** (`MAX_ACCOUNTS`, one constant to raise later), named "Account 1"
  and so on until renamed. The last account cannot be deleted. With one account there is
  no account control anywhere on the main screen.
- A bag holds one club and level for each club type.
- Names are one line of up to 24 characters. Emptying a name restores the default.
- The bag manager (opened from the bag's name) renames bags and accounts, adds bags,
  adds and deletes accounts, and for each bag offers **Edit clubs**, **Copy to…** (clubs
  and levels; the target keeps its name), **Reset** (back to the starter clubs) and
  **Remove**. Copy, Reset, Remove and Delete account ask first.

## What the calculator gets

| In use              | Club and level                                 | Wind    | Elevation | Distance  | Power ball      |
| ------------------- | ---------------------------------------------- | ------- | --------- | --------- | --------------- |
| A bag               | The bag's club for the type in hand            | Entered | Entered   | Entered   | Entered         |
| Flex                | Picked freely, one per type                    | Entered | Entered   | Entered   | Entered         |
| Tournament (step 4) | The bag's club, or the Flex pick, for the hole | Entered | Hole plan | Hole plan | Tournament ball |

In code this is one derived value, `app.shot`, which each of these fills differently; the
rings are computed from it. That keeps the result panel, wind input and calculator unaware
of bags, Flex and tournaments, and is what lets Tournament slot in later without touching
them.

## Saved data

A new key, `gcwind:v2`:

```js
{
  version: 2,
  mode: 'bag', // 'bag' (the active account's bag in use) | 'flex'

  // The shot being played, shared by the bags and Flex, as in v1.
  clubType: 'drivers', // the club type in hand
  windSpeed: 10,
  powerBall: 2,
  elevation: 10,
  distance: 100,

  // Flex picks: any club at any level, one per type (v1's selections).
  flex: { selections: { drivers: { club: 'The Rocket', level: 10 } /* … */ } },

  // Bags, per account.
  activeAccount: 0,
  accounts: [
    {
      name: 'Account 1',
      activeBag: 0,
      bags: [
        { name: 'Bag 1', selections: { drivers: { club: 'The Rocket', level: 10 } /* … */ } }
        // 1 to 5
      ]
    }
    // 1 to MAX_ACCOUNTS
  ],

  // Added in step 4. Absent until then, and ignored by builds that predate it.
  // The bag is the one in use, as above.
  tournament: {
    on: false,
    powerBall: 6, // the ball for the whole tournament
    activeHole: 0,
    holes: [
      { clubType: 'longirons', elevation: 20, distance: 100 }
      // 9
    ]
  }
}
```

Reading it is as strict as `restore()` was before bags, so edited or damaged storage can
never break the app:

- unknown clubs fall back to the type's starter club, and levels are clamped to
  `maxLevelFor()` the club's rarity;
- accounts beyond `MAX_ACCOUNTS` are dropped, and every account keeps one to five bags:
  extra ones are dropped, and an account with none gets one of starter clubs. An entry
  that is not a bag becomes a starter bag in its place, so the bags after it keep their
  numbers;
- names are trimmed and capped, indices out of range fall back to 0, and an unknown mode
  falls back to the bag in use;
- corrupt JSON in `v2` falls through to `v1`, then to defaults.

The checks are plain functions in `src/lib/bags.js`, shared by storage now and by the
backup code in step 5.

## Migration from v1

On the first load with `gcwind:v1` and no `gcwind:v2`:

- v1's `selections` become the **Flex picks** (they were picked the same way, any club at
  any level) and **Account 1's only bag**, so the app opens with the player's own clubs.
  Adding a bag copies them, so a second bag starts from them too.
- v1's wind, power ball, elevation, distance and club type are kept.
- It opens on Bag 1.
- `gcwind:v1` is not deleted in this release, so rolling back still finds it.

## Accessibility

- Every control is a native button, select or input, so keyboard and screen readers work
  without custom handling. Dialogs are native `<dialog>` (focus trap, Escape).
- Bag buttons are labelled with the name, for example "Bag 2: Approach"; Flex is "Flex:
  any club, any level" and + is "Add a bag". Club cards read "Driver: The Rocket, level
  7". Flex and the bag buttons expose their state with `aria-pressed`. When the bag's name
  gives way to its icon, the button keeps its accessible name ("Bag 2, manage bags").
- Level numbers are white on deeper shades of the rarity colours, at 5:1 or more.
- Text fields use 16px type so iOS does not zoom. Tap targets are 40px or more; with
  Flex and five bags on a 320px phone, the bag row's buttons are 44px tall and at least
  34px wide.
- Light and dark themes come from the existing tokens.

## Plan

Each step is its own pull request, reviewed before the next one starts.

1. **Design**: this document and the clickable preview.
2. **Bags and Flex**: the bag row with Flex, one to five bags and +, the club cards and
   Edit bag, the bag manager without accounts, saving to `gcwind:v2` and migrating from
   v1. The data already has the `accounts` list, holding one account, so step 3 needs no
   second migration.
3. **Accounts**: up to 3, the account menu, add, rename and delete.
4. **Tournament**: the switch, Plan and Play, as above.
5. **Save and backup** (last): an export code (`gcw2.` and base64url JSON, versioned) and
   an optional `#bags=` link, import with strict checks and a confirmation before
   replacing anything, `navigator.storage.persist()`, and a one-time hint on iOS, where
   Safari deletes a site's saved data after 7 days without a visit unless it is on the
   Home Screen.

Bags are saved in this browser from step 2 onwards, the way picks were saved before. Step
5 adds the backup on top.

Step 2 shipped in 1.2.0. The remaining steps now run in the order set in
[plan.md](plan.md): save and backup (with an optional sync code) comes next, and accounts
come last.

## Decisions

Settled when the design was approved, and revised in review (October 2026):

1. **Clubs per bag:** seven, one per club type (Driver, Wood, Long, Short, Wedge, Rough,
   Sand).
2. **Tournament holes:** one plan per hole. The `holes` list can take a `shots` list later
   (a tee shot and an approach) without a migration.
3. **Ball:** the power ball level only. The game already applies the wind ball to the wind
   it shows, so gcwind never asks for it (confirmed in review). `calculateWindRings()`
   still takes a wind ball level, always 0.
4. **No mode switch** (revised in review; it was Tour · Checkpoint · Tournament). Flex sits
   in the bag row before Bag 1, and Tournament becomes a switch in step 4.
5. **Bags in use:** one to five, and a new player starts with one (revised in review; it
   was always five). A new bag starts as a copy of the clubs in use.
6. **Opening:** on the bag, or Flex, last used; Bag 1 on a first visit.
7. **Migration:** v1's picks become Bag 1 and the Flex picks (revised in review; it was
   all five bags and the Checkpoint picks).
8. **Level badges:** the number alone, on the club picture, in the club's rarity colour,
   on the bag's cards and the result card alike; the cards are kept short on a phone.

## Not in scope

- Login and server storage. A later optional sync code could use the existing Worker
  and D1 database (`worker/`, `migrations/`); nothing here depends on it.
