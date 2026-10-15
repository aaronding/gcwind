// Run after every deploy: fetches the live page and fails if Cloudflare
// injected anything into it. The zone's settings keep these off; this catches
// one that comes back on by default — Web Analytics auto-injection defaulted on
// for free zones in October 2025, and was found on this site in October 2026
// only because a browser test happened to look.
//
// Ported from padbench's worker/check-deploy.ts.

const origin = process.env.CHECK_ORIGIN || 'https://gcwind.webthinking.io';

// One page: the app is a single page, and /api/feedback answers no HTML.
const pages = ['/'];

// Asked for as Chrome asks for a page, so it arrives as a visitor's browser
// gets it. This is the whole reason the beacon went unnoticed: Cloudflare
// injects only into a page it takes a browser to be reading, so curl saw a
// clean page while a real browser loaded the script.
const headers = {
  accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'accept-language': 'en-US,en;q=0.9',
  'cache-control': 'no-cache',
  'user-agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) ' +
    'Chrome/141.0.0.0 Safari/537.36'
};

// What Cloudflare's script-injecting features leave behind: Web Analytics, from
// a host of its own, and the rest under /cdn-cgi/, which none of this site's
// pages refer to — Email Address Obfuscation, Rocket Loader, bot JavaScript
// detections and Zaraz.
const injected = [
  'cloudflareinsights',
  'beacon.min.js',
  'email-decode',
  'rocket-loader',
  'challenge-platform',
  'zaraz',
  '/cdn-cgi/'
];

const problems = [];

for (const page of pages) {
  const url = new URL(page, origin);

  let response;
  let html;
  try {
    response = await fetch(url, { headers });
    html = await response.text();
  } catch (error) {
    problems.push(`${url}: ${error instanceof Error ? error.message : error}`);
    continue;
  }

  if (!response.ok) problems.push(`${url}: status ${response.status}`);
  if (response.headers.has('set-cookie')) problems.push(`${url}: sets a cookie`);
  // Speed Brain adds no script, but a header that has the browser fetch ahead.
  if (response.headers.has('speculation-rules')) {
    problems.push(`${url}: has a Speculation-Rules header`);
  }

  for (const marker of injected) {
    if (html.includes(marker)) problems.push(`${url}: contains ${marker}`);
  }

  for (const [, src] of html.matchAll(/<script\b[^>]*\bsrc=["']?([^"'\s>]+)/gi)) {
    if (new URL(src, url).origin !== origin) {
      problems.push(`${url}: loads a script from ${src}`);
    }
  }

  // A cached response can be from before a setting was changed, so a clean
  // result off a HIT proves less than it appears to.
  const cache = response.headers.get('cf-cache-status');
  if (cache === 'HIT') {
    console.warn(`note: ${url} was served from cache (cf-cache-status: HIT)`);
  }
}

if (problems.length > 0) {
  console.error(`The deployed site is not clean:\n${problems.map((p) => `  ${p}`).join('\n')}`);
  process.exit(1);
}

console.log(`Checked ${pages.length} page(s) on ${origin}: nothing injected.`);
