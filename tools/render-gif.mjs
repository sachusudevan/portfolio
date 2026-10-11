// Renders tools/pipeline-frames.mjs into assets/pipeline.gif (resvg → gifenc).
import { Resvg } from '@resvg/resvg-js';
import gifenc from 'gifenc';
import { writeFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { renderFrame, WIDTH, FRAMES, FPS } from './pipeline-frames.mjs';

const { GIFEncoder, quantize, applyPalette } = gifenc;

export function rasterize(svg) {
  const img = new Resvg(svg, { fitTo: { mode: 'width', value: WIDTH }, font: { loadSystemFonts: true, defaultFontFamily: 'Consolas' } }).render();
  return { data: new Uint8Array(img.pixels), width: img.width, height: img.height };
}

export function buildGif(frameCount = FRAMES) {
  const frames = Array.from({ length: frameCount }, (_, i) => rasterize(renderFrame(i)));
  const sample = new Uint8Array(frames.reduce((n, f) => n + f.data.length, 0));
  frames.reduce((offset, f) => (sample.set(f.data, offset), offset + f.data.length), 0);
  const palette = quantize(sample, 32);
  const gif = GIFEncoder();
  frames.forEach((f, i) => {
    gif.writeFrame(applyPalette(f.data, palette), f.width, f.height, i === 0 ? { palette, delay: Math.round(1000 / FPS), repeat: 0 } : { delay: Math.round(1000 / FPS) });
  });
  gif.finish();
  return gif.bytes();
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const out = join(dirname(fileURLToPath(import.meta.url)), '..', 'assets', 'pipeline.gif');
  const bytes = buildGif();
  writeFileSync(out, bytes);
  console.log(`wrote ${out} (${(bytes.length / 1024).toFixed(0)} KB)`);
}
