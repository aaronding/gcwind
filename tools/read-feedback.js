// Prints the latest feedback from D1. Run with `pnpm run feedback`.
//
// Reads the remote database through wrangler, so it needs the same Cloudflare
// login `pnpm run deploy` uses. Messages are kept a year; the Worker's daily
// Cron Trigger deletes them after that.

import { execFileSync } from 'node:child_process';

const limit = Number(process.argv[2] ?? 20);

if (!Number.isInteger(limit) || limit < 1) {
  fail(`"${process.argv[2]}" is not a number of messages to show.`);
}

/** Prints one line and stops. No stack trace: nothing here is a bug to report. */
function fail(message, hint) {
  console.error(message);
  if (hint) console.error(hint);
  process.exit(1);
}

let raw;
try {
  raw = execFileSync(
    'pnpm',
    [
      'exec',
      'wrangler',
      'd1',
      'execute',
      'gcwind',
      '--remote',
      '--json',
      '--command',
      `SELECT id, received, message FROM feedback ORDER BY id DESC LIMIT ${limit}`
    ],
    // stderr is captured rather than inherited, so wrangler's own output does
    // not interleave with the message printed here.
    { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }
  );
} catch (error) {
  const stderr = String(error.stderr ?? '');

  // The failures worth telling apart, since each has a different fix.
  if (/not authenticated|authentication|login/i.test(stderr)) {
    fail('Not signed in to Cloudflare.', 'Run: pnpm exec wrangler login');
  }
  if (/couldn't find a d1 database|no database|not found/i.test(stderr)) {
    fail(
      'No D1 database called gcwind.',
      'Create it with: pnpm exec wrangler d1 create gcwind, then pnpm run db:migrate'
    );
  }
  if (/no such table/i.test(stderr)) {
    fail('The feedback table does not exist yet.', 'Run: pnpm run db:migrate');
  }
  if (/fetch failed|ENOTFOUND|ETIMEDOUT|EAI_AGAIN|network/i.test(stderr)) {
    fail('Could not reach Cloudflare. Check your connection and try again.');
  }

  const detail = stderr.trim().split('\n').filter(Boolean).slice(-2).join(' ');
  fail('Could not read feedback.', detail ? `wrangler said: ${detail}` : undefined);
}

let rows;
try {
  rows = JSON.parse(raw)?.[0]?.results ?? [];
} catch {
  fail('Could not read feedback: wrangler returned something unexpected.');
}

if (rows.length === 0) {
  console.log('No feedback yet.');
} else {
  for (const { id, received, message } of rows) {
    console.log(`\n#${id}  ${received}`);
    console.log(message);
  }
  console.log(`\n${rows.length} message${rows.length === 1 ? '' : 's'}.`);
}
