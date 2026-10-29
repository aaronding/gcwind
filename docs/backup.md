# Backup and sync

Status: proposed, October 2026, revised after two reviews. For discussion before any
code is written. This is the first item of the roadmap, "Backup and sync bags", and
replaces step 5 of [modes-and-bags.md](modes-and-bags.md#plan).

A clickable preview of the screens goes with this document.

## Summary

Three actions, all on everything gcwind saves:

- **Export**: save a JSON file of the saved data to the device.
- **Import**: pick an exported file; it replaces the saved data.
- **Sync**: upload the saved data to gcwind's server, which answers with a short code. The
  app shows the link, such as `https://gcwind.webthinking.io/sync/XRWUQP`, and its QR code.
  Opening the link in another browser downloads the data and replaces what is saved there.

Also in this step:

- `navigator.storage.persist()`, and a one-time hint in Safari on iOS to add gcwind to the
  Home Screen;
- the service worker that makes gcwind work offline, in its own pull request, now built
  (see [Installable app](#installable-app)). The app icon, the Home Screen icons and the
  web app manifest shipped in 1.4.0.

Settled in review:

1. A sync link is a short path of random uppercase letters, easy to remember and to type.
2. Export and Import use a JSON file. Sync uploads to the server and shows a link and a QR
   code. Opening the link replaces the saved data.
3. The file and the server hold the `accounts` list as storage already does. The app keeps
   one account; accounts may come later, or never, without a new data version.
4. Export, Import and Sync each cover all saved data, not single bags.
5. The installable app goes ahead; the logo is designed separately.

## Settled in the second review

1. **Codes** are six random uppercase letters, without I and O. See [Codes](#codes).
2. **Ask before replacing.** Import and a sync link both show what will be replaced and ask
   first, with one undo. See [Replacing](#replacing).
3. **One code per device**, updated each time the player syncs, so a saved link always
   opens the latest bags. See [What the server keeps](#what-the-server-keeps).
4. **Kept for 180 days** after the last upload or download, and deleted at once by Stop
   syncing.
5. **Stored in D1**, the database the feedback form already uses. See
   [Where the data is stored](#where-the-data-is-stored).

## Where it lives

**In the bag manager, with no second dialog.** The manager opens from the bag's name and
is where players look after their bags. Under the list, one row of buttons: **Add a bag**
(while there are fewer than five), **Export** and **Import**, with no explanation beside
them.

- **Export** saves the file at once, and a line under the row names it.
- **Import** opens the device's file picker. What the file holds, what it replaces, and
  **Cancel** and **Replace** appear under the row, inside the manager, as Copy, Reset and
  Remove already confirm there. Errors appear in the same place.
- After an import, **Undo the last import** stays under the row until the next import.

**Sync**, when it is built, adds a **Sync** button to the same row. Its code, link, QR
code, **Sync now** and **Stop syncing** appear under the row the same way, and on iOS
outside the Home Screen app, the Home Screen advice with them.

The main screen does not change, so nothing is added to the shot-clock path.

## What is included

Everything in `gcwind:v2`, as `toJSON()` writes it:

| Data                                               | Included | Note                                                                    |
| -------------------------------------------------- | :------: | ----------------------------------------------------------------------- |
| Accounts, bags, their names and clubs              |   Yes    | The `accounts` list as stored; today it holds one account.              |
| The bag in use, and whether Flex is in use         |   Yes    | The other device opens where the player was.                            |
| Flex picks                                         |   Yes    |                                                                         |
| Club type in hand, wind, ball, elevation, distance |   Yes    | "All saved data". They are a few bytes, and harmless to carry.          |
| Tournament plans (step 4)                          |  Later   | Part of `gcwind:v2` when they exist, so included without a change here. |
| Theme (`gcwind:theme`)                             |    No    | A preference for each device, kept in its own key.                      |
| The device's own sync code and token               |    No    | They belong to the device that made them.                               |

Five bags with shot settings come to about 2.2 KB of JSON, and about 5.5 KB in the
exported file, which is indented so it can be read.

### Accounts

Storage already keeps a list of accounts, up to `MAX_ACCOUNTS = 3`, and the app uses the
first. The file and the server carry the list unchanged, and import cleans it with
`cleanAccounts`, so a file from a later build with three accounts keeps all three even
though this build shows one. Accounts can come later, or never, without a new version.

## The file

```json
{
  "app": "gcwind",
  "version": 2,
  "exported": "2026-10-16T19:30:00.000Z",
  "data": { "version": 2, "mode": "bag", "accounts": [], "…": "the gcwind:v2 store" }
}
```

- `data` is the `gcwind:v2` store exactly as saved, so there is one format to maintain.
  The outer `app` and `version` tell a gcwind file from any other JSON, and a newer file
  from this one, before `data` is read.
- The server stores the same document, so Import and Sync share one reader.
- **Name**: `gcwind-backup-2026-10-16.json`.
- **Export** builds a `Blob` and clicks an `<a download>` link. On iOS this saves to Files
  (Downloads); on Android and computers, to the downloads folder. Where `navigator.share`
  accepts files (iOS and Android), Share can send the file instead, to Notes, Messages or
  Drive. Saving from a Home Screen app on iOS should be tested on a device before release.
- **Import** is an `<input type="file" accept=".json,application/json">`. Files over 64 KB
  are refused before they are read.

## Sync

### Codes

A code is random uppercase letters, drawn by the server with `crypto.getRandomValues`, from
an alphabet without I and O, which are easy to confuse with 1 and 0. The path is
`/sync/XRWUQP`. Typed codes are read case-insensitively, so `/sync/xrwuqp` works too.

How length trades against guessing, with 24 letters:

| Letters | Codes       | Chance a random guess finds one of 10,000 live codes |
| ------: | ----------- | ---------------------------------------------------: |
|       4 | 331,776     |                                              1 in 33 |
|       5 | 7,962,624   |                                             1 in 796 |
|       6 | 191,102,976 |                                          1 in 19,110 |

Guessing a code shows someone's bag names and clubs. It cannot change them: changing or
deleting needs the device's token. The data is not sensitive, but with four letters and a
modest number of players, a script could collect most of it, and a new code collides with
a live one often enough to need retries.

**Settled: six letters**, still one short word to read out or type, with a read limit per
address (below).

The QR code of the link (41 characters) is version 3, 29 × 29 modules: small, and easy to
scan from any screen.

### What the server keeps

A new D1 table, in `migrations/0002_saved.sql`. Each row is one saved document, found by
a sync code, by a login ID, or by both, so the table already fits Google sign-in when it
comes (see [Later](#later-google-sign-in-and-automatic-sync)):

```sql
CREATE TABLE saved (
  id INTEGER PRIMARY KEY,
  code TEXT UNIQUE,           -- 'XRWUQP', for a sync link; NULL for a signed-in
                              -- player's own row until they make a link
  login TEXT UNIQUE,          -- the login ID, as provider and account ID:
                              -- 'google:1084…'; NULL until sign-in exists
  token_hash TEXT,            -- SHA-256 of the device's token, for rows with a code
  data TEXT NOT NULL,         -- the export document, at most 16 KB
  updated TEXT NOT NULL,      -- last upload, in UTC
  opened TEXT,                -- last download, in UTC
  CHECK (code IS NOT NULL OR login IS NOT NULL)
);
```

- `UNIQUE` columns in SQLite allow any number of NULLs, so rows without a code or without a
  login do not clash, and each column has its index for lookups.
- **The login ID** names its provider (`google:` then Google's `sub`), so another provider
  could be added later without a migration. Only this ID is kept: no email, no name.
- **A signed-in player's link**: a row can have both, so a signed-in player can still make
  a sync link that opens their data, and Stop syncing clears the code but keeps the row.
- **Expiry** applies to rows without a login: the purge deletes them 180 days after their
  last upload or download. A signed-in player's row stays until they delete their data or
  their sign-in.
- **Sessions** for sign-in get their own table when sign-in is built, holding a hashed
  session ID, the login ID and an expiry.

**One code per device** (settled). The first Get a link creates the code and a random
token, and the device keeps both in `gcwind:sync`. Sync now uploads again to the same
code. So a link in a note, a bookmark or a printed QR code keeps working and always holds
the latest bags. Stop syncing deletes the row and forgets the code; the next Get a link
makes a new one.

**Kept for 180 days** after the last upload or download. The daily purge that already runs
for feedback deletes older rows.

### Where the data is stored

**In D1**, in a new `saved` table in the existing `gcwind` database. Compared on the Workers
Free plan:

| Store           | Fit for sync                                                                                                                                                                                                                                                                                     | Free plan                                                             |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------- |
| **D1** (chosen) | Already bound as `DB`, with migrations and a daily purge. A read straight after a write sees the write. SQL deletes by date in one statement.                                                                                                                                                    | 5 million rows read and 100,000 written a day; 5 GB in total.         |
| Workers KV      | Built for data read far more often than written. Eventually consistent: a sync may not be visible in another location for up to a minute, which is exactly when the player opens the link on the other device. No query by date, so expiry relies on per-key TTLs, which cannot extend on reads. | 1,000 writes a day, which a few hundred players syncing would use up. |
| R2              | Object storage for files; a new binding and bucket for 2 KB documents. Lifecycle rules expire objects by age since upload, not since last use.                                                                                                                                                   | 10 GB.                                                                |
| Durable Objects | Strong consistency per object, but a class, a migration and more code than this needs.                                                                                                                                                                                                           | Available on the free plan, with lower limits.                        |

Sources: [D1 pricing](https://developers.cloudflare.com/d1/platform/pricing/),
[KV pricing](https://developers.cloudflare.com/kv/platform/pricing/).

**What D1 costs gcwind.** A document is about 2.2 KB uploaded without indenting, so 5 GB
holds over two million.
Every upload is one row written, every download one row read and one written (the
`opened` date). 10,000 uploads and 10,000 downloads a day would use a fifth of the free
write allowance.

**Keeping sync apart from feedback.** Same database, separate table, separate rate limiter
(`SYNC_LIMIT`, next to `FEEDBACK_LIMIT`), and the purge deletes from each table with its
own rule. A second database would only be worth it if sync outgrew the free limits.

### API

All in `worker/sync.js`, plain JavaScript on `Request` and `Response` with its services
passed in, as `worker/feedback.js` is, so it is tested without a Worker.

| Request                              | Does                               | Answers                                      |
| ------------------------------------ | ---------------------------------- | -------------------------------------------- |
| `POST /api/sync`                     | Stores a document under a new code | `201 { code, token }`                        |
| `PUT /api/sync/XRWUQP` with token    | Replaces the document              | `204`; `404` unknown code; `403` wrong token |
| `GET /api/sync/XRWUQP`               | Returns the document               | `200` JSON; `404` unknown or expired         |
| `DELETE /api/sync/XRWUQP` with token | Deletes it                         | `204`                                        |
| `GET /sync/XRWUQP`                   | Opens the app on the code          | `302` to `/#sync=XRWUQP`                     |

The token travels in an `Authorization: Bearer` header. Checks, as for feedback: same
origin only, JSON only, a body of at most 16 KB, and a document whose `app` is `gcwind`
with an integer `version`. The server does not check bags and clubs; the app cleans
everything it reads, as it does storage. Rate limits use the existing `ratelimits`
binding: uploads 5 a minute and reads 20 a minute from one address.

### Opening a link

Today only `/api/*` runs the Worker, and the app's asset paths are relative (`base: './'`),
so `/sync/XRWUQP` cannot serve `index.html` as it is: the page would ask for
`/sync/assets/…` and get nothing.

**Recommended:** add `/sync/*` to `run_worker_first`. The Worker checks the code's shape
and redirects to `/#sync=XRWUQP`. The app reads the fragment, removes it at once with
`history.replaceState` so a reload never asks again, then downloads the data and shows
what it will replace. Unknown addresses under `/sync/` still get a 404, keeping the rule in
`wrangler.jsonc` that scanners are answered without running code everywhere else.

The alternative, the static assets' `_redirects` file, needs no code, but whether its
placeholders can write into a fragment was not verified, and it cannot check the code.

The same code can also be typed: Sync's part of the bag manager has a field that accepts
a code or a link.

### Errors

Every message says what to do next:

- **Unknown or expired code**: "No bags are saved under XRWUQP. Check the code, or sync
  again from the other device."
- **Offline or server error**: "Could not reach gcwind. Check your connection and try
  again." Nothing changes.
- **Too many attempts**: "Too many tries from this network. Wait a minute and try again."
- **Not a gcwind file**: "This file is not a gcwind backup."
- **Damaged file** (not JSON, or no `data`): "This file is damaged or incomplete. Export
  it again from the other device."
- **Newer version**: "This backup comes from a newer gcwind. Reload this page, then try
  again."

## Replacing

Import and a sync link replace the saved data, with two safeguards (settled):

- **Ask first.** The bag manager shows what the file or link holds (each bag's name and clubs)
  and what it replaces, with **Cancel** and **Replace**. A sync link can come from anyone,
  and opening a link should not silently wipe the player's bags.
- **One undo.** Before replacing, the current store is copied to `gcwind:v2:undo`. The
  line after a replace offers **Undo the last import**, and it stays until the next
  one. About 2 KB.

**How the replace works.** `restore()` today changes only the fields it is given and
finds valid, which suits loading storage over defaults but would mix two sets of data on
import. Import builds a fresh state from defaults, restores the imported store into it
with the same checks storage uses (`readBags`, `cleanAccounts`, `cleanSelections`,
`cleanName`), and only then replaces the live state. Clubs this build does not know
become the type's starter club, levels are clamped, and a `version: 1` store is migrated
as on first load. A backup identical to the saved data says so and does nothing.

**Other open tabs.** Each tab writes its whole state on every change and never reads it
back, so an older tab would overwrite an import the next time anything changes in it.
Recommended in this step: listen for the `storage` event on `gcwind:v2` and restore from
it, which keeps every open tab current.

## QR code

Drawn in the browser from the link; nothing is fetched. The link is only 41 characters,
so any library will do.

| Library                                                               | Minified + gzipped | Licence | Last release   |
| --------------------------------------------------------------------- | -----------------: | ------- | -------------- |
| [lean-qr](https://github.com/davidje13/lean-qr)                       |             3.6 KB | MIT     | September 2026 |
| [uqr](https://github.com/unjs/uqr)                                    |             3.9 KB | MIT     | April 2026     |
| [qrcode-generator](https://github.com/kazuhikoarase/qrcode-generator) |             7.6 KB | MIT     | August 2025    |
| [qrcode](https://github.com/soldair/node-qrcode)                      |             9.6 KB | MIT     | November 2025  |

**Recommended: lean-qr**, loaded with a dynamic `import()` when Sync is first used, so the
main bundle (31.6 KB of JavaScript, gzipped) does not grow. Dark modules on a white plate
in both themes, at error correction level M.

## Persistence

### What `persist()` does

| Browser             | How `navigator.storage.persist()` is decided                                                                                   | Source                                                                                                   |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------- |
| Chrome, Edge        | Silently, by heuristics: site engagement, whether the site is installed or bookmarked, and notification permission.            | [web.dev](https://web.dev/articles/persistent-storage)                                                   |
| Firefox             | Asks the player with a permission prompt.                                                                                      | [MDN](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria) |
| Safari (iOS, macOS) | Silently. "WebKit currently grants a request based on heuristics like whether the website is opened as a Home Screen Web App." | [WebKit](https://webkit.org/blog/14403/updates-to-storage-policy/)                                       |

Persistent storage is evicted only when the user clears it; best-effort storage can be
evicted under storage pressure
([MDN](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria)).

The risk that matters for gcwind is different: Safari deletes "all of a website's
script-writable storage after seven days of Safari use without user interaction on the
site", `localStorage` included. Home Screen web apps "have their own counter of days of
use", and WebKit does "not expect the first-party in such a web application to have its
website data deleted"
([WebKit, 2020](https://webkit.org/blog/10218/full-third-party-cookie-blocking-and-more/)).
No source says that `persist()` exempts a Safari tab from the seven-day rule. On iOS the
Home Screen is the protection, and Export and Sync are the safety net.

**When to call it.** `persisted()` silently on load; `persist()` once, on the player's
first change to a bag, not on load, because Firefox shows a prompt and it should appear
when there is something worth keeping. Not again after a denial.

### The iOS hint

- **Who sees it**: Safari on iPhone or iPad, outside the Home Screen app. Detected with
  `'standalone' in navigator && navigator.standalone === false` (the property exists only
  in WebKit on iOS and iPadOS) and `navigator.maxTouchPoints > 1`, so an iPad reporting a
  Mac user agent is included and a Mac is not.
- **When**: after the player's first change to a bag, never on a first visit.
- **Where**: under the bag row, above the clubs. "Keep your bags on this iPhone. Safari
  clears a site's saved data after 7 days without a visit. Add gcwind to your Home Screen
  and your bags stay." **Show me how** lists the steps; **Got it** hides it.
- **Dismissed for good** by Got it (saved as `gcwind:hint-home-screen`) and by opening
  gcwind from the Home Screen. The same advice appears with Sync's link on iOS.

## Installable app

- **A web app manifest** (`manifest.webmanifest`): `name`, `short_name` "gcwind",
  `start_url` and `scope` `"./"`, `display: "standalone"`, `theme_color` `#3fa34d`,
  `background_color`, and icons at 192 and 512 pixels, including a maskable one.
- **`apple-touch-icon`** at 180 pixels. Without it, iOS uses a screenshot of the page as
  the Home Screen icon.

Both shipped in 1.4.0, with the new logo and its icons. **The service worker** followed in
its own pull request, since one that caches the wrong thing can keep players on an old
release. It is `src/sw.js`, built into `sw.js`, and works once gcwind has been opened
online:

- **Navigations**: network first, falling back to the cache when offline, or when the
  network has not answered in 3 seconds, since a connection that looks up but carries
  nothing can take a minute to fail. A page from the network is not kept: the cached page
  is the one built with the cached files, so the two never come from different releases.
- **Build files**: the page, `assets/*`, the icons and the manifest are downloaded when the
  worker installs, and served from the cache.
- **Club art**: all of it is downloaded when the worker installs, so every club shows
  offline and not only those already seen. The plan was to fill it as clubs are seen,
  which left Flex's club lists blank offline for the types not yet opened. It costs 300 KB
  once, in a cache of its own that outlives releases, so a release downloads only new art.
  Art already kept is refreshed in the background as its club is seen
  (stale-while-revalidate).
- **`/api/*` and `/sync/*`**: never cached. Sync needs the network; Export and Import do
  not.
- **Versions**: the cache name has `__APP_VERSION__` and a hash of the build's files, since
  builds of main between releases share a version. `activate` deletes the other gcwind
  caches, and only those: at webthinking.io/gcwind the origin's caches are shared with
  the rest of webthinking.io. A new worker waits for the tabs to close rather than
  reloading a player mid-shot; opening gcwind online still gets the newest page.
- **Build**: a small Vite plugin in `vite.config.js` writes `sw.js` with the list of built
  files, once the build and `public/` are written. `vite-plugin-pwa` is the alternative if
  this grows.
- **Cloudflare**: `public/_headers` has `Cache-Control: no-cache` for `/sw.js` and makes
  `/assets/*` immutable. The `/styles.css` and `/scripts/*` rules from before the Svelte
  build are gone.
- **Tests**: `tests/e2e/offline.spec.js` opens gcwind, goes offline, reloads and
  calculates, and shows the art of a club type not opened before going offline.

webthinking.io/gcwind is a different origin from gcwind.webthinking.io, so it has its own
storage and would be its own installed app. Sync and Export move data between the two.

## Tests

Unit tests (Vitest):

- **Export and import**: a round trip gives back the same store for one, three and five
  bags, with Flex, with three accounts, and with shot settings.
- **Import cleans**: unknown clubs, out-of-range levels, long names, extra bags and
  accounts, a `version: 1` store; and import replaces fields rather than mixing them with
  the current state.
- **Import refuses**: not JSON, JSON from another app, no `data`, a newer version, a file
  over 64 KB; the saved data is unchanged each time.
- **Undo** gives back the exact previous store.
- **`worker/sync.js`**, with services faked as in `tests/feedback.test.js`: create, read,
  update with the right token and refusal with a wrong one, delete, unknown code, other
  origins, sizes, non-JSON, rate limits, code shape and alphabet, a retry on collision,
  and the purge date.

End-to-end tests (Playwright), in `tests/e2e/backup.spec.js`:

- **File**: set up bags, export (Playwright's download event), import the file in a second
  browser context, check the summary, replace, compare the bags, undo.
- **Sync**: with the Worker's API answered by `page.route`, Get a link shows a code, link
  and QR code; opening `/#sync=CODE` in a second context shows the summary and replaces
  the bags; the address loses its fragment; unknown code and offline show their messages
  and change nothing.
- **Two tabs**: an import in one page shows up in another page of the same context.
- **The iOS hint**: with an iPhone user agent and `navigator.standalone` set to false, the
  hint appears after the first bag change and not before, and stays away after Got it and
  a reload.

The `/sync/*` redirect and the D1 queries are checked once with `wrangler dev` before
release.

## Privacy

This step changes gcwind's promise that saved data stays in the browser, so the wording
must change with it:

- **Export and Import** stay on the device.
- **Sync** sends the saved data (bag names, clubs and shot settings) to gcwind's server,
  only when the player taps Get a link or Sync now. Anyone with the code can see it. It is
  deleted when the player taps Stop syncing, or 180 days after it was last used.
- The server keeps no address or account with it. The Worker's request logs stay off, as
  for feedback.
- About gains a short paragraph saying the above, and Sync's part of the bag manager says
  it in one line: "Uploads your bags to gcwind so another device can open them. Anyone
  with the code can see them."

## Later: Google sign-in and automatic sync

Not part of this step. The owner may add Google sign-in later, so that a signed-in player's
data syncs between browsers by itself. Nothing in this design blocks it, and a few choices
keep the way open.

**What stays the same.** The document (the `gcwind:v2` store in its wrapper), the D1
database, the import checks and the confirmation all carry over. A signed-in player's data
is a row of the same `saved` table with its `login` column set, so sign-in needs no change
to it. Sync codes stay for players who
do not sign in, and gcwind keeps working fully signed out.

**Sign-in.** Recommended: Google's server-side OAuth flow with the `openid` scope only. The
page links to `/api/auth/google`; the Worker exchanges the code, checks the ID token, keeps
only Google's account ID (`sub`), not the email or name, and sets its own `HttpOnly`,
`Secure`, `SameSite=Lax` session cookie, with sessions in D1. The alternative, Google's
"Sign in with Google" button, loads Google's script on every page, which would be the
first third-party script in gcwind. Either way the app needs a Google Cloud project, an
OAuth consent screen and a privacy policy page.

**Automatic sync raises questions a manual one does not:**

- **Conflicts.** Two browsers change data between syncs. Replacing the whole document,
  last write wins, would let a laptop that only changed the wind wipe out a bag edited
  on the phone. Recommended then: sync bags and Flex picks only, and merge per bag, each
  carrying the time it last changed.
- **Shot settings** change on every shot. Recommended then: leave them out of automatic
  sync; they describe the shot in front of the player, on that device.
- **When to sync.** Upload a few seconds after a bag changes, and download when the page
  opens or comes back into view (`visibilitychange`). No live connection; Durable Objects
  only if instant updates are ever wanted.
- **Privacy.** "No login, nothing tracked" becomes "sign-in is optional". About and the
  privacy page say what is kept (an account ID and the saved data), and a signed-in player
  can delete it all from the app.

**One choice to make now for it:** the server stores when each document was last updated
(already in the `saved` table), so a later merge has a time to compare against. Per-bag
change times can be added to `gcwind:v2` when automatic sync is built, without a new
version. Older builds ignore them, but `cleanAccounts` drops them when an older build
saves, so the merge must treat a bag without a change time as older than any with one.

## Considered and set aside

- **A backup code in the link itself** (`#bags=` and the data, no server). It keeps data
  off the server, but the link is 231 to 341 characters even in a compact binary format,
  too long to type. Measured: five bags are 2,156 bytes of JSON, 542 compressed, and 142
  in a binary format.
- **Sharing a single bag**: set aside; every action covers all saved data.
- **Merging on import**: set aside in favour of replace with undo.

## Plan

1. **Design**: this document and the clickable preview.
2. **Export and Import** in the bag manager, undo and the `storage` listener (this pull
   request), then `persist()` and the iOS hint.
3. **Sync**: `worker/sync.js`, the D1 migration, the `/sync/*` route, Get a link, the QR
   code and opening a link.
4. **Offline**: the service worker and the `_headers` changes. Built.

Steps 2 and 3 can be one pull request if the owner prefers; they are split so the server
part, which changes the privacy promise, is reviewed on its own.
