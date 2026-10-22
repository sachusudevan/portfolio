import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const lib = require('../js/lib.js');

test('formatClock renders 24h time in Asia/Kolkata by default', () => {
  const d = new Date('2026-10-11T08:35:09Z');
  assert.equal(lib.formatClock(d), '14:05:09');
  assert.equal(lib.formatClock(d, 'UTC'), '08:35:09');
  assert.equal(lib.formatClock(d, undefined, false), '14:05');
  assert.equal(lib.formatClock(new Date('2026-10-11T18:30:00Z')), '00:00:00');
});

test('matchesFilter handles all, single and multi categories', () => {
  assert.equal(lib.matchesFilter('healthcare', 'all'), true);
  assert.equal(lib.matchesFilter('healthcare enterprise', 'enterprise'), true);
  assert.equal(lib.matchesFilter('commerce', 'healthcare'), false);
  assert.equal(lib.matchesFilter('commerce', ''), true);
});

test('clamp keeps values within bounds', () => {
  assert.equal(lib.clamp(-1, 0, 1), 0);
  assert.equal(lib.clamp(0.4, 0, 1), 0.4);
  assert.equal(lib.clamp(7, 0, 1), 1);
});

test('scrollProgress measures progress against a viewport anchor line', () => {
  // element 1000px tall, viewport 800px, anchor at 60% (480px)
  assert.equal(lib.scrollProgress(600, 1000, 800), 0);     // not reached yet
  assert.equal(lib.scrollProgress(480, 1000, 800), 0);     // top on the line
  assert.equal(lib.scrollProgress(-20, 1000, 800), 0.5);   // halfway through
  assert.equal(lib.scrollProgress(-900, 1000, 800), 1);    // past the end
  assert.equal(lib.scrollProgress(0, 1000, 800, 0.5), 0.4);
  assert.equal(lib.scrollProgress(0, 0, 800), 0);
});

test('easeOutExpo starts at 0, ends at 1 and is monotonic', () => {
  assert.equal(lib.easeOutExpo(0), 0);
  assert.equal(lib.easeOutExpo(1), 1);
  let prev = -1;
  for (let t = 0; t <= 1; t += 0.05) { const v = lib.easeOutExpo(t); assert.ok(v >= prev); prev = v; }
});

test('projectCountLabel pluralises', () => {
  assert.equal(lib.projectCountLabel(1), 'Showing 1 project');
  assert.equal(lib.projectCountLabel(6), 'Showing 6 projects');
  assert.equal(lib.projectCountLabel(0), 'Showing 0 projects');
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
