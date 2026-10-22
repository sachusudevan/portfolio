// Renders the 1200×630 social preview image (assets/og-image.png) from the hero poster frame.
import { Resvg } from '@resvg/resvg-js';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SANS = 'Geist, Segoe UI, Helvetica, Arial, sans-serif';

export function buildOgSvg(photoDataUri) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="fade" x1="0" x2="1" y1="0" y2="0">
      <stop offset="0" stop-color="#121212"/>
      <stop offset=".38" stop-color="#121212" stop-opacity=".92"/>
      <stop offset=".62" stop-color="#121212" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="floor" x1="0" x2="0" y1="0" y2="1">
      <stop offset=".7" stop-color="#121212" stop-opacity="0"/>
      <stop offset="1" stop-color="#121212" stop-opacity=".85"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="#121212"/>
  <image href="${photoDataUri}" x="60" y="-20" width="1190" height="669" preserveAspectRatio="xMidYMid slice"/>
  <rect width="1200" height="630" fill="url(#fade)"/>
  <rect width="1200" height="630" fill="url(#floor)"/>
  <g transform="translate(1138 537.5)">
    <circle r="34" fill="#141414" stroke="#D72638" stroke-opacity=".45"/>
    <circle r="26" fill="none" stroke="#BFC3C9" stroke-opacity=".35" stroke-dasharray="2 4"/>
    <circle r="14" fill="#D72638"/>
    <text y="5.5" text-anchor="middle" font-family="${SANS}" font-weight="800" font-size="15" fill="#F5F5F5">S</text>
  </g>
  <text x="72" y="118" font-family="${SANS}" font-weight="800" font-size="30" letter-spacing="6" fill="#F5F5F5">SACHU</text>
  <rect x="200" y="96" width="10" height="10" rx="2" fill="#D72638"/>
  <text x="72" y="268" font-family="${SANS}" font-weight="700" font-size="62" fill="#F5F5F5">Building Scalable</text>
  <text x="72" y="340" font-family="${SANS}" font-weight="700" font-size="62" fill="#F5F5F5">Software.</text>
  <text x="72" y="412" font-family="${SANS}" font-weight="700" font-size="62" fill="#D72638">Solving Complex</text>
  <text x="72" y="484" font-family="${SANS}" font-weight="700" font-size="62" fill="#D72638">Problems.</text>
  <rect x="72" y="530" width="48" height="3" fill="#D72638"/>
  <text x="136" y="540" font-family="${SANS}" font-size="24" fill="#BFC3C9">Software Engineer &amp; Technical Lead</text>
</svg>`;
}

export function renderOg() {
  const photo = readFileSync(join(ROOT, 'assets', 'img', 'hero-poster.jpg')).toString('base64');
  const svg = buildOgSvg(`data:image/jpeg;base64,${photo}`);
  return new Resvg(svg, { fitTo: { mode: 'width', value: 1200 }, font: { loadSystemFonts: true, defaultFontFamily: 'Segoe UI' } }).render().asPng();
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const out = join(ROOT, 'assets', 'og-image.png');
  writeFileSync(out, renderOg());
  console.log(`wrote ${out}`);
}
