// gcwind's service worker, which keeps the app working offline once it has
// been opened. The build writes it to sw.js with the three constants below
// filled in (the plugin in vite.config.js). The plan it follows is in
// docs/backup.md, under "Installable app".
//
// Two caches. The shell (the page, its scripts and styles, the icons) is kept
// whole for each build and dropped when the next one takes over, so a page and
// its files always come from the same release. The club art outlives releases:
// a release downloads only the art that is new, and art already kept is
// refreshed as its club is seen.

/** This build's shell cache, named for the version and a hash of the files. */
const SHELL_CACHE = __SW_CACHE__;

/** The page, as './', and every other file of the build but the club art. */
const SHELL = __SW_SHELL__;

/** The club art, relative to this file like SHELL. */
const ART = __SW_ART__;

const ART_CACHE = 'gcwind-art';

/**
 * How long opening gcwind waits for the network before showing the page kept
 * here. A connection that looks up but carries nothing can take a minute to
 * fail, which is a long time to look at a blank screen mid-shot.
 */
const PAGE_WAIT_MS = 3000;

const scope = new URL(self.registration.scope);
const shellPaths = new Set(SHELL);
const artPaths = new Set(ART);

self.addEventListener('install', (event) => {
  event.waitUntil(Promise.all([keepShell(), keepArt()]));
});

// No skipWaiting(): a new release waits until every gcwind tab and Home Screen
// app is closed, rather than swapping files under a player mid-shot. Opening
// gcwind still gets the newest release whenever the network answers, since the
// page is asked of the network first.
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // Only gcwind's own: at webthinking.io/gcwind the origin, and so its
      // caches, are shared with whatever else webthinking.io serves.
      for (const name of await caches.keys()) {
        if (name.startsWith('gcwind-') && name !== SHELL_CACHE && name !== ART_CACHE) {
          await caches.delete(name);
        }
      }

      // Art for clubs this release no longer has.
      const art = await caches.open(ART_CACHE);
      const wanted = new Set(ART.map((path) => new URL(path, location).href));
      for (const request of await art.keys()) {
        if (!wanted.has(request.url)) await art.delete(request);
      }

      // The first install takes over the page that installed it, so gcwind
      // works offline without a reload. A later release activates only once no
      // page is open, so for it this does nothing.
      await self.clients.claim();
    })()
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== scope.origin) return;
  if (!url.pathname.startsWith(scope.pathname)) return;
  const path = url.pathname.slice(scope.pathname.length);

  // Feedback, and Sync when it comes, need the network. Left unanswered here,
  // they go straight to it and are never kept.
  if (path.startsWith('api/') || path.startsWith('sync/')) return;

  if (request.mode === 'navigate') {
    if (path === '' || path === 'index.html') event.respondWith(page(request));
  } else if (artPaths.has(path)) {
    event.respondWith(art(event));
  } else if (shellPaths.has(path)) {
    event.respondWith(shell(request));
  }
});

/**
 * Downloads this build's shell. Past the browser's HTTP cache, which can still
 * hold the page of the release before, whose files this build does not keep.
 */
async function keepShell() {
  const cache = await caches.open(SHELL_CACHE);
  await Promise.all(
    SHELL.map(async (path) => {
      const response = await fetch(path, { cache: 'no-cache' });
      if (!response.ok) throw new Error(`${path}: ${response.status}`);
      // A browser refuses a redirected response as the answer to opening a
      // page, so a redirect on the way is not kept as one.
      await cache.put(path, response.redirected ? new Response(response.body, response) : response);
    })
  );
}

/**
 * Downloads the art not kept yet, so every club shows offline, not only those
 * already seen. Art that fails now is fetched when its club is next seen.
 */
async function keepArt() {
  const cache = await caches.open(ART_CACHE);
  const kept = new Set((await cache.keys()).map((request) => request.url));
  await Promise.allSettled(
    ART.filter((path) => !kept.has(new URL(path, location).href)).map((path) => cache.add(path))
  );
}

/**
 * The page: the network's, so a release reaches players as soon as it ships,
 * unless the network fails or is slow to answer. Then the page kept with this
 * build's files, which never mixes with another release's.
 */
async function page(request) {
  const kept = await caches.match('./', { cacheName: SHELL_CACHE, ignoreVary: true });
  const network = fetch(request);
  if (!kept) return network;
  const late = new Promise((resolve) => setTimeout(resolve, PAGE_WAIT_MS, kept));
  return Promise.race([network.catch(() => kept), late]);
}

/** A file of the build: kept, else from the network if the browser cleared it. */
async function shell(request) {
  return (
    (await caches.match(request, { cacheName: SHELL_CACHE, ignoreVary: true })) ?? fetch(request)
  );
}

/** Club art: the copy kept here at once, refreshed for next time; else the network's, kept. */
async function art(event) {
  const cache = await caches.open(ART_CACHE);
  const kept = await cache.match(event.request, { ignoreVary: true });
  const fresh = fetch(event.request).then(async (response) => {
    if (response.ok) await cache.put(event.request, response.clone());
    return response;
  });
  if (!kept) return fresh;
  event.waitUntil(fresh.catch(() => {}));
  return kept;
}
