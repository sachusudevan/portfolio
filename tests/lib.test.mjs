import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const lib = require('../js/lib.js');

const fields = { name: 'Ana & Co', email: 'ana@co.io', subject: 'Hi #1?', message: 'Line 1\nLine 2 — ünïcode' };

test('buildMailto encodes subject/body and uses CRLF newlines', () => {
  const url = lib.buildMailto('me@x.com', fields);
  assert.ok(url.startsWith('mailto:me@x.com?subject='));
  assert.ok(!/\s/.test(url), 'no raw whitespace');
  const params = new URLSearchParams(url.slice(url.indexOf('?') + 1));
  assert.equal(params.get('subject'), 'Hi #1?');
  assert.equal(params.get('body'), 'Line 1\r\nLine 2 — ünïcode\r\n\r\n— Ana & Co\r\nana@co.io');
});

test('buildMailto falls back to a default subject and tolerates missing fields', () => {
  const url = lib.buildMailto('me@x.com', { name: ' Ana ', email: 'a@b.co', message: 'Hello there friend' });
  const params = new URLSearchParams(url.slice(url.indexOf('?') + 1));
  assert.equal(params.get('subject'), 'Portfolio enquiry from Ana');
});

test('validateContact flags each invalid field', () => {
  const r = lib.validateContact({ name: 'A', email: 'nope', subject: '', message: 'short' });
  assert.equal(r.valid, false);
  assert.deepEqual(Object.keys(r.errors).sort(), ['email', 'message', 'name']);
});

test('validateContact accepts a complete message', () => {
  assert.deepEqual(lib.validateContact(fields), { valid: true, errors: {} });
});

test('formatClock renders 24h time in Asia/Kolkata by default', () => {
  const d = new Date('2026-10-11T08:35:09Z');
  assert.equal(lib.formatClock(d), '14:05:09');
  assert.equal(lib.formatClock(d, 'UTC'), '08:35:09');
  assert.equal(lib.formatClock(new Date('2026-10-11T18:30:00Z')), '00:00:00');
});

test('matchesFilter handles all, single and multi categories', () => {
  assert.equal(lib.matchesFilter('healthcare', 'all'), true);
  assert.equal(lib.matchesFilter('healthcare enterprise', 'enterprise'), true);
  assert.equal(lib.matchesFilter('commerce', 'healthcare'), false);
  assert.equal(lib.matchesFilter('commerce', ''), true);
});

test('createSafeStorage reads and writes through a working storage', () => {
  const map = new Map();
  const store = lib.createSafeStorage(() => ({ getItem: (k) => map.get(k) ?? null, setItem: (k, v) => map.set(k, v) }));
  assert.equal(store.set('theme', 'dark'), true);
  assert.equal(store.get('theme'), 'dark');
});

test('createSafeStorage never throws when storage access or methods throw', () => {
  const blocked = lib.createSafeStorage(() => { throw new Error('SecurityError'); });
  assert.equal(blocked.get('theme'), null);
  assert.equal(blocked.set('theme', 'dark'), false);
  const broken = lib.createSafeStorage(() => ({ getItem() { throw new Error('x'); }, setItem() { throw new Error('QuotaExceeded'); } }));
  assert.equal(broken.get('theme'), null);
  assert.equal(broken.set('theme', 'dark'), false);
});
