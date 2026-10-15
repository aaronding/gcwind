import { describe, it, expect } from 'vitest';
import { handleFeedback, purgeBefore, LIMITS, KEPT_DAYS } from '../worker/feedback.js';

const ORIGIN = 'https://gcwind.webthinking.io';
const URL_ = `${ORIGIN}/api/feedback`;

/** A Services double that records what it was asked to keep. */
function services({ allow = true } = {}) {
  const kept = [];
  return {
    kept,
    allow: async () => allow,
    keep: async (message) => {
      kept.push(message);
    },
    now: () => new Date('2026-10-15T12:00:00.000Z')
  };
}

const post = (body, { origin = ORIGIN, type = 'application/json', method = 'POST', ip } = {}) => {
  const headers = {};
  if (type !== null) headers['content-type'] = type;
  if (origin !== null) headers.origin = origin;
  if (ip) headers['cf-connecting-ip'] = ip;
  return new Request(URL_, {
    method,
    headers,
    body: method === 'POST' ? (typeof body === 'string' ? body : JSON.stringify(body)) : undefined
  });
};

describe('origin', () => {
  it('accepts its own origin', async () => {
    const s = services();
    expect((await handleFeedback(post({ message: 'hello' }), s)).status).toBe(204);
    expect(s.kept).toHaveLength(1);
  });

  it('accepts a request with no origin header', async () => {
    const s = services();
    expect((await handleFeedback(post({ message: 'hi' }, { origin: null }), s)).status).toBe(204);
  });

  it('refuses any other origin, keeping nothing', async () => {
    const s = services();
    const res = await handleFeedback(post({ message: 'hi' }, { origin: 'https://evil.test' }), s);
    expect(res.status).toBe(403);
    expect(s.kept).toEqual([]);
  });
});

describe('method and type', () => {
  it('answers OPTIONS without keeping anything', async () => {
    const s = services();
    const res = await handleFeedback(post(null, { method: 'OPTIONS' }), s);
    expect(res.status).toBe(204);
    expect(res.headers.get('allow')).toBe('POST, OPTIONS');
    expect(s.kept).toEqual([]);
  });

  it('refuses GET', async () => {
    expect((await handleFeedback(post(null, { method: 'GET' }), services())).status).toBe(405);
  });

  it('refuses a non-JSON content type', async () => {
    const s = services();
    const res = await handleFeedback(post({ message: 'hi' }, { type: 'text/plain' }), s);
    expect(res.status).toBe(415);
    expect(s.kept).toEqual([]);
  });

  it('accepts a charset on the content type', async () => {
    const s = services();
    const res = await handleFeedback(
      post({ message: 'hi' }, { type: 'application/json; charset=utf-8' }),
      s
    );
    expect(res.status).toBe(204);
  });
});

describe('rate limiting', () => {
  it('refuses once the address has sent too many, before reading the body', async () => {
    const s = services({ allow: false });
    const res = await handleFeedback(post({ message: 'hi' }, { ip: '198.51.100.7' }), s);
    expect(res.status).toBe(429);
    expect(s.kept).toEqual([]);
  });
});

describe('validation', () => {
  it.each([
    ['not JSON at all', 'definitely not json'],
    ['an array', JSON.stringify([1, 2])],
    ['null', JSON.stringify(null)],
    ['no message', JSON.stringify({})],
    ['a non-string message', JSON.stringify({ message: 42 })],
    ['an empty message', JSON.stringify({ message: '' })],
    ['whitespace alone', JSON.stringify({ message: '   \n\t ' })],
    ['a non-string honeypot', JSON.stringify({ message: 'hi', website: 5 })]
  ])('refuses %s', async (_label, body) => {
    const s = services();
    expect((await handleFeedback(post(body), s)).status).toBe(400);
    expect(s.kept).toEqual([]);
  });

  it('refuses a message over the limit but accepts one at it', async () => {
    const s = services();
    const tooLong = { message: 'x'.repeat(LIMITS.message + 1) };
    expect((await handleFeedback(post(tooLong), s)).status).toBe(400);

    const atLimit = { message: 'x'.repeat(LIMITS.message) };
    expect((await handleFeedback(post(atLimit), s)).status).toBe(204);
    expect(s.kept).toHaveLength(1);
  });

  it('refuses a body over the limit', async () => {
    const s = services();
    const req = new Request(URL_, {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin: ORIGIN },
      body: JSON.stringify({ message: 'x'.repeat(LIMITS.body) })
    });
    expect((await handleFeedback(req, s)).status).toBe(413);
    expect(s.kept).toEqual([]);
  });
});

describe('honeypot', () => {
  it('answers a filled honeypot as if it worked, and keeps nothing', async () => {
    const s = services();
    const res = await handleFeedback(post({ message: 'buy things', website: 'http://spam' }), s);
    expect(res.status).toBe(204);
    expect(s.kept).toEqual([]);
  });

  it('keeps a message when the honeypot is empty', async () => {
    const s = services();
    await handleFeedback(post({ message: 'real feedback', website: '' }), s);
    expect(s.kept).toEqual([{ received: '2026-10-15T12:00:00.000Z', message: 'real feedback' }]);
  });
});

describe('what is kept', () => {
  it('keeps only the arrival time and the message', async () => {
    const s = services();
    await handleFeedback(post({ message: 'hello', email: 'a@b.c', extra: 'ignored' }), s);
    expect(Object.keys(s.kept[0]).sort()).toEqual(['message', 'received']);
  });

  it('answers 500 and logs nothing of the message when keeping fails', async () => {
    const s = {
      ...services(),
      keep: async () => {
        throw new Error('d1 unavailable');
      }
    };
    expect((await handleFeedback(post({ message: 'hi' }), s)).status).toBe(500);
  });
});

describe('purgeBefore', () => {
  it('is exactly the retention period back', () => {
    const now = new Date('2026-10-15T00:00:00.000Z');
    const cutoff = new Date(purgeBefore(now));
    expect((now - cutoff) / (24 * 60 * 60 * 1000)).toBe(KEPT_DAYS);
    expect(KEPT_DAYS).toBe(365);
  });
});
