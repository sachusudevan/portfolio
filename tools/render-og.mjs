// Renders the 1200×630 social preview image (assets/og-image.png).
import { Resvg } from '@resvg/resvg-js';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

export function buildOgSvg(photoDataUri) {
  const gridLines = [];
  for (let x = 60; x < 1200; x += 60) gridLines.push(`<path d="M${x} 0V630" stroke="#2A2A2A" stroke-opacity=".5"/>`);
  for (let y = 60; y < 630; y += 60) gridLines.push(`<path d="M0 ${y}H1200" stroke="#2A2A2A" stroke-opacity=".5"/>`);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs><clipPath id="frame"><rect x="800" y="70" width="320" height="490"/></clipPath></defs>
  <rect width="1200" height="630" fill="#0B0B0B"/>
  ${gridLines.join('')}
  <image href="${photoDataUri}" x="780" y="60" width="360" height="537" preserveAspectRatio="xMidYMin slice" clip-path="url(#frame)"/>
  <path d="M800 100V70H830M1120 530V560H1090" fill="none" stroke="#C6F432" stroke-width="4"/>
  <text x="80" y="110" font-family="Consolas, monospace" font-size="22" fill="#8A8A8A"><tspan fill="#C6F432">~/</tspan>sachu · technical lead</text>
  <text x="76" y="270" font-family="Arial Black, Impact, sans-serif" font-size="118" fill="#EDEDED">SACHU S</text>
  <rect x="80" y="320" width="640" height="64" fill="#C6F432"/>
  <text x="96" y="366" font-family="Arial Black, Impact, sans-serif" font-size="34" fill="#0B0B0B">CODE THAT SHIPS. TEAMS THAT SCALE.</text>
  <text x="80" y="470" font-family="Consolas, monospace" font-size="22" fill="#EDEDED"><tspan fill="#C6F432">$</tspan> python · django · fastapi · edi 835/837 · hipaa</text>
  <rect x="80" y="500" width="14" height="26" fill="#C6F432"/>
</svg>`;
}

export function renderOg() {
  const photo = readFileSync(join(ROOT, 'assets', 'img', 'portrait-noir.jpg')).toString('base64');
  const svg = buildOgSvg(`data:image/jpeg;base64,${photo}`);
  return new Resvg(svg, { fitTo: { mode: 'width', value: 1200 }, font: { loadSystemFonts: true, defaultFontFamily: 'Consolas' } }).render().asPng();
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const out = join(ROOT, 'assets', 'og-image.png');
  writeFileSync(out, renderOg());
  console.log(`wrote ${out}`);
}
