// POST /api/feedback: what someone wrote in the feedback dialog, kept for the
// developer to read. Plain JavaScript on the standard Request and Response —
// what it needs from the platform arrives as `services`, which index.js builds
// from Cloudflare's bindings. That keeps this file testable without a Worker.

/** The most each part may hold. The dialog's textarea stops at `message`. */
export const LIMITS = { body: 128 * 1024, message: 10_000 };

/** How long a message is kept before the daily purge deletes it. */
export const KEPT_DAYS = 365;

/**
 * @typedef {Object} Services
 * @property {(address: string) => Promise<boolean>} allow  false once this address has sent too many in a minute
 * @property {(message: {received: string, message: string}) => Promise<void>} keep
 * @property {() => Date} now
 */

/**
 * @param {Request} request
 * @param {Services} services
 * @returns {Promise<Response>}
 */
export async function handleFeedback(request, services) {
  // Only this site's own pages may post. A request from any other origin is
  // refused, so no other page can post on a visitor's behalf.
  const origin = request.headers.get('origin');
  if (origin !== null && origin !== new URL(request.url).origin) {
    return answer(403);
  }

  if (request.method === 'OPTIONS') {
    return answer(204, { allow: 'POST, OPTIONS' });
  }
  if (request.method !== 'POST') {
    return answer(405, { allow: 'POST, OPTIONS' });
  }
  if (!isJson(request.headers.get('content-type'))) {
    return answer(415);
  }

  // Before anything is read or written, so a flood costs as little as possible.
  if (!(await services.allow(request.headers.get('cf-connecting-ip') ?? ''))) {
    return answer(429);
  }

  const text = await readUpTo(request, LIMITS.body);
  if (text === undefined) return answer(413);

  const sent = parse(text);
  if (!sent) return answer(400);

  // A bot is told it worked, so it learns nothing, and nothing is kept.
  if (sent.website !== '') return answer(204);

  try {
    await services.keep({ received: services.now().toISOString(), message: sent.message });
  } catch (error) {
    // Only the error, never what was sent.
    console.error('Feedback could not be kept:', error instanceof Error ? error.message : error);
    return answer(500);
  }

  return answer(204);
}

/** The time before which kept messages are deleted, from when the purge runs. */
export function purgeBefore(now) {
  return new Date(now.getTime() - KEPT_DAYS * 24 * 60 * 60 * 1000).toISOString();
}

function answer(status, headers = {}) {
  return new Response(null, { status, headers });
}

function isJson(type) {
  return type?.split(';')[0].trim().toLowerCase() === 'application/json';
}

/** The body as text, or undefined once it passes `limit` bytes, read no further. */
async function readUpTo(request, limit) {
  if (Number(request.headers.get('content-length')) > limit) return undefined;
  if (!request.body) return '';

  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let size = 0;
  let text = '';

  for (;;) {
    const { done, value } = await reader.read();
    if (done) return text + decoder.decode();
    size += value.byteLength;
    if (size > limit) {
      await reader.cancel();
      return undefined;
    }
    text += decoder.decode(value, { stream: true });
  }
}

/** `website` is the honeypot: hidden from people, so only a bot fills it in. */
function parse(text) {
  let value;
  try {
    value = JSON.parse(text);
  } catch {
    return undefined;
  }

  if (typeof value !== 'object' || value === null || Array.isArray(value)) return undefined;

  const { message, website = '' } = value;
  if (typeof message !== 'string' || message.trim() === '' || message.length > LIMITS.message) {
    return undefined;
  }
  if (typeof website !== 'string') return undefined;

  return { message, website };
}
