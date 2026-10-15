// Prints the latest feedback from D1. Run with `pnpm run feedback`.
//
// Reads the remote database through wrangler, so it needs the same Cloudflare
// login `pnpm run deploy` uses. Messages are kept a year; the Worker's daily
// Cron Trigger deletes them after that.

import { execFileSync } from 'node:child_process';

const limit = Number(process.argv[2] ?? 20);

const raw = execFileSync(
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
  { encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] }
);

const rows = JSON.parse(raw)?.[0]?.results ?? [];

if (rows.length === 0) {
  console.log('No feedback yet.');
} else {
  for (const { id, received, message } of rows) {
    console.log(`\n#${id}  ${received}`);
    console.log(message);
  }
  console.log(`\n${rows.length} message${rows.length === 1 ? '' : 's'}.`);
}
