import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const lib = require('../js/lib.js');

const fields = { name: 'Ana & Co', email: 'ana@co.io', subject: 'Hi #1?', message: 'Line 1\nLine 2 — ünïcode' };

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

test('buildWhatsApp builds a wa.me click-to-chat link with the enquiry prefilled', () => {
  const url = lib.buildWhatsApp('918157864536', { name: 'Ana & Co', email: 'ana@co.io', phone: '+91 98765 43210', subject: 'Hi #1?', message: 'Line 1\nLine 2' });
  assert.ok(url.startsWith('https://wa.me/918157864536?text='));
  assert.ok(!/\s/.test(url), 'no raw whitespace');
  const text = new URLSearchParams(url.slice(url.indexOf('?') + 1)).get('text');
  assert.equal(text, 'New website enquiry\n\nName: Ana & Co\nEmail: ana@co.io\nPhone: +91 98765 43210\nSubject: Hi #1?\nMessage:\nLine 1\nLine 2');
});

test('buildWhatsApp leaves out optional fields that are empty', () => {
  const url = lib.buildWhatsApp('918157864536', { name: 'Ana', email: 'a@b.co', phone: ' ', subject: '', message: 'Hello there friend' });
  const text = new URLSearchParams(url.slice(url.indexOf('?') + 1)).get('text');
  assert.equal(text, 'New website enquiry\n\nName: Ana\nEmail: a@b.co\nMessage:\nHello there friend');
});

test('validateContact accepts an empty phone but rejects a malformed one', () => {
  const base = { name: 'Ana', email: 'a@b.co', subject: '', message: 'Hello there friend' };
  assert.equal(lib.validateContact({ ...base, phone: '' }).valid, true);
  assert.equal(lib.validateContact({ ...base, phone: '+91 81578-64536' }).valid, true);
  const bad = lib.validateContact({ ...base, phone: 'call me' });
  assert.equal(bad.valid, false);
  assert.ok(bad.errors.phone);
});
