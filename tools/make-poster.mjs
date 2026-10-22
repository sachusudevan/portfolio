// Turns a full-size PNG frame grabbed from the intro video into the hero poster (WebP + JPEG).
// Usage: node tools/make-poster.mjs path/to/frame.png
// The frame used is the video's last frame (t ≈ 9.95s), captured with headless Chrome.
import sharp from 'sharp';
import { join } from 'node:path';

const input = process.argv[2];
if (!input) {
  console.error('usage: node tools/make-poster.mjs <frame.png>');
  process.exit(1);
}

const OUT = 'assets/img';
const base = sharp(input).resize({ width: 1600, withoutEnlargement: true });
const webp = await base.clone().webp({ quality: 74 }).toFile(join(OUT, 'hero-poster.webp'));
const jpg = await base.clone().jpeg({ quality: 78, mozjpeg: true }).toFile(join(OUT, 'hero-poster.jpg'));
console.log(`hero-poster: ${webp.width}x${webp.height} webp ${(webp.size / 1024).toFixed(0)}KB, jpg ${(jpg.size / 1024).toFixed(0)}KB`);
