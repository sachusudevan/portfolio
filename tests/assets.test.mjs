import { test } from 'node:test';
import assert from 'node:assert/strict';
import { statSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';
import { root, exists } from './helpers.mjs';

const NAMES = ['portrait-sage', 'portrait-sand', 'portrait-noir', 'portrait-wall', 'street-coffee', 'street-walk'];

for (const name of NAMES) {
  test(`optimised photo ${name} exists as webp + jpg, ≤1000px wide, ≤260KB`, async () => {
    for (const ext of ['webp', 'jpg']) {
      const rel = `assets/img/${name}.${ext}`;
      assert.ok(exists(rel), `${rel} missing`);
      const meta = await sharp(join(root, rel)).metadata();
      assert.ok(meta.width <= 1000, `${rel} width ${meta.width}`);
      assert.ok(statSync(join(root, rel)).size <= 260 * 1024, `${rel} too large`);
    }
  });
}

test('hero poster exists as webp + jpg at 16:9, ≤1600px wide and lightweight', async () => {
  for (const [ext, maxKB] of [['webp', 120], ['jpg', 200]]) {
    const rel = `assets/img/hero-poster.${ext}`;
    assert.ok(exists(rel), `${rel} missing`);
    const meta = await sharp(join(root, rel)).metadata();
    assert.ok(meta.width <= 1600, `${rel} width ${meta.width}`);
    assert.ok(Math.abs(meta.width / meta.height - 16 / 9) < 0.01, `${rel} aspect`);
    assert.ok(statSync(join(root, rel)).size <= maxKB * 1024, `${rel} too large`);
  }
});

test('intro video exists and stays under 8MB', () => {
  const rel = 'assets/videos/Software_engineer_portfolio_intro_1080p_20261023093003.mp4';
  assert.ok(exists(rel));
  assert.ok(statSync(join(root, rel)).size < 8 * 1024 * 1024);
});
