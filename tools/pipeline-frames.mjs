// Deterministic frame geometry for the README GIF: frame i of FRAMES, loops seamlessly.
export const WIDTH = 720;
export const HEIGHT = 360;
export const FRAMES = 72;
export const FPS = 18;

const C = { bg: '#0B0B0B', bg2: '#121212', line: '#2A2A2A', text: '#EDEDED', muted: '#8A8A8A', lime: '#C6F432', onLime: '#0B0B0B' };
const MONO = 'Consolas, monospace';
const DOCS = [{ y: 70, label: 'EOB' }, { y: 160, label: '837' }, { y: 250, label: 'SELF-PAY' }];
const OUTS = [{ y: 90, label: '835' }, { y: 170, label: 'CSV' }, { y: 250, label: 'TXT' }];
const CORE = { x: 360, y: 180 };

const bezier = (p0, p1, p2, p3, t) => {
  const u = 1 - t;
  return u * u * u * p0 + 3 * u * u * t * p1 + 3 * u * t * t * p2 + t * t * t * p3;
};
const inWire = (y) => ({ x: [150, 240, 250, 300], y: [y + 22, y + 22, CORE.y, CORE.y] });
const outWire = (y) => ({ x: [420, 470, 470, 520], y: [CORE.y, CORE.y, y + 18, y + 18] });
const pathD = (w) => `M${w.x[0]} ${w.y[0]} C ${w.x[1]} ${w.y[1]}, ${w.x[2]} ${w.y[2]}, ${w.x[3]} ${w.y[3]}`;
const point = (w, t) => [bezier(...w.x, t), bezier(...w.y, t)];
const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

function grid() {
  const lines = [];
  for (let x = 40; x < WIDTH; x += 40) lines.push(`<path d="M${x} 0V${HEIGHT}" stroke="${C.line}" stroke-opacity=".45"/>`);
  for (let y = 40; y < HEIGHT; y += 40) lines.push(`<path d="M0 ${y}H${WIDTH}" stroke="${C.line}" stroke-opacity=".45"/>`);
  return lines.join('');
}

export function renderFrame(i) {
  const phase = (((i % FRAMES) + FRAMES) % FRAMES) / FRAMES; // 0..1
  const caretOn = Math.floor(phase * 8) % 2 === 0;
  const parts = [`<rect width="${WIDTH}" height="${HEIGHT}" fill="${C.bg}"/>`, grid()];
  parts.push(`<text x="24" y="30" font-family="${MONO}" font-size="13" fill="${C.muted}"><tspan fill="${C.lime}">$</tspan> ./edi-engine --in eob,837,self-pay --out 835</text>`);
  if (caretOn) parts.push(`<rect x="362" y="19" width="8" height="14" fill="${C.lime}"/>`);

  DOCS.forEach((d, k) => {
    parts.push(`<g transform="translate(40 ${d.y})"><rect width="110" height="44" fill="${C.bg2}" stroke="${C.text}" stroke-width="1.5"/>`
      + `<text x="12" y="28" font-family="${MONO}" font-size="13" fill="${C.text}">${d.label}</text></g>`);
    const w = inWire(d.y);
    parts.push(`<path d="${pathD(w)}" fill="none" stroke="${C.lime}" stroke-width="2" opacity=".5"/>`);
    const [x, y] = point(w, ease((phase * 2 + k / 3) % 1));
    parts.push(`<rect x="${(x - 5).toFixed(2)}" y="${(y - 5).toFixed(2)}" width="10" height="10" fill="${C.lime}"/>`);
    const checkOn = Math.sin((phase + k / 3) * Math.PI * 2) > -0.2;
    parts.push(`<g transform="translate(200 ${d.y + 22})" opacity="${checkOn ? 1 : 0.25}"><rect x="-10" y="-10" width="20" height="20" fill="${C.lime}"/><path d="M-4.5 0l3 3 6-6" fill="none" stroke="${C.onLime}" stroke-width="2.2"/></g>`);
  });

  const angle = (phase * 360).toFixed(2);
  const pulse = (1 + 0.04 * Math.sin(phase * Math.PI * 4)).toFixed(4);
  parts.push(`<g transform="translate(${CORE.x} ${CORE.y})"><circle r="78" fill="none" stroke="${C.lime}" stroke-opacity=".6" stroke-width="2" stroke-dasharray="6 10" transform="rotate(${angle})"/>`
    + `<rect x="-56" y="-56" width="112" height="112" fill="${C.lime}" transform="scale(${pulse})"/>`
    + `<text y="7" text-anchor="middle" font-family="${MONO}" font-weight="bold" font-size="14" fill="${C.onLime}">EDI ENGINE</text></g>`);

  OUTS.forEach((o, k) => {
    const w = outWire(o.y);
    parts.push(`<path d="${pathD(w)}" fill="none" stroke="${C.lime}" stroke-width="2" opacity=".5"/>`);
    const [x, y] = point(w, ease((phase * 2 + 0.5 + k / 3) % 1));
    parts.push(`<rect x="${(x - 5).toFixed(2)}" y="${(y - 5).toFixed(2)}" width="10" height="10" fill="${C.lime}"/>`);
    parts.push(`<g transform="translate(520 ${o.y})"><rect width="76" height="36" fill="${C.bg2}" stroke="${C.text}" stroke-width="1.5"/>`
      + `<text x="38" y="23" text-anchor="middle" font-family="${MONO}" font-size="13" fill="${C.text}">${o.label}</text></g>`);
  });

  parts.push(`<path d="M596 178 L620 178" stroke="${C.lime}" stroke-width="2"/>`);
  parts.push(`<rect x="620" y="110" width="80" height="136" fill="${C.bg2}" stroke="${C.text}" stroke-width="1.5"/>`);
  parts.push(`<text x="660" y="132" text-anchor="middle" font-family="${MONO}" font-size="10" fill="${C.muted}">PORTAL</text>`);
  [0, 1, 2, 3].forEach((b) => {
    const h = 30 + 40 * (0.5 + 0.5 * Math.sin((phase + b / 4) * Math.PI * 2));
    parts.push(`<rect x="${632 + b * 16}" y="${(232 - h).toFixed(2)}" width="10" height="${h.toFixed(2)}" fill="${C.lime}"/>`);
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${WIDTH} ${HEIGHT}" width="${WIDTH}" height="${HEIGHT}">${parts.join('')}</svg>`;
}
