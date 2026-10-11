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
