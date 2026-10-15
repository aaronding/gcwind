// The Worker behind gcwind.webthinking.io. Only /api/* reaches it, by
// run_worker_first in wrangler.jsonc; every other address is the site's build,
// served without running any code. This file is the thin adapter between
// Cloudflare and the endpoint's plain JavaScript: it turns the bindings
// wrangler.jsonc declares into what the endpoint needs, and runs the purge.

import { handleFeedback, purgeBefore } from './feedback.js';

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);

    if (pathname === '/api/feedback') {
      return handleFeedback(request, {
        allow: async (address) => (await env.FEEDBACK_LIMIT.limit({ key: address })).success,
        keep: ({ received, message }) =>
          env.DB.prepare('INSERT INTO feedback (received, message) VALUES (?, ?)')
            .bind(received, message)
            .run(),
        now: () => new Date()
      });
    }

    return new Response(null, { status: 404 });
  },

  /** Daily, by the Cron Trigger in wrangler.jsonc: deletes what is old enough. */
  async scheduled(_controller, env) {
    await env.DB.prepare('DELETE FROM feedback WHERE received < ?')
      .bind(purgeBefore(new Date()))
      .run();
  }
};
