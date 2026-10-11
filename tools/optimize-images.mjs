// One-off: converts the original profile photos into named, resized WebP + JPEG files.
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

export const PHOTOS = [
  ['1 (6).jpeg', 'portrait-sage'],
  ['1 (1).jpeg', 'portrait-sand'],
  ['1 (5).jpeg', 'portrait-noir'],
  ['1 (4).jpeg', 'portrait-wall'],
  ['1 (2).jpeg', 'street-coffee'],
  ['1 (3).jpeg', 'street-walk'],
];

const SRC = process.argv[2] ?? 'images/profile';
const OUT = 'assets/img';
const WIDTH = 1000;

await mkdir(OUT, { recursive: true });
for (const [file, name] of PHOTOS) {
  const input = join(SRC, file);
  if (!existsSync(input)) {
    console.warn(`skip ${name}: ${input} not found`);
    continue;
  }
  const base = sharp(input).rotate().resize({ width: WIDTH, withoutEnlargement: true });
  const info = await base.clone().webp({ quality: 76 }).toFile(join(OUT, `${name}.webp`));
  await base.clone().jpeg({ quality: 78, mozjpeg: true }).toFile(join(OUT, `${name}.jpg`));
  console.log(`${name}: ${info.width}x${info.height}`);
}
