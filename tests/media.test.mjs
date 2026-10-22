import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { root, exists, html } from './helpers.mjs';
import { renderFrame, FRAMES, WIDTH, HEIGHT } from '../tools/pipeline-frames.mjs';
import { buildGif } from '../tools/render-gif.mjs';
import { renderOg } from '../tools/render-og.mjs';

test('pipeline frames are valid dark SVG, animated, and loop seamlessly', () => {
  const first = renderFrame(0);
  assert.match(first, /^<svg[^>]+viewBox="0 0 720 360"/);
  assert.match(first, /#121212/);
  assert.match(first, /#D72638/);
  assert.ok(!/#C6F432/.test(first), 'old lime accent');
  assert.notEqual(first, renderFrame(Math.floor(FRAMES / 3)));
  assert.equal(first, renderFrame(FRAMES));
});

test('buildGif produces a GIF89a of the expected size', () => {
  const bytes = buildGif(3);
  assert.equal(Buffer.from(bytes.slice(0, 6)).toString('ascii'), 'GIF89a');
  assert.equal(bytes[6] | (bytes[7] << 8), WIDTH);
  assert.equal(bytes[8] | (bytes[9] << 8), HEIGHT);
});

test('renderOg produces a 1200×630 PNG', () => {
  const png = renderOg();
  assert.equal(png.subarray(1, 4).toString('ascii'), 'PNG');
  assert.equal(png.readUInt32BE(16), 1200);
  assert.equal(png.readUInt32BE(20), 630);
});

test('generated media files are committed and referenced', () => {
  assert.ok(exists('assets/pipeline.gif'));
  assert.ok(exists('assets/og-image.png'));
  assert.ok(readFileSync(join(root, 'assets/pipeline.gif')).length < 2.5 * 1024 * 1024, 'GIF over 2.5MB');
  assert.match(html(), /og:image" content="[^"]*assets\/og-image\.png"/);
});
