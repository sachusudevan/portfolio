# Portfolio Redesign ("Editorial × Engineering") Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the template-style portfolio with an editorial, fully animated static site for Sachu S, including a signature scroll-driven EDI pipeline SVG, animated SVG covers, a generated GIF and an OG image.

**Architecture:** Plain HTML + three CSS files + classic deferred scripts, deployed as-is to GitHub Pages. Pure logic lives in a UMD file (`js/lib.js`) that Node tests import; DOM/motion scripts read `window.Portfolio` (set up by `main.js`). Motion is progressive enhancement: hidden start states exist only under `html.motion-ready`, which is removed whenever GSAP is missing or motion is reduced.

**Tech Stack:** HTML5, CSS (custom properties, grid, `clamp()`), GSAP 3.13.0 (+ ScrollTrigger, SplitText, DrawSVGPlugin, MotionPathPlugin), Lenis 1.3.23, Google Fonts (Fraunces, Inter, JetBrains Mono). Dev only: Node 20 `node:test`, sharp 0.34.5, @resvg/resvg-js 2.6.2, gifenc 1.0.3, http-server 14.1.1.

**Spec:** `docs/superpowers/specs/2026-10-11-portfolio-redesign-design.md`

## Global Constraints

- No build step; `index.html` must work from GitHub Pages **and** `file://` → no `type="module"` scripts.
- CDN URLs pinned exactly: `https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/{gsap,ScrollTrigger,SplitText,DrawSVGPlugin,MotionPathPlugin}.min.js`, `https://cdn.jsdelivr.net/npm/lenis@1.3.23/dist/lenis.min.js`.
- Fonts URL: `https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght,SOFT@0,9..144,300..700,0..100;1,9..144,300..700,0..100&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap`
- Colour tokens (light / dark): paper `#F4F1EA`/`#0F120F`, paper-2 `#EAE5DA`/`#171B17`, ink `#141614`/`#ECE8DF`, ink-soft `#5B605A`/`#A3A89F`, sage `#6E8F72`/`#8FB393`, moss `#2F4A3A`/`#C9DCC8`, sand `#C8A97E`/`#D6BA8F`, rule `rgb(20 22 20 / .14)`/`rgb(236 232 223 / .14)`.
- Any CSS rule that hides an element tagged `[data-anim…]` (opacity 0, visibility hidden, clip-path) must have a selector starting with `.motion-ready`.
- Content facts: "835/837" (never "827"), "CGPA 6.6" (never "CCPA"), email `sachusudeve8690@gmail.com`, phone `+91 8157864536`, LinkedIn `https://linkedin.com/in/sachu-s-705813179`, GitHub `https://github.com/sachusudevan`.
- Reduced motion (or `?motion=off` for QA): no Lenis, no pin/scrub, no marquee, no intro loader, no grain animation.
- Every `<img>` has `alt`, `width`, `height`; only the hero image is not `loading="lazy"`.
- Breakpoint for desktop-only motion (pinning, cursor, hover preview): `(min-width: 900px)`; cursor/preview additionally require `(hover: hover) and (pointer: fine)`.

## Review Focus

1. **CDN blocked / GSAP missing** → every section is readable, loader not shown. Pinned by `tests/site.test.mjs` "hidden states are scoped to .motion-ready" (Task 3) and the browser check in Task 9 Step 3.
2. **Storage unavailable (private mode / blocked cookies)** → theme toggle and intro still work without throwing. Pinned by `createSafeStorage` tests (Task 2).
3. **Contact text with `&`, `#`, `?`, newlines, non-ASCII** → mailto opens with the exact text. Pinned by `buildMailto` tests (Task 2).
4. **Narrow phones (360px)** → no horizontal page scroll; pinned/horizontal sections fall back to native layouts. Pinned by browser check in Task 9 Step 2.
5. **Loader can never trap the user** → removed after ≤3s even if a tween stalls, and skipped when scripts fail (head-script 3.5s safety). Pinned by `tests/site.test.mjs` "head boot script has safety timeout" (Task 3) and Task 9 Step 3.

---

## File map

| File | Responsibility |
|---|---|
| `package.json` | private dev tooling: `test`, `images`, `gif`, `og`, `serve` scripts |
| `.gitignore` | `node_modules/` |
| `.claude/launch.json` | preview server config (http-server on 5173) |
| `index.html` | all content + inline SVGs + head boot script |
| `css/tokens.css` | design tokens, light/dark themes, font stacks |
| `css/base.css` | reset, typography, utilities, grain, progress, cursor, loader, nav, menu, buttons, toast |
| `css/sections.css` | hero → footer section layouts + responsive rules + SVG animation keyframes |
| `js/lib.js` | pure helpers (UMD): `buildMailto`, `validateContact`, `formatClock`, `matchesFilter`, `createSafeStorage` |
| `js/main.js` | boot: motion detection, plugin registration, Lenis, theme toggle, nav, menu, progress, anchors, intro loader → `window.Portfolio` |
| `js/motion.js` | generic reveals: hero intro, split headings, fades, wipes, parallax, counters, marquee, timeline, horizontal strip |
| `js/pipeline.js` | pipeline timeline (pinned scrub on desktop, loop on mobile) |
| `js/work.js` | project filters, accordion, cursor-following preview |
| `js/cursor.js` | custom cursor + magnetic elements |
| `js/contact.js` | form validation + mailto, copy email, toast, IST clock, year |
| `assets/img/*.{webp,jpg}` | optimised photos |
| `assets/favicon.svg`, `assets/svg/monogram.svg`, `assets/svg/pipeline.svg` | SVG assets |
| `assets/pipeline.gif`, `assets/og-image.png` | generated media |
| `tools/optimize-images.mjs`, `tools/pipeline-frames.mjs`, `tools/render-gif.mjs`, `tools/render-og.mjs` | asset generators |
| `tests/helpers.mjs`, `tests/lib.test.mjs`, `tests/assets.test.mjs`, `tests/site.test.mjs`, `tests/media.test.mjs` | node:test suites |

### Shared DOM contract (used across tasks)

- `html` classes: `motion-ready`, `show-intro`, `menu-open`, `has-cursor`; attribute `data-theme="light|dark"`.
- `window.Portfolio = { motion: boolean, lenis: Lenis|null, storage: SafeStorage, introDone: Promise<void> }`.
- `data-anim` values: `hero-title`, `hero-fade`, `hero-media`, `lines`, `fade`, `stagger`, `wipe`. `data-speed="<number>"` = parallax. `data-count="<n>" data-suffix="+"` = counter. `data-magnetic="<strength>"`. `data-cursor="view" data-cursor-label="Open"`. `data-copy="<text>"`. `data-clock`. `data-year`.
- Section ids in order: `hero`, `about`, `pipeline`, `experience`, `work`, `toolkit`, `beyond`, `contact`; `<main id="main" tabindex="-1">`.

---

### Task 1: Tooling, test harness and optimised photos

**Files:**
- Create: `package.json`, `.gitignore`, `tools/optimize-images.mjs`, `tests/helpers.mjs`, `tests/assets.test.mjs`
- Create (generated): `assets/img/{portrait-sage,portrait-sand,portrait-noir,portrait-wall,street-coffee,street-walk}.{webp,jpg}`

**Interfaces:**
- Produces: `npm test` (runs `node --test tests/`), `tests/helpers.mjs` exports `root, read(path), exists(path), html(), tags(src, name), attr(tag, name), cssText()`; `PHOTOS` list exported from `tools/optimize-images.mjs`.

- [ ] **Step 1: Create `package.json` and `.gitignore`**

```json
{
  "name": "sachu-portfolio",
  "private": true,
  "description": "Personal portfolio of Sachu S — static site, dev tooling only",
  "scripts": {
    "test": "node --test tests/",
    "images": "node tools/optimize-images.mjs",
    "gif": "node tools/render-gif.mjs",
    "og": "node tools/render-og.mjs",
    "serve": "http-server . -p 5173 -c-1"
  },
  "devDependencies": {
    "@resvg/resvg-js": "2.6.2",
    "gifenc": "1.0.3",
    "http-server": "14.1.1",
    "sharp": "0.34.5"
  }
}
```

`.gitignore`:
```
node_modules/
```

Run: `npm install` — Expected: installs 4 dev deps, no errors.

- [ ] **Step 2: Write test helpers and the failing assets test**

`tests/helpers.mjs`:
```js
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

export const root = join(dirname(fileURLToPath(import.meta.url)), '..');
export const read = (p) => readFileSync(join(root, p), 'utf8');
export const exists = (p) => existsSync(join(root, p));
export const html = () => read('index.html');
export const tags = (src, name) => [...src.matchAll(new RegExp(`<${name}\\b[^>]*>`, 'gi'))].map((m) => m[0]);
export const attr = (tag, name) => {
  const m = tag.match(new RegExp(`\\s${name}="([^"]*)"`, 'i'));
  return m ? m[1] : null;
};
export const cssText = () =>
  ['css/tokens.css', 'css/base.css', 'css/sections.css'].filter(exists).map(read).join('\n');
```

`tests/assets.test.mjs`:
```js
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
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm test` — Expected: 6 FAIL (`assets/img/portrait-sage.webp missing` …).

- [ ] **Step 4: Write `tools/optimize-images.mjs`**

```js
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
```

Run: `npm run images` — Expected: six lines like `portrait-sage: 858x1280`. **Record the printed dimensions** — they become `width`/`height` attributes in Tasks 4–7.

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm test` — Expected: 6 PASS. If a file exceeds 260KB, lower `quality` by 6 and re-run Step 4.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json .gitignore tools/optimize-images.mjs tests/helpers.mjs tests/assets.test.mjs assets/img
git commit -m "chore: add dev tooling, test harness and optimised photos"
```

---

### Task 2: Pure logic library (`js/lib.js`)

**Files:**
- Create: `js/lib.js`, `tests/lib.test.mjs`

**Interfaces:**
- Produces (browser global `window.PortfolioLib`, Node `require('../js/lib.js')`):
  - `buildMailto(to: string, fields: {name, email, subject, message}) → string`
  - `validateContact(fields) → { valid: boolean, errors: { name?, email?, message? } }`
  - `formatClock(date: Date, timeZone = 'Asia/Kolkata') → 'HH:MM:SS'`
  - `matchesFilter(categories: string, filter: string) → boolean`
  - `createSafeStorage(getStorage: () => Storage) → { get(key) → string|null, set(key, value) → boolean }`

- [ ] **Step 1: Write the failing tests**

`tests/lib.test.mjs`:
```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const lib = require('../js/lib.js');

const fields = { name: 'Ana & Co', email: 'ana@co.io', subject: 'Hi #1?', message: 'Line 1\nLine 2 — ünïcode' };

test('buildMailto encodes subject/body and uses CRLF newlines', () => {
  const url = lib.buildMailto('me@x.com', fields);
  assert.ok(url.startsWith('mailto:me@x.com?subject='));
  assert.ok(!/\s/.test(url), 'no raw whitespace');
  const params = new URLSearchParams(url.slice(url.indexOf('?') + 1));
  assert.equal(params.get('subject'), 'Hi #1?');
  assert.equal(params.get('body'), 'Line 1\r\nLine 2 — ünïcode\r\n\r\n— Ana & Co\r\nana@co.io');
});

test('buildMailto falls back to a default subject and tolerates missing fields', () => {
  const url = lib.buildMailto('me@x.com', { name: ' Ana ', email: 'a@b.co', message: 'Hello there friend' });
  const params = new URLSearchParams(url.slice(url.indexOf('?') + 1));
  assert.equal(params.get('subject'), 'Portfolio enquiry from Ana');
});

test('validateContact flags each invalid field', () => {
  const r = lib.validateContact({ name: 'A', email: 'nope', subject: '', message: 'short' });
  assert.equal(r.valid, false);
  assert.deepEqual(Object.keys(r.errors).sort(), ['email', 'message', 'name']);
});

test('validateContact accepts a complete message', () => {
  assert.deepEqual(lib.validateContact(fields), { valid: true, errors: {} });
});

test('formatClock renders 24h time in Asia/Kolkata by default', () => {
  const d = new Date('2026-10-11T08:35:09Z');
  assert.equal(lib.formatClock(d), '14:05:09');
  assert.equal(lib.formatClock(d, 'UTC'), '08:35:09');
  assert.equal(lib.formatClock(new Date('2026-10-11T18:30:00Z')), '00:00:00');
});

test('matchesFilter handles all, single and multi categories', () => {
  assert.equal(lib.matchesFilter('healthcare', 'all'), true);
  assert.equal(lib.matchesFilter('healthcare enterprise', 'enterprise'), true);
  assert.equal(lib.matchesFilter('commerce', 'healthcare'), false);
  assert.equal(lib.matchesFilter('commerce', ''), true);
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test` — Expected: lib tests FAIL with `Cannot find module '../js/lib.js'`.

- [ ] **Step 3: Implement `js/lib.js`**

```js
/* Pure helpers shared by the browser scripts (window.PortfolioLib) and the Node test suite. */
(function (root, factory) {
  var lib = factory();
  if (typeof module === 'object' && module.exports) module.exports = lib;
  else root.PortfolioLib = lib;
})(typeof window !== 'undefined' ? window : this, function () {
  'use strict';

  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function clean(value) {
    return String(value == null ? '' : value).trim();
  }

  function encodePart(text) {
    return encodeURIComponent(String(text).replace(/\r\n|\r|\n/g, '\r\n'));
  }

  function buildMailto(to, fields) {
    var name = clean(fields.name);
    var subject = clean(fields.subject) || 'Portfolio enquiry from ' + name;
    var body = clean(fields.message) + '\n\n— ' + name + '\n' + clean(fields.email);
    return 'mailto:' + to + '?subject=' + encodePart(subject) + '&body=' + encodePart(body);
  }

  function validateContact(fields) {
    var errors = {};
    if (clean(fields.name).length < 2) errors.name = 'Please enter your name.';
    if (!EMAIL_RE.test(clean(fields.email))) errors.email = 'Please enter a valid email address.';
    if (clean(fields.message).length < 10) errors.message = 'Please write a little more (at least 10 characters).';
    return { valid: Object.keys(errors).length === 0, errors: errors };
  }

  function formatClock(date, timeZone) {
    return new Intl.DateTimeFormat('en-GB', {
      hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
      timeZone: timeZone || 'Asia/Kolkata'
    }).format(date);
  }

  function matchesFilter(categories, filter) {
    if (!filter || filter === 'all') return true;
    return String(categories).split(/\s+/).indexOf(filter) !== -1;
  }

  function createSafeStorage(getStorage) {
    function store() {
      try { return getStorage(); } catch (e) { return null; }
    }
    return {
      get: function (key) {
        try { var s = store(); return s ? s.getItem(key) : null; } catch (e) { return null; }
      },
      set: function (key, value) {
        try { var s = store(); if (!s) return false; s.setItem(key, value); return true; } catch (e) { return false; }
      }
    };
  }

  return {
    buildMailto: buildMailto,
    validateContact: validateContact,
    formatClock: formatClock,
    matchesFilter: matchesFilter,
    createSafeStorage: createSafeStorage
  };
});
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test` — Expected: all lib + asset tests PASS.

- [ ] **Step 5: Commit**

```bash
git add js/lib.js tests/lib.test.mjs
git commit -m "feat: add pure helper library for mailto, validation, clock, filters, storage"
```

---

### Task 3: Document shell — head, tokens, base styles, nav, menu, loader, boot script

**Files:**
- Replace: `index.html` (new document; sections added in later tasks)
- Create: `css/tokens.css`, `css/base.css`, `css/sections.css` (empty header comment for now), `js/main.js`, `assets/favicon.svg`, `assets/svg/monogram.svg`, `tests/site.test.mjs`
- Delete: `css/style.css`, `js/script.js`

**Interfaces:**
- Consumes: `PortfolioLib.createSafeStorage`.
- Produces: `window.Portfolio` (see contract), `html.motion-ready/show-intro/menu-open`, nav markup `.nav`, `.nav__burger[aria-controls=menu]`, `#menu.menu[inert]`, `.theme-toggle`, `.progress__bar`, `.loader` with `.loader__count` and `.monogram path`, `.cursor` markup, `.toast[role=status]`, `.work-preview`.

- [ ] **Step 1: Write the failing site tests**

`tests/site.test.mjs`:
```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { html, tags, attr, exists, read, cssText } from './helpers.mjs';

const src = html();
const isLocal = (u) => u && !/^(https?:|mailto:|tel:|#|data:)/.test(u);

test('head has title, description, social and theme meta', () => {
  assert.match(src, /<title>Sachu S[^<]*<\/title>/);
  for (const re of [/name="description"/, /property="og:title"/, /property="og:description"/, /property="og:image"/, /name="twitter:card"/, /name="theme-color"/]) {
    assert.match(src, re);
  }
  assert.match(src, /<link rel="icon" href="assets\/favicon\.svg" type="image\/svg\+xml"/);
  assert.match(src, /"@type":\s*"Person"/);
});

test('every local src/href/srcset target exists', () => {
  const refs = [];
  for (const t of [...tags(src, 'img'), ...tags(src, 'source'), ...tags(src, 'script'), ...tags(src, 'link'), ...tags(src, 'a')]) {
    for (const name of ['src', 'href']) refs.push(attr(t, name));
    const srcset = attr(t, 'srcset');
    if (srcset) srcset.split(',').forEach((s) => refs.push(s.trim().split(/\s+/)[0]));
  }
  for (const ref of refs.filter(isLocal)) assert.ok(exists(decodeURI(ref.split('?')[0])), `missing ${ref}`);
});

test('every in-page anchor points to an existing id', () => {
  const ids = new Set([...src.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
  for (const t of tags(src, 'a')) {
    const href = attr(t, 'href');
    if (href && href.startsWith('#') && href.length > 1) assert.ok(ids.has(href.slice(1)), `no id for ${href}`);
  }
});

test('scripts are classic and CDN versions are pinned', () => {
  for (const t of tags(src, 'script')) {
    assert.ok(!/type="module"/.test(t), 'module script found');
    const s = attr(t, 'src');
    if (s && s.startsWith('http')) assert.match(s, /@\d+\.\d+\.\d+\//, `unpinned ${s}`);
  }
});

test('head boot script sets motion classes with a safety timeout', () => {
  const head = src.slice(0, src.indexOf('</head>'));
  assert.match(head, /motion-ready/);
  assert.match(head, /prefers-reduced-motion/);
  assert.match(head, /__portfolioBooted/);
  assert.match(head, /setTimeout\(/);
});

test('hidden states for [data-anim] are scoped to .motion-ready', () => {
  const hiding = /opacity:\s*0(?![.\d])|visibility:\s*hidden|clip-path:\s*inset\(/;
  for (const [, selectors, body] of cssText().matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    if (!hiding.test(body)) continue;
    for (const sel of selectors.split(',')) {
      if (sel.includes('[data-anim')) assert.ok(sel.trim().startsWith('.motion-ready'), `unscoped: ${sel.trim()}`);
    }
  }
});

test('legacy assets are no longer referenced', () => {
  assert.ok(!/css\/style\.css|js\/script\.js|images\//.test(src));
  assert.ok(!exists('css/style.css') && !exists('js/script.js'));
});

test('nav, menu and loader contract exists', () => {
  assert.match(src, /class="nav__burger"[^>]*aria-controls="menu"[^>]*aria-expanded="false"/);
  assert.match(src, /<div id="menu" class="menu"[^>]*inert/);
  assert.match(src, /class="loader"/);
  assert.match(src, /class="skip-link" href="#main"/);
  assert.match(read('assets/svg/monogram.svg'), /@keyframes/);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test` — Expected: site tests FAIL (old `index.html` has no og meta, references `css/style.css`, etc.).

- [ ] **Step 3: Create the SVG monogram and favicon**

`assets/svg/monogram.svg` — two interlocking serif-like "S" strokes inside a circle, self-animating:
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="240" height="240" role="img" aria-labelledby="t">
  <title id="t">SS monogram</title>
  <style>
    .s { fill: none; stroke: #2F4A3A; stroke-width: 5; stroke-linecap: round; stroke-linejoin: round;
         stroke-dasharray: 260; stroke-dashoffset: 260; animation: draw 4s cubic-bezier(.7,0,.3,1) infinite; }
    .s2 { stroke: #6E8F72; animation-delay: .25s; }
    .ring { fill: none; stroke: #C8A97E; stroke-width: 1.5; stroke-dasharray: 4 6; transform-origin: 60px 60px; animation: spin 18s linear infinite; }
    @keyframes draw { 0% { stroke-dashoffset: 260; } 35%, 75% { stroke-dashoffset: 0; } 100% { stroke-dashoffset: -260; } }
    @keyframes spin { to { transform: rotate(360deg); } }
    @media (prefers-reduced-motion: reduce) { .s { animation: none; stroke-dashoffset: 0; } .ring { animation: none; } }
  </style>
  <circle class="ring" cx="60" cy="60" r="54"/>
  <path class="s" d="M58 34c-4-5-10-7-16-7-9 0-15 5-15 12 0 16 31 10 31 27 0 8-7 13-16 13-7 0-13-3-17-8"/>
  <path class="s s2" d="M94 42c-4-5-10-7-16-7-9 0-15 5-15 12 0 16 31 10 31 27 0 8-7 13-16 13-7 0-13-3-17-8"/>
</svg>
```

`assets/favicon.svg` — static: paper rounded square, the two S paths in moss/sage (`stroke-dashoffset` 0, no animation).

- [ ] **Step 4: Write `css/tokens.css`**

```css
/* Design tokens — Editorial × Engineering. Light is default; dark via [data-theme="dark"]. */
:root {
  --paper: #F4F1EA; --paper-2: #EAE5DA; --ink: #141614; --ink-soft: #5B605A;
  --sage: #6E8F72; --moss: #2F4A3A; --sand: #C8A97E; --rule: rgb(20 22 20 / .14);
  --on-accent: #F4F1EA;
  --font-display: "Fraunces", Georgia, "Times New Roman", serif;
  --font-body: "Inter", system-ui, -apple-system, "Segoe UI", sans-serif;
  --font-mono: "JetBrains Mono", ui-monospace, Consolas, monospace;
  --step--1: clamp(.82rem, .8rem + .1vw, .9rem);
  --step-0: clamp(1rem, .96rem + .2vw, 1.0625rem);
  --step-1: clamp(1.25rem, 1.1rem + .6vw, 1.6rem);
  --step-2: clamp(1.6rem, 1.3rem + 1.4vw, 2.4rem);
  --step-3: clamp(2.2rem, 1.6rem + 3vw, 4.2rem);
  --step-4: clamp(2.8rem, 1.6rem + 6vw, 7.5rem);
  --space-section: clamp(6rem, 4rem + 8vw, 11rem);
  --gutter: clamp(1rem, .5rem + 2.5vw, 3rem);
  --max: 1320px;
  --radius: 18px;
  --ease-out: cubic-bezier(.16, 1, .3, 1);
  --ease-in-out: cubic-bezier(.7, 0, .3, 1);
  color-scheme: light;
}
:root[data-theme="dark"] {
  --paper: #0F120F; --paper-2: #171B17; --ink: #ECE8DF; --ink-soft: #A3A89F;
  --sage: #8FB393; --moss: #C9DCC8; --sand: #D6BA8F; --rule: rgb(236 232 223 / .14);
  --on-accent: #0F120F;
  color-scheme: dark;
}
```

- [ ] **Step 5: Write `css/base.css`**

Must contain (complete rules, not just these selectors):
- Reset (`*,*::before,*::after{box-sizing:border-box;margin:0}`), `html{-webkit-text-size-adjust:100%}`, `body{background:var(--paper);color:var(--ink);font:400 var(--step-0)/1.65 var(--font-body);overflow-x:clip;transition:background-color .5s,color .5s}`, `img,svg{display:block;max-width:100%}`, `::selection{background:var(--sage);color:var(--on-accent)}`.
- Lenis rules: `html.lenis,html.lenis body{height:auto}` `.lenis.lenis-smooth{scroll-behavior:auto!important}` `.lenis.lenis-stopped{overflow:hidden}`.
- Typography utilities: `.display` (Fraunces, `font-variation-settings:"opsz" 144,"SOFT" 50`, weight 350, line-height .95, letter-spacing -.02em), `.display em{font-style:italic;color:var(--sage)}`, `.mono-label` (mono, `--step--1`, uppercase, letter-spacing .14em, color ink-soft), `.section-label` (mono label with leading `—` rule), `.container{width:min(100% - 2*var(--gutter), var(--max));margin-inline:auto}`, `.section{padding-block:var(--space-section)}`, `.visually-hidden`.
- `.skip-link` (off-screen until `:focus`), `:focus-visible{outline:2px solid var(--sage);outline-offset:3px;border-radius:4px}`.
- Grain: `body::after{content:"";position:fixed;inset:-50%;pointer-events:none;z-index:90;opacity:.06;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");}` and `.motion-ready body::after{animation:grain 1.2s steps(6) infinite}` with `@keyframes grain` translating in 6 jumps of ±5%.
- `.progress{position:fixed;inset:0 0 auto;height:2px;z-index:80}` `.progress__bar{height:100%;background:var(--sage);transform-origin:0 50%;transform:scaleX(0)}`.
- Buttons: `.btn` (pill, 1px ink border, mono uppercase label, `padding:1rem 1.6rem`, hover fills ink with paper text via `::before` sliding up), `.btn--solid` (moss bg / paper text in light, sage bg in dark), `.btn .arrow` slides on hover.
- Nav: `.nav{position:fixed;inset:0 0 auto;z-index:70;transition:transform .5s var(--ease-out),background-color .3s}` `.nav.is-scrolled{background:color-mix(in srgb,var(--paper) 82%,transparent);backdrop-filter:blur(12px);border-bottom:1px solid var(--rule)}` `.nav.is-hidden{transform:translateY(-100%)}`; inner flex row `.nav__inner` (logo, `.nav__links` hidden below 900px, `.theme-toggle` 40px circle with sun/moon SVG swapped by `[data-theme]`, `.nav__cta`, `.nav__burger` shown below 900px with two lines morphing to × under `.menu-open`).
- Menu: `.menu{position:fixed;inset:0;z-index:65;background:var(--paper-2);display:grid;place-content:center;opacity:0;visibility:hidden;transition:opacity .4s,visibility .4s}` `.menu-open .menu{opacity:1;visibility:visible}`; `.menu__link` large Fraunces inside an `overflow:hidden` wrapper; at `min-width:900px` `.menu{display:none}`.
- Loader: `.loader{display:none}` `.show-intro .loader{display:grid;position:fixed;inset:0;z-index:100;background:var(--paper);place-content:center;justify-items:center;gap:1.5rem}` `.loader .monogram{width:96px}` `.loader__count` mono.
- Cursor: `.cursor{display:none}` `.has-cursor .cursor{display:block}` dot 8px ink, ring 40px 1px border, both `position:fixed;top:0;left:0;pointer-events:none;z-index:95;mix-blend-mode:difference` with `background/border-color:#fff`; `.cursor.is-link .cursor__ring{transform:scale(1.6)}` (use `scale` property, not transform, because GSAP owns transform); `.cursor.is-view .cursor__ring{scale:2.4;background:#fff}` label centered mono 10px; `.has-cursor, .has-cursor a, .has-cursor button{cursor:none}` and `.has-cursor input,.has-cursor textarea{cursor:text}`.
- Toast: `.toast{position:fixed;left:50%;bottom:2rem;translate:-50% 150%;transition:translate .5s var(--ease-out)}` `.toast.is-visible{translate:-50% 0}`.
- Work preview shell: `.work-preview{position:fixed;top:0;left:0;width:280px;aspect-ratio:4/3;pointer-events:none;z-index:60;border-radius:var(--radius);overflow:hidden;opacity:0;visibility:hidden;background:var(--paper-2)}` (hidden by default; JS animates it).
- `@media (prefers-reduced-motion: reduce){*,*::before,*::after{animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important;scroll-behavior:auto!important}}`.

`css/sections.css`: `/* Section layouts: hero → footer. */` (filled from Task 4).

- [ ] **Step 6: Write the new `index.html` shell**

```html
<!doctype html>
<html lang="en" data-theme="light">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Sachu S — Technical Lead & Software Engineer</title>
  <meta name="description" content="Sachu S is a Technical Lead and Software Engineer in Kerala, India, building HIPAA-compliant healthcare data platforms with Python, Django and FastAPI." />
  <meta name="theme-color" content="#F4F1EA" />
  <meta property="og:type" content="website" />
  <meta property="og:title" content="Sachu S — Technical Lead & Software Engineer" />
  <meta property="og:description" content="Engineering calm systems for messy healthcare data. Python · Django · FastAPI · EDI 835/837." />
  <meta property="og:image" content="https://sachusudevan.github.io/portfolio/assets/og-image.png" />
  <meta property="og:url" content="https://sachusudevan.github.io/portfolio/" />
  <meta name="twitter:card" content="summary_large_image" />
  <link rel="icon" href="assets/favicon.svg" type="image/svg+xml" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin />
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght,SOFT@0,9..144,300..700,0..100;1,9..144,300..700,0..100&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap" />
  <link rel="stylesheet" href="css/tokens.css" />
  <link rel="stylesheet" href="css/base.css" />
  <link rel="stylesheet" href="css/sections.css" />
  <script>
    /* Boot before first paint: theme + motion flags. Falls back to static if scripts never boot. */
    (function (d, w) {
      var r = d.documentElement, theme = null, seen = false;
      try { theme = w.localStorage.getItem('theme'); } catch (e) {}
      if (theme !== 'light' && theme !== 'dark') theme = w.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      r.setAttribute('data-theme', theme);
      var reduce = w.matchMedia('(prefers-reduced-motion: reduce)').matches || /[?&]motion=off\b/.test(w.location.search);
      if (reduce) return;
      r.classList.add('motion-ready');
      try { seen = w.sessionStorage.getItem('intro-seen') === '1'; } catch (e) {}
      if (!seen) r.classList.add('show-intro');
      w.setTimeout(function () { if (!w.__portfolioBooted) r.classList.remove('motion-ready', 'show-intro'); }, 3500);
    })(document, window);
  </script>
  <script type="application/ld+json">
    {"@context":"https://schema.org","@type":"Person","name":"Sachu S","jobTitle":"Technical Lead & Software Engineer","worksFor":{"@type":"Organization","name":"Aventus Informatics"},"address":{"@type":"PostalAddress","addressRegion":"Kerala","addressCountry":"IN"},"email":"mailto:sachusudeve8690@gmail.com","url":"https://sachusudevan.github.io/portfolio/","sameAs":["https://linkedin.com/in/sachu-s-705813179","https://github.com/sachusudevan"],"knowsAbout":["Python","Django","FastAPI","PostgreSQL","HIPAA","EDI 835","EDI 837"]}
  </script>
</head>
<body>
  <a class="skip-link" href="#main">Skip to content</a>
  <div class="progress" aria-hidden="true"><div class="progress__bar"></div></div>
  <div class="loader" aria-hidden="true">
    <svg class="monogram" viewBox="0 0 120 120"><!-- same two .s paths as assets/svg/monogram.svg, stroke currentColor --></svg>
    <span class="loader__count mono-label">000</span>
  </div>
  <div class="cursor" aria-hidden="true"><div class="cursor__ring"><span class="cursor__label"></span></div><div class="cursor__dot"></div></div>
  <header class="nav">
    <div class="nav__inner container">
      <a class="nav__logo" href="#hero" aria-label="Sachu S — back to top"><!-- inline monogram svg 36px --></a>
      <nav class="nav__links" aria-label="Primary">
        <a href="#work">Work</a><a href="#about">About</a><a href="#pipeline">Pipeline</a><a href="#contact">Contact</a>
      </nav>
      <button class="theme-toggle" type="button" aria-label="Switch to dark theme"><!-- sun + moon svgs --></button>
      <a class="btn btn--solid nav__cta" href="#contact" data-magnetic="0.25">Let's talk</a>
      <button class="nav__burger" type="button" aria-controls="menu" aria-expanded="false" aria-label="Open menu"><span></span><span></span></button>
    </div>
  </header>
  <div id="menu" class="menu" inert>
    <nav aria-label="Mobile">
      <ul class="menu__list">
        <li><a class="menu__link" href="#work">Work</a></li>
        <li><a class="menu__link" href="#about">About</a></li>
        <li><a class="menu__link" href="#pipeline">Pipeline</a></li>
        <li><a class="menu__link" href="#experience">Experience</a></li>
        <li><a class="menu__link" href="#contact">Contact</a></li>
      </ul>
    </nav>
  </div>
  <main id="main" tabindex="-1">
    <section id="hero" class="hero"></section>
    <!-- Tasks 4–7 add the remaining sections here -->
  </main>
  <div class="work-preview" aria-hidden="true"></div>
  <div class="toast" role="status" aria-live="polite"></div>

  <script defer src="https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/gsap.min.js"></script>
  <script defer src="https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/ScrollTrigger.min.js"></script>
  <script defer src="https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/SplitText.min.js"></script>
  <script defer src="https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/DrawSVGPlugin.min.js"></script>
  <script defer src="https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/MotionPathPlugin.min.js"></script>
  <script defer src="https://cdn.jsdelivr.net/npm/lenis@1.3.23/dist/lenis.min.js"></script>
  <script defer src="js/lib.js"></script>
  <script defer src="js/main.js"></script>
</body>
</html>
```
(The inline-SVG comments above are filled with the real monogram/sun/moon paths when writing the file.)

- [ ] **Step 7: Write `js/main.js`**

```js
/* Boot: motion detection, smooth scroll, theme, nav, menu, progress, anchors and the intro loader. */
(function () {
  'use strict';
  var root = document.documentElement;
  var lib = window.PortfolioLib;
  var gsap = window.gsap;
  var hasMotionLibs = !!(gsap && window.ScrollTrigger && window.SplitText && window.DrawSVGPlugin && window.MotionPathPlugin);
  var motion = root.classList.contains('motion-ready') && hasMotionLibs;

  if (motion) {
    window.__portfolioBooted = true;
    gsap.registerPlugin(ScrollTrigger, SplitText, DrawSVGPlugin, MotionPathPlugin);
  } else {
    root.classList.remove('motion-ready', 'show-intro');
  }

  var Portfolio = (window.Portfolio = {
    motion: motion,
    lenis: null,
    storage: lib.createSafeStorage(function () { return window.localStorage; }),
    introDone: null
  });
  var session = lib.createSafeStorage(function () { return window.sessionStorage; });

  /* Smooth scroll */
  if (motion && window.Lenis) {
    var lenis = new Lenis({ lerp: 0.1 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
    gsap.ticker.lagSmoothing(0);
    Portfolio.lenis = lenis;
  }

  /* Theme */
  var themeMeta = document.querySelector('meta[name="theme-color"]');
  var toggle = document.querySelector('.theme-toggle');
  function applyTheme(theme) {
    root.setAttribute('data-theme', theme);
    Portfolio.storage.set('theme', theme);
    if (themeMeta) themeMeta.setAttribute('content', theme === 'dark' ? '#0F120F' : '#F4F1EA');
    if (toggle) toggle.setAttribute('aria-label', theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
  }
  applyTheme(root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light');
  if (toggle) toggle.addEventListener('click', function (e) {
    var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    if (!motion || !document.startViewTransition) return applyTheme(next);
    var rect = toggle.getBoundingClientRect();
    var x = e.clientX || rect.left + rect.width / 2;
    var y = e.clientY || rect.top + rect.height / 2;
    var r = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    document.startViewTransition(function () { applyTheme(next); }).ready.then(function () {
      root.animate(
        { clipPath: ['circle(0px at ' + x + 'px ' + y + 'px)', 'circle(' + r + 'px at ' + x + 'px ' + y + 'px)'] },
        { duration: 700, easing: 'cubic-bezier(.7,0,.3,1)', pseudoElement: '::view-transition-new(root)' }
      );
    });
  });

  /* Nav state + progress bar (plain scroll events — Lenis drives native scroll) */
  var nav = document.querySelector('.nav');
  var bar = document.querySelector('.progress__bar');
  var lastY = window.scrollY, ticking = false;
  function onScroll() {
    var y = window.scrollY;
    var max = root.scrollHeight - window.innerHeight;
    nav.classList.toggle('is-scrolled', y > 40);
    nav.classList.toggle('is-hidden', y > lastY && y > 240 && !root.classList.contains('menu-open'));
    bar.style.transform = 'scaleX(' + (max > 0 ? Math.min(y / max, 1) : 0) + ')';
    lastY = y;
    ticking = false;
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  nav.addEventListener('focusin', function () { nav.classList.remove('is-hidden'); });
  onScroll();

  /* Mobile menu */
  var burger = document.querySelector('.nav__burger');
  var menu = document.getElementById('menu');
  function setMenu(open, restoreFocus) {
    root.classList.toggle('menu-open', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    menu.inert = !open;
    if (Portfolio.lenis) open ? Portfolio.lenis.stop() : Portfolio.lenis.start();
    if (open) {
      if (motion) gsap.fromTo(menu.querySelectorAll('.menu__link'), { yPercent: 110 }, { yPercent: 0, duration: 0.9, ease: 'expo.out', stagger: 0.06 });
      menu.querySelector('a').focus();
    } else if (restoreFocus) burger.focus();
  }
  burger.addEventListener('click', function () { setMenu(!root.classList.contains('menu-open'), true); });
  document.addEventListener('keydown', function (e) {
    if (!root.classList.contains('menu-open')) return;
    if (e.key === 'Escape') return setMenu(false, true);
    if (e.key !== 'Tab') return;
    var items = [burger].concat(Array.prototype.slice.call(menu.querySelectorAll('a')));
    var i = items.indexOf(document.activeElement);
    if (e.shiftKey && i <= 0) { e.preventDefault(); items[items.length - 1].focus(); }
    else if (!e.shiftKey && i === items.length - 1) { e.preventDefault(); items[0].focus(); }
  });
  window.matchMedia('(min-width: 900px)').addEventListener('change', function (mq) { if (mq.matches) setMenu(false, false); });

  /* In-page anchors */
  document.addEventListener('click', function (e) {
    var link = e.target.closest('a[href^="#"]');
    if (!link) return;
    var id = link.getAttribute('href');
    var target = id.length > 1 && document.getElementById(id.slice(1));
    if (!target) return;
    e.preventDefault();
    if (root.classList.contains('menu-open')) setMenu(false, false);
    if (Portfolio.lenis) Portfolio.lenis.scrollTo(target, { duration: 1.4 });
    else target.scrollIntoView({ behavior: motion ? 'smooth' : 'auto' });
    if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
    history.replaceState(null, '', id);
  });

  /* Intro loader — always resolves within 3s */
  Portfolio.introDone = new Promise(function (resolve) {
    if (!motion || !root.classList.contains('show-intro')) return resolve();
    var loader = document.querySelector('.loader');
    var count = loader.querySelector('.loader__count');
    var done = false;
    function finish() {
      if (done) return;
      done = true;
      session.set('intro-seen', '1');
      root.classList.remove('show-intro');
      if (Portfolio.lenis) Portfolio.lenis.start();
      resolve();
    }
    if (Portfolio.lenis) Portfolio.lenis.stop();
    var n = { v: 0 };
    var tl = gsap.timeline({ onComplete: finish });
    tl.from(loader.querySelectorAll('.monogram path'), { drawSVG: 0, duration: 1.1, ease: 'power2.inOut', stagger: 0.15 })
      .to(n, { v: 100, duration: 1.2, ease: 'power2.inOut', onUpdate: function () { count.textContent = String(Math.round(n.v)).padStart(3, '0'); } }, 0)
      .to(loader, { yPercent: -100, duration: 0.9, ease: 'expo.inOut' }, '+=0.1');
    window.setTimeout(function () { tl.progress(1); finish(); }, 3000);
  });

  if (motion) document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
})();
```

- [ ] **Step 8: Delete legacy files and run tests**

```bash
git rm -q css/style.css js/script.js
npm test
```
Expected: all site tests PASS (the in-page anchor test passes because `#hero`, `#main`, `#menu` exist; links to `#work`, `#about`, `#pipeline`, `#experience`, `#contact` **fail** until Tasks 4–7 — so for this task add temporary empty `<section id="…">` placeholders for each of those ids inside `<main>`; later tasks replace them).

- [ ] **Step 9: Browser smoke check**

Start the preview (Task 9 adds `.claude/launch.json`; for now `npx http-server . -p 5173 -c-1`). Load `http://localhost:5173/`. Expected: loader draws monogram and lifts once; reload → no loader (session); theme toggle swaps palette with circular wipe; console has no errors.

- [ ] **Step 10: Commit**

```bash
git add -A index.html css js/main.js assets/favicon.svg assets/svg/monogram.svg tests/site.test.mjs
git commit -m "feat: new document shell with tokens, nav, menu, loader and boot script"
```

---

### Task 4: Hero, marquee and About + generic motion layer

**Files:**
- Modify: `index.html` (replace `#hero` placeholder, add `.marquee`, replace `#about` placeholder), `css/sections.css`, `tests/site.test.mjs`
- Create: `js/motion.js` (+ `<script defer src="js/motion.js">` after `main.js`)

**Interfaces:**
- Consumes: `window.Portfolio.{motion, introDone}`, `data-anim` contract.
- Produces: generic handlers for `data-anim="lines|fade|stagger|wipe"`, `[data-speed]`, `[data-count]`, `.marquee__row/.marquee__track`, `.timeline__progress/.timeline__item`, `.beyond/.beyond__track` (the last two are inert until Tasks 6–7 add markup).

- [ ] **Step 1: Add failing tests** (append to `tests/site.test.mjs`)

```js
import sharp from 'sharp';
import { join } from 'node:path';
import { root } from './helpers.mjs';

test('exactly one h1, inside the hero', () => {
  assert.equal((src.match(/<h1\b/g) || []).length, 1);
  assert.match(src, /<section id="hero"[\s\S]*?<h1\b[\s\S]*?<\/section>/);
});

test('images have alt, width, height and lazy-loading except the hero', async () => {
  for (const t of tags(src, 'img')) {
    assert.ok(attr(t, 'alt') !== null, `alt missing: ${t}`);
    const w = Number(attr(t, 'width')), h = Number(attr(t, 'height'));
    assert.ok(w > 0 && h > 0, `size missing: ${t}`);
    const file = attr(t, 'src');
    if (file.startsWith('assets/img/')) {
      const meta = await sharp(join(root, file)).metadata();
      assert.ok(Math.abs(w / h - meta.width / meta.height) < 0.01, `aspect mismatch: ${file}`);
    }
    if (!/fetchpriority="high"/.test(t)) assert.match(t, /loading="lazy"/);
  }
});

test('about section carries the three stats', () => {
  assert.match(src, /data-count="5" data-suffix="\+"/);
  assert.match(src, /data-count="20" data-suffix="\+"/);
  assert.match(src, /data-count="100" data-suffix="%"/);
});
```

Run: `npm test` — Expected: these FAIL.

- [ ] **Step 2: Hero + marquee + About markup**

```html
<section id="hero" class="hero">
  <div class="hero__grid container">
    <div class="hero__copy">
      <p class="mono-label" data-anim="hero-fade">Sachu S — Technical Lead</p>
      <h1 class="hero__title display" data-anim="hero-title">Engineering <em>calm</em> systems for messy healthcare data.</h1>
      <p class="hero__lede" data-anim="hero-fade">I design and lead HIPAA-compliant platforms that turn EOBs, 835/837 files and patient-pay documents into clean, reliable data — with Python, Django and FastAPI.</p>
      <div class="hero__actions" data-anim="hero-fade">
        <a class="btn btn--solid" href="#work" data-magnetic="0.3">See the work <span class="arrow" aria-hidden="true">→</span></a>
        <a class="btn" href="#contact" data-magnetic="0.3">Get in touch</a>
      </div>
    </div>
    <figure class="hero__media" data-anim="hero-media">
      <picture>
        <source srcset="assets/img/portrait-sage.webp" type="image/webp" />
        <img src="assets/img/portrait-sage.jpg" alt="Sachu S in a sage suit, seated on a stool against a green backdrop" width="{W}" height="{H}" fetchpriority="high" data-speed="-0.6" />
      </picture>
      <figcaption class="hero__badge" aria-hidden="true"><!-- rotating circular text svg: textPath "Python · Django · FastAPI · PostgreSQL · " + centre arrow --></figcaption>
    </figure>
  </div>
  <div class="hero__meta container" data-anim="hero-fade">
    <span class="mono-label">Technical Lead · Aventus Informatics</span>
    <span class="mono-label">Kerala, IN</span>
    <span class="mono-label status"><span class="status__dot"></span>Open to opportunities</span>
  </div>
</section>

<div class="marquee" aria-hidden="true">
  <div class="marquee__row"><div class="marquee__track">
    <!-- repeat this group twice inside the track -->
    <span>Python</span><span class="sep">✳</span><span><em>Django</em></span><span class="sep">✳</span><span>FastAPI</span><span class="sep">✳</span><span><em>PostgreSQL</em></span><span class="sep">✳</span><span>REST APIs</span><span class="sep">✳</span>
  </div></div>
  <div class="marquee__row marquee__row--mono"><div class="marquee__track">
    <!-- repeat twice -->
    <span>HIPAA</span><span class="sep">/</span><span>EDI 835</span><span class="sep">/</span><span>EDI 837</span><span class="sep">/</span><span>EOB processing</span><span class="sep">/</span><span>File pipelines</span><span class="sep">/</span><span>Team leadership</span><span class="sep">/</span>
  </div></div>
</div>

<section id="about" class="section about">
  <div class="container">
    <p class="section-label">01 — About</p>
    <div class="about__grid">
      <div class="about__copy">
        <h2 class="display about__quote" data-anim="lines">I like the unglamorous problems — the <em>835 file</em> at 2&nbsp;a.m. that has to be right.</h2>
        <div data-anim="stagger">
          <p>I'm a software engineer and technical lead with 5+ years of designing, building and leading scalable web applications and enterprise healthcare solutions.</p>
          <p>My speciality is HIPAA-compliant healthcare data processing: EDI transactions (835/837), EOB and patient-pay workflows, and architectures that handle very large files without breaking a sweat.</p>
          <p>I lead product architecture, mentor engineers and deliver client-customised enterprise platforms end to end.</p>
        </div>
        <dl class="stats">
          <div><dt class="mono-label">Years experience</dt><dd class="display" data-count="5" data-suffix="+">5+</dd></div>
          <div><dt class="mono-label">Projects delivered</dt><dd class="display" data-count="20" data-suffix="+">20+</dd></div>
          <div><dt class="mono-label">Client satisfaction</dt><dd class="display" data-count="100" data-suffix="%">100%</dd></div>
        </dl>
      </div>
      <div class="about__media">
        <figure class="about__photo about__photo--main" data-anim="wipe" data-speed="0.5"><picture>…portrait-sand…</picture></figure>
        <figure class="about__photo about__photo--inset" data-anim="wipe" data-speed="1.4"><picture>…portrait-noir…</picture></figure>
      </div>
    </div>
  </div>
</section>
```
(`{W}`/`{H}` = dimensions printed in Task 1 Step 4. `<picture>` blocks for sand/noir follow the hero pattern with `loading="lazy"` and descriptive alts: "Sachu S in a beige double-breasted suit against a concrete wall", "Black-and-white studio portrait of Sachu S seated in a dark suit".)

- [ ] **Step 3: Section CSS** (append to `css/sections.css`)

Complete rules for:
- `.hero{min-height:100svh;padding-top:7rem;display:grid;align-content:center}`; `.hero__grid{display:grid;grid-template-columns:1.25fr .75fr;gap:var(--gutter);align-items:end}`; `.hero__title{font-size:var(--step-4)}`; `.hero__media{position:relative;border-radius:999px 999px var(--radius) var(--radius);overflow:hidden;aspect-ratio:3/4.2;background:var(--moss)}` with `img{width:100%;height:115%;object-fit:cover}`; `.hero__badge` 120px circle absolutely positioned bottom-left overlapping the frame, its text svg spinning via `@keyframes spin 16s linear infinite`; `.hero__meta` flex row with hairline top border; `.status__dot` 8px sage with `@keyframes pulse` ring.
- Motion start states (scoped): `.motion-ready [data-anim="hero-title"]{visibility:hidden}` `.motion-ready [data-anim="hero-fade"]{opacity:0;transform:translateY(24px)}` `.motion-ready [data-anim="hero-media"]{clip-path:inset(100% 0 0 0)}`.
- `.marquee{padding-block:2.5rem;border-block:1px solid var(--rule);overflow:hidden}` `.marquee__track{display:flex;width:max-content;gap:2rem;font:italic 300 var(--step-3)/1 var(--font-display)}` `.marquee__row--mono .marquee__track{font:500 var(--step-1)/1 var(--font-mono);text-transform:uppercase;color:var(--ink-soft)}` `.sep{color:var(--sage)}`; when not `.motion-ready`, `.marquee__track{animation:none}` (static row is fine).
- `.about__grid{display:grid;grid-template-columns:1.1fr .9fr;gap:calc(var(--gutter)*2)}`, `.about__quote{font-size:var(--step-3)}`, `.stats{display:grid;grid-template-columns:repeat(3,1fr);border-top:1px solid var(--rule)}` `dd{font-size:var(--step-3)}`, `.about__media{position:relative}` main photo 80% width, inset photo 48% width absolutely bottom-right with 6px paper border.
- `@media (max-width: 899px)`: hero grid single column, media first with max-height 70svh; about grid single column; stats keep 3 columns at small font.

- [ ] **Step 4: Write `js/motion.js`**

```js
/* Generic scroll/entrance motion. Section-specific timelines live in their own files. */
(function () {
  'use strict';
  var P = window.Portfolio;
  if (!P || !P.motion) return;
  var mm = gsap.matchMedia();
  var each = function (sel, fn) { gsap.utils.toArray(sel).forEach(fn); };
  var fontsReady = Promise.race([document.fonts.ready, new Promise(function (r) { setTimeout(r, 1500); })]);

  /* Hero entrance, after the intro loader */
  Promise.all([P.introDone, fontsReady]).then(function () {
    var title = document.querySelector('[data-anim="hero-title"]');
    if (!title) return;
    gsap.set(title, { visibility: 'visible' });
    var split = SplitText.create(title, { type: 'lines', mask: 'lines' });
    gsap.timeline({ defaults: { ease: 'expo.out' } })
      .from(split.lines, { yPercent: 110, duration: 1.3, stagger: 0.1 })
      .to('[data-anim="hero-media"]', { clipPath: 'inset(0% 0 0 0)', duration: 1.6, ease: 'expo.inOut' }, 0)
      .from('[data-anim="hero-media"] img', { scale: 1.3, duration: 2.2 }, 0.1)
      .to('[data-anim="hero-fade"]', { opacity: 1, y: 0, duration: 1.1, stagger: 0.08, ease: 'power3.out' }, 0.45);
  });

  /* Split-line headings */
  fontsReady.then(function () {
    each('[data-anim="lines"]', function (el) {
      SplitText.create(el, {
        type: 'lines', mask: 'lines', autoSplit: true,
        onSplit: function (self) {
          return gsap.from(self.lines, { yPercent: 105, duration: 1.1, ease: 'expo.out', stagger: 0.08,
            scrollTrigger: { trigger: el, start: 'top 85%', once: true } });
        }
      });
    });
  });

  each('[data-anim="fade"]', function (el) {
    gsap.from(el, { y: 40, autoAlpha: 0, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 88%', once: true } });
  });

  each('[data-anim="stagger"]', function (el) {
    gsap.from(el.children, { y: 30, autoAlpha: 0, duration: 0.9, ease: 'power3.out', stagger: 0.08, scrollTrigger: { trigger: el, start: 'top 85%', once: true } });
  });

  each('[data-anim="wipe"]', function (el) {
    var img = el.querySelector('img');
    var tl = gsap.timeline({ scrollTrigger: { trigger: el, start: 'top 85%', once: true } });
    tl.fromTo(el, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.4, ease: 'expo.inOut' });
    if (img) tl.fromTo(img, { scale: 1.25 }, { scale: 1, duration: 1.8, ease: 'expo.out' }, 0);
  });

  each('[data-speed]', function (el) {
    gsap.to(el, { yPercent: -parseFloat(el.dataset.speed) * 10, ease: 'none',
      scrollTrigger: { trigger: el.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } });
  });

  each('[data-count]', function (el) {
    var end = parseFloat(el.dataset.count), suffix = el.dataset.suffix || '', n = { v: 0 };
    el.textContent = '0' + suffix;
    gsap.to(n, { v: end, duration: 2, ease: 'power2.out', scrollTrigger: { trigger: el, start: 'top 90%', once: true },
      onUpdate: function () { el.textContent = Math.round(n.v) + suffix; } });
  });

  /* Marquee: constant drift, boosted and reversed by scroll velocity */
  var loops = gsap.utils.toArray('.marquee__row').map(function (row, i) {
    var track = row.querySelector('.marquee__track');
    return i % 2
      ? gsap.fromTo(track, { xPercent: -50 }, { xPercent: 0, duration: 45, ease: 'none', repeat: -1 })
      : gsap.fromTo(track, { xPercent: 0 }, { xPercent: -50, duration: 45, ease: 'none', repeat: -1 });
  });
  if (loops.length) ScrollTrigger.create({
    trigger: '.marquee', start: 'top bottom', end: 'bottom top',
    onUpdate: function (self) {
      var boost = 1 + Math.min(Math.abs(self.getVelocity()) / 300, 5);
      loops.forEach(function (loop) {
        gsap.to(loop, { timeScale: self.direction * boost, duration: 0.2, overwrite: true,
          onComplete: function () { gsap.to(loop, { timeScale: self.direction, duration: 1.2 }); } });
      });
    }
  });

  /* Experience timeline (markup in Task 6) */
  var progress = document.querySelector('.timeline__progress');
  if (progress) gsap.fromTo(progress, { scaleY: 0 }, { scaleY: 1, ease: 'none',
    scrollTrigger: { trigger: '.timeline', start: 'top 70%', end: 'bottom 60%', scrub: true } });
  each('.timeline__item', function (item) {
    gsap.from(item, { x: 40, autoAlpha: 0, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: item, start: 'top 82%', once: true } });
    ScrollTrigger.create({ trigger: item, start: 'top 60%', end: 'bottom 60%', toggleClass: 'is-active' });
  });

  /* Horizontal "Beyond the code" strip (markup in Task 7) — desktop only */
  mm.add('(min-width: 900px)', function () {
    var section = document.querySelector('.beyond');
    var track = section && section.querySelector('.beyond__track');
    if (!track) return;
    var distance = function () { return Math.max(0, track.scrollWidth - window.innerWidth); };
    gsap.to(track, { x: function () { return -distance(); }, ease: 'none',
      scrollTrigger: { trigger: section, start: 'top top', end: function () { return '+=' + distance(); }, pin: true, scrub: 1, invalidateOnRefresh: true } });
  });
})();
```

- [ ] **Step 5: Run tests** — `npm test` — Expected: all PASS.

- [ ] **Step 6: Browser check** — desktop 1440×900 and mobile 375×812: hero headline rises line-by-line after the loader, arch photo wipes up, marquee drifts and speeds up while scrolling, About stats count up, photos wipe and drift. Console clean.

- [ ] **Step 7: Commit**

```bash
git add index.html css/sections.css js/motion.js tests/site.test.mjs
git commit -m "feat: hero, marquee and about sections with generic motion layer"
```

---

### Task 5: Signature pipeline section + standalone pipeline SVG

**Files:**
- Modify: `index.html` (replace `#pipeline` placeholder; add `<script defer src="js/pipeline.js">` after `motion.js`), `css/sections.css`, `tests/site.test.mjs`
- Create: `js/pipeline.js`, `assets/svg/pipeline.svg`

**Interfaces:**
- Consumes: `window.Portfolio.motion`, GSAP DrawSVG + MotionPath.
- Produces: SVG classes `.pl-doc`, `.pl-page`, `.pl-gate`, `.pl-check-ring`, `.pl-check-mark`, `.pl-wire-in`, `.pl-core`, `.pl-core-ring`, `.pl-packet`, `.pl-wire-out`, `.pl-out`, `.pl-sync`, `.pl-dash`, `.pl-bar`; steps `.pipeline__step[data-step=ingest|split|validate|transform|deliver]`.

- [ ] **Step 1: Add failing tests**

```js
test('pipeline section has an accessible SVG and five ordered steps', () => {
  const section = src.match(/<section id="pipeline"[\s\S]*?<\/section>/)[0];
  assert.match(section, /<svg[^>]*role="img"[^>]*aria-labelledby="pl-title pl-desc"/);
  assert.match(section, /<title id="pl-title">/);
  assert.match(section, /<desc id="pl-desc">/);
  const steps = [...section.matchAll(/data-step="(\w+)"/g)].map((m) => m[1]);
  assert.deepEqual(steps, ['ingest', 'split', 'validate', 'transform', 'deliver']);
  for (const cls of ['pl-doc', 'pl-page', 'pl-check-mark', 'pl-wire-in', 'pl-core-ring', 'pl-packet', 'pl-wire-out', 'pl-out', 'pl-sync', 'pl-bar']) {
    assert.match(section, new RegExp(`class="${cls}\\b`), `missing .${cls}`);
  }
});

test('standalone pipeline.svg animates itself and respects reduced motion', () => {
  const svg = read('assets/svg/pipeline.svg');
  assert.match(svg, /@keyframes/);
  assert.match(svg, /prefers-reduced-motion/);
  assert.match(svg, /EDI ENGINE/);
});
```

- [ ] **Step 2: Run tests** — Expected: FAIL.

- [ ] **Step 3: Pipeline markup** (viewBox `0 0 1100 560`; colours via CSS classes using tokens)

```html
<section id="pipeline" class="section pipeline">
  <div class="pipeline__inner container">
    <div class="pipeline__copy">
      <p class="section-label">02 — How I build</p>
      <h2 class="display pipeline__title" data-anim="lines">From a pile of claim files to <em>clean</em> data.</h2>
      <ol class="pipeline__steps">
        <li class="pipeline__step" data-step="ingest"><span class="mono-label">01</span><h3>Ingest</h3><p>EOBs, 837 claims and self-pay documents arrive in every shape a client can produce.</p></li>
        <li class="pipeline__step" data-step="split"><span class="mono-label">02</span><h3>Split</h3><p>An automated splitting engine breaks huge batches into indexed, traceable pages.</p></li>
        <li class="pipeline__step" data-step="validate"><span class="mono-label">03</span><h3>Validate</h3><p>Index-based schema validation catches bad data before it reaches anyone downstream.</p></li>
        <li class="pipeline__step" data-step="transform"><span class="mono-label">04</span><h3>Transform</h3><p>EDI ENGINE maps every record into a consistent, HIPAA-compliant model.</p></li>
        <li class="pipeline__step" data-step="deliver"><span class="mono-label">05</span><h3>Deliver &amp; sync</h3><p>A customisable output engine writes 835, CSV or TXT — and syncs results live into Client Portal dashboards.</p></li>
      </ol>
    </div>
    <div class="pipeline__stage">
      <svg class="pipeline__svg" viewBox="0 0 1100 560" role="img" aria-labelledby="pl-title pl-desc">
        <title id="pl-title">The EDI ENGINE claims pipeline</title>
        <desc id="pl-desc">EOB, 837 and self-pay files are ingested, split into pages, validated, transformed by EDI ENGINE, output as 835, CSV and TXT, and synced to a Client Portal dashboard.</desc>
        <!-- Docs: three <g class="pl-doc" transform="translate(40,{y})"> at y = 100, 248, 396:
             rect 100×64 rx6 + folded-corner path + 3 text lines (rects) + <text class="pl-label">EOB|837|SELF-PAY</text> -->
        <!-- Pages: six <rect class="pl-page"> 34×44 rx3: two per doc at (200,y-6) and (214,y+14) -->
        <!-- Gate: <line class="pl-gate" x1="330" y1="70" x2="330" y2="490"/> + label "VALIDATE" -->
        <!-- Checks at (330, y+32) for each doc: <circle class="pl-check-ring" r="14"/> <path class="pl-check-mark" d="M-6 0l4 4 8-8"/> inside a translated <g> -->
        <!-- Wires in: <path class="pl-wire-in" d="M344 132 C 430 132, 440 280, 500 280"/>, (…164→280… for y=280 straight), (M344 428 C 430 428, 440 280, 500 280) -->
        <!-- Core: <g class="pl-core"> circle r=72 at (580,280) (fill moss), <circle class="pl-core-ring" r="92" stroke-dasharray="6 10"/>, <text>EDI ENGINE</text> -->
        <!-- Packets: six <circle class="pl-packet" r="6" opacity="0"/> (3 in, 3 out) -->
        <!-- Wires out: <path class="pl-wire-out" d="M660 280 C 710 280, 710 150, 760 150"/>, (M660 280 L760 280), (M660 280 C 710 280, 710 410, 760 410) -->
        <!-- Outputs: three <g class="pl-out"> chips 96×44 rx22 at (760,128),(760,258),(760,388) labelled 835, CSV, TXT -->
        <!-- Sync: <path class="pl-sync" d="M856 280 L 900 280"/> -->
        <!-- Dashboard: <g class="pl-dash"> card rect (900,190) 180×180 rx14, label "Client Portal", four <rect class="pl-bar"> width 26 at x=920,960,1000,1040, baseline y=350, heights 60/100/80/130 -->
      </svg>
    </div>
  </div>
</section>
```
(Comments describe the exact geometry to author; the file contains real elements, no comments.)

- [ ] **Step 4: Pipeline CSS**

`.pipeline__inner{display:grid;grid-template-columns:.8fr 1.2fr;gap:var(--gutter);min-height:100svh;align-items:center}`; `.pipeline__step{opacity:.38;transition:opacity .4s;border-top:1px solid var(--rule);padding:.9rem 0}` `.pipeline__step.is-active{opacity:1}` `.pipeline__step.is-active h3{color:var(--sage)}` `.pipeline__step.is-done{opacity:.7}`; without `.motion-ready` all steps `opacity:1`. SVG classes: docs/pages/chips fill `var(--paper-2)` stroke `var(--ink)` 1.5; wires stroke `var(--sage)` 2 fill none; gate stroke `var(--rule)` dash; check ring fill `var(--sage)`, mark stroke `var(--on-accent)` 2.5; core fill `var(--moss)` text `var(--paper)` Fraunces; core ring stroke `var(--sand)`; packets fill `var(--sand)`; bars fill `var(--sage)`; labels mono 13px fill `var(--ink-soft)`. Mobile (<900px): single column, steps become a horizontal scroll-snap row of compact cards above the SVG.

- [ ] **Step 5: Write `js/pipeline.js`**

```js
/* Signature pipeline: scrubbed + pinned on desktop, looping when visible on mobile. */
(function () {
  'use strict';
  var P = window.Portfolio;
  var section = document.getElementById('pipeline');
  if (!P || !P.motion || !section) return;

  var svg = section.querySelector('.pipeline__svg');
  var steps = section.querySelectorAll('.pipeline__step');
  var order = ['ingest', 'split', 'validate', 'transform', 'deliver'];
  var q = function (sel) { return svg.querySelectorAll(sel); };

  function setActive(label) {
    var idx = order.indexOf(label === 'end' ? 'deliver' : label);
    steps.forEach(function (step, i) {
      step.classList.toggle('is-active', i === idx);
      step.classList.toggle('is-done', i < idx);
    });
  }

  function travel(tl, packets, wires, at) {
    packets.forEach(function (packet, i) {
      tl.fromTo(packet, { autoAlpha: 1 }, {
        motionPath: { path: wires[i], align: wires[i], alignOrigin: [0.5, 0.5] },
        duration: 0.7, ease: 'power1.inOut'
      }, at + i * 0.1).to(packet, { autoAlpha: 0, duration: 0.15 }, '>');
    });
  }

  function build() {
    var packets = q('.pl-packet');
    var tl = gsap.timeline({ defaults: { ease: 'power2.inOut' }, onUpdate: function () { setActive(tl.currentLabel()); } });
    tl.addLabel('ingest')
      .from(q('.pl-doc'), { x: -60, autoAlpha: 0, duration: 0.6, stagger: 0.12, ease: 'power3.out' })
      .addLabel('split')
      .from(q('.pl-page'), { x: -70, autoAlpha: 0, scale: 0.6, transformOrigin: '50% 50%', duration: 0.5, stagger: 0.06 })
      .addLabel('validate')
      .from(q('.pl-gate'), { drawSVG: '50% 50%', duration: 0.5 })
      .from(q('.pl-check-ring'), { scale: 0, transformOrigin: '50% 50%', duration: 0.35, stagger: 0.1, ease: 'back.out(2)' }, '<0.2')
      .from(q('.pl-check-mark'), { drawSVG: 0, duration: 0.35, stagger: 0.1 }, '<0.1')
      .addLabel('transform')
      .from(q('.pl-wire-in'), { drawSVG: 0, duration: 0.6, stagger: 0.08 })
      .from(q('.pl-core'), { scale: 0.4, autoAlpha: 0, transformOrigin: '50% 50%', duration: 0.6, ease: 'back.out(1.6)' }, '<0.2');
    travel(tl, [packets[0], packets[1], packets[2]], q('.pl-wire-in'), tl.duration());
    tl.addLabel('deliver')
      .from(q('.pl-wire-out'), { drawSVG: 0, duration: 0.6, stagger: 0.08 })
      .from(q('.pl-out'), { x: -20, autoAlpha: 0, duration: 0.5, stagger: 0.1 }, '<0.2');
    travel(tl, [packets[3], packets[4], packets[5]], q('.pl-wire-out'), tl.duration() - 0.4);
    tl.from(q('.pl-sync'), { drawSVG: 0, duration: 0.5 })
      .from(q('.pl-dash'), { y: 20, autoAlpha: 0, duration: 0.5 }, '<')
      .from(q('.pl-bar'), { scaleY: 0, transformOrigin: '50% 100%', duration: 0.5, stagger: 0.08 })
      .addLabel('end');
    return tl;
  }

  gsap.to(q('.pl-core-ring'), { rotation: 360, svgOrigin: '580 280', duration: 14, ease: 'none', repeat: -1 });

  gsap.matchMedia().add({ desktop: '(min-width: 900px)', mobile: '(max-width: 899px)' }, function (ctx) {
    var tl = build();
    if (ctx.conditions.desktop) {
      ScrollTrigger.create({ animation: tl, trigger: section, start: 'top top', end: '+=2400', pin: true, scrub: 1 });
    } else {
      tl.to(svg.querySelectorAll('g, path, rect, circle, line'), { autoAlpha: 0, duration: 0.4 }, '+=1.4');
      tl.repeat(-1).pause();
      ScrollTrigger.create({ trigger: svg, start: 'top 85%', end: 'bottom 15%',
        onToggle: function (self) { self.isActive ? tl.play() : tl.pause(); } });
    }
  });
})();
```

- [ ] **Step 6: Write standalone `assets/svg/pipeline.svg`**

Same geometry as the inline SVG with hard-coded light-theme colours and an internal `<style>`: 8s infinite loop; `@keyframes` for doc slide-in (0–10%), pages pop (10–20%), check draw via `stroke-dashoffset` (20–32%), wires draw (32–45%), packets moving using `offset-path: path('…')` + `offset-distance 0%→100%` (45–65%), outputs fade (60–70%), bars `scaleY` (70–85%), everything fades out (92–100%); core ring rotates continuously; `@media (prefers-reduced-motion: reduce){*{animation:none!important}}` and the non-animated state equals the final composed picture.

- [ ] **Step 7: Run tests** — `npm test` — Expected: PASS.

- [ ] **Step 8: Browser check** — desktop: section pins, scrolling scrubs through the 5 steps and the active step highlights in sync; packets follow wires; un-pins cleanly into Experience. Mobile: no pin; timeline loops while visible. Open `assets/svg/pipeline.svg` directly: it loops.

- [ ] **Step 9: Commit**

```bash
git add index.html css/sections.css js/pipeline.js assets/svg/pipeline.svg tests/site.test.mjs
git commit -m "feat: scroll-driven EDI ENGINE pipeline section and standalone animated SVG"
```

---

### Task 6: Experience timeline + Selected Work with animated covers

**Files:**
- Modify: `index.html` (replace `#experience`, `#work` placeholders; add `<script defer src="js/work.js">`), `css/sections.css`, `tests/site.test.mjs`
- Create: `js/work.js`

**Interfaces:**
- Consumes: `PortfolioLib.matchesFilter`, `Portfolio.motion`, `.work-preview`.
- Produces: `.timeline`, `.timeline__progress`, `.timeline__item`; `.work__filters [data-filter]`, `.work__list .work-row[data-category]`, `.work-row__toggle[aria-expanded][aria-controls]`, `.work-row__panel[hidden]`, `.cover.cover--{files|bars|ring|grid|wave|pulse}`, `.work__count[aria-live]`.

- [ ] **Step 1: Add failing tests**

```js
test('content fixes are applied', () => {
  assert.ok(!/827/.test(src), 'found 827');
  assert.ok(!/CCPA/.test(src), 'found CCPA');
  assert.match(src, /CGPA 6\.6/);
  assert.match(src, /Aventus Informatics/);
  assert.match(src, /Mobatia Technology/);
});

test('work rows, filters and accordions are wired consistently', () => {
  const rows = [...src.matchAll(/<li class="work-row"[^>]*data-category="([^"]+)"[\s\S]*?<\/li>/g)];
  assert.equal(rows.length, 6);
  const filters = [...src.matchAll(/data-filter="([^"]+)"/g)].map((m) => m[1]);
  assert.deepEqual(filters, ['all', 'healthcare', 'enterprise', 'commerce']);
  for (const [row, cats] of rows) {
    for (const c of cats.split(' ')) assert.ok(filters.includes(c), `unknown category ${c}`);
    const toggle = row.match(/<button class="work-row__toggle"[^>]*>/)[0];
    assert.equal(attr(toggle, 'aria-expanded'), 'false');
    const panelId = attr(toggle, 'aria-controls');
    assert.match(row, new RegExp(`id="${panelId}"[^>]*hidden`));
    assert.match(row, /class="cover cover--\w+"/);
  }
});
```

- [ ] **Step 2: Run tests** — Expected: FAIL.

- [ ] **Step 3: Experience markup**

```html
<section id="experience" class="section experience">
  <div class="container">
    <p class="section-label">03 — Experience</p>
    <h2 class="display section-title" data-anim="lines">Leading teams that ship <em>dependable</em> software.</h2>
    <ol class="timeline">
      <li class="timeline__rail" aria-hidden="true"><span class="timeline__progress"></span></li>
      <li class="timeline__item">
        <p class="timeline__year display">2022 — <em>Now</em></p>
        <div><h3>Software Engineer (Lead / Technical Head)</h3><p class="mono-label">Aventus Informatics</p>
        <p>Leading architecture, development and enhancement of enterprise healthcare systems — owning product scalability, HIPAA compliance, client-customisation frameworks and technical team leadership.</p></div>
      </li>
      <li class="timeline__item">
        <p class="timeline__year display">2019 — 2022</p>
        <div><h3>Software Engineer</h3><p class="mono-label">Mobatia Technology Pvt Ltd · from Dec 2019</p>
        <p>Managed multiple Laravel and Django projects, built REST APIs for mobile apps, integrated payment gateways, delivered CMS-based enterprise applications and supported live production systems.</p></div>
      </li>
      <li class="timeline__item timeline__item--edu">
        <p class="timeline__year display"><em>Education</em></p>
        <div><h3>BSc Computer Science</h3><p class="mono-label">University of Kerala · CGPA 6.6</p></div>
      </li>
    </ol>
  </div>
</section>
```
(`.timeline__rail` is a decorative `li` with `aria-hidden`; if a validator flags it, move it to a `::before` on `.timeline` plus a sibling `<span class="timeline__progress">` inside a wrapper `div`. Keep the test-visible class names.)

- [ ] **Step 4: Work markup** — one row shown; repeat for all six with the data below.

```html
<section id="work" class="section work">
  <div class="container">
    <p class="section-label">04 — Selected work</p>
    <div class="work__head">
      <h2 class="display section-title" data-anim="lines">Platforms I've <em>architected</em> and shipped.</h2>
      <div class="work__filters" role="group" aria-label="Filter projects">
        <button class="chip" type="button" data-filter="all" aria-pressed="true">All</button>
        <button class="chip" type="button" data-filter="healthcare" aria-pressed="false">Healthcare</button>
        <button class="chip" type="button" data-filter="enterprise" aria-pressed="false">Enterprise</button>
        <button class="chip" type="button" data-filter="commerce" aria-pressed="false">Commerce &amp; social</button>
      </div>
      <p class="work__count mono-label" aria-live="polite">Showing 6 projects</p>
    </div>
    <ol class="work__list">
      <li class="work-row" data-category="healthcare" data-cursor="view" data-cursor-label="Open">
        <button class="work-row__toggle" type="button" aria-expanded="false" aria-controls="work-1">
          <span class="work-row__index mono-label">01</span>
          <span class="work-row__title display">EDI ENGINE <em>— EDI processing platform</em></span>
          <span class="work-row__tags mono-label">Python · Django · Healthcare</span>
          <span class="work-row__icon" aria-hidden="true"></span>
        </button>
        <div class="work-row__panel" id="work-1" hidden>
          <div class="work-row__body">
            <ul>
              <li>Designed the architecture for processing EOB, 837, self-pay and many other EOB file formats.</li>
              <li>Built an automated file-splitting engine with index-based schema validation.</li>
              <li>Created a customisable output engine supporting 835, CSV, TXT and client-specific formats.</li>
            </ul>
            <svg class="cover cover--files" viewBox="0 0 320 240" aria-hidden="true"><!-- 3 stacked file rects that fan out/in on loop (@keyframes fan) + scanning line --></svg>
          </div>
        </div>
      </li>
      <!-- rows 2–6 -->
    </ol>
  </div>
</section>
```

Rows 2–6 (same structure; ids `work-2`…`work-6`):

| # | category | title / *em* | tags | bullets | cover |
|---|---|---|---|---|---|
| 02 | `healthcare` | Client Portal *— client operations system* | Data sync · Dashboards | Real-time data sync from EDI ENGINE to Client Portal. / Client dashboards for processed records, output management and file tracking. / Client-level access control and operational reporting. | `cover--bars` (bars rising/falling, staggered) |
| 03 | `enterprise` | Ticketing *& analytics* | SLA tracking · BI | Client and provider ticketing with SLA tracking and status workflows. / Report-generation engine and dynamic analytics dashboards. / Role-based access, resolution tracking and audit logs. | `cover--ring` (SLA ring stroke filling 0→80%, ticking hand) |
| 04 | `enterprise` | School management *systems* | Laravel · Payments | BISAD — school management system for BIS Abu Dhabi. / NAIS Dubai, Al Khor and Manila — school CMS and payment portal. | `cover--grid` (4×3 tiles lighting in sequence) |
| 05 | `commerce` | VLURB *& e-commerce* | Social · E-commerce | VLURB — a voice-based social media platform. / Tasveek — e-commerce platform. / Desert Motors — auto-parts e-commerce. | `cover--wave` (9 bars of a sound wave oscillating) |
| 06 | `healthcare enterprise` | Clinic *& project management* | Hospital · Task tracking | RAM Clinics — hospital management system. / Task tracking with module-based project segmentation and team performance. | `cover--pulse` (ECG polyline drawn by `stroke-dashoffset` loop) |

- [ ] **Step 5: CSS for timeline, work rows and covers**

Timeline: `.timeline{position:relative;list-style:none;padding:0;display:grid;gap:4rem;margin-top:4rem}`; rail `position:absolute;left:0;top:0;bottom:0;width:1px;background:var(--rule)`; `.timeline__progress{position:absolute;inset:0;background:var(--sage);transform-origin:top}`; items `padding-left:3rem;display:grid;grid-template-columns:minmax(14rem,.6fr) 1fr;gap:var(--gutter)` with a `::before` 11px dot on the rail that fills sage when `.is-active`; year `font-size:var(--step-3)`. Mobile: single column.

Work: `.work__head` grid (title left, filters + count right/bottom); `.chip` pill mono, `[aria-pressed="true"]` filled ink; rows `border-top:1px solid var(--rule)`; toggle is a full-width grid `3rem 1fr auto 2rem` reset button styles, title `font-size:var(--step-2)`, hover: title shifts right 1rem and `em` turns sage; `.work-row__icon` plus sign rotating 45° when `aria-expanded="true"`; `.work-row__body` grid `1.2fr .8fr`, cover `border-radius:var(--radius);background:var(--paper-2)`; `.work-row[hidden]{display:none}`. Cover keyframes per type (`fan`, `bars`, `ring`, `tiles`, `wave`, `ecg`) with `animation-play-state:paused` by default and `running` inside `.work-row.is-open` and `.work-preview` — so off-screen covers don't burn CPU. Mobile: body single column.

- [ ] **Step 6: Write `js/work.js`**

```js
/* Selected work: filters, accordion rows and the cursor-following cover preview. */
(function () {
  'use strict';
  var P = window.Portfolio, lib = window.PortfolioLib;
  var list = document.querySelector('.work__list');
  if (!list) return;
  var motion = P && P.motion;
  var rows = Array.prototype.slice.call(list.querySelectorAll('.work-row'));
  var chips = document.querySelectorAll('.work__filters [data-filter]');
  var count = document.querySelector('.work__count');
  var refresh = function () { if (motion) ScrollTrigger.refresh(); };

  chips.forEach(function (chip) {
    chip.addEventListener('click', function () {
      var filter = chip.dataset.filter, shown = 0;
      chips.forEach(function (c) { c.setAttribute('aria-pressed', String(c === chip)); });
      rows.forEach(function (row) {
        var show = lib.matchesFilter(row.dataset.category, filter);
        if (show) shown++;
        if (show === !row.hidden) return;
        if (!motion) { row.hidden = !show; return; }
        if (show) {
          row.hidden = false;
          gsap.fromTo(row, { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 0.6, ease: 'power3.out' });
        } else {
          gsap.to(row, { autoAlpha: 0, y: -12, duration: 0.25, onComplete: function () { row.hidden = true; refresh(); } });
        }
      });
      count.textContent = 'Showing ' + shown + (shown === 1 ? ' project' : ' projects');
      refresh();
    });
  });

  rows.forEach(function (row) {
    var btn = row.querySelector('.work-row__toggle');
    var panel = document.getElementById(btn.getAttribute('aria-controls'));
    btn.addEventListener('click', function () {
      var open = btn.getAttribute('aria-expanded') !== 'true';
      btn.setAttribute('aria-expanded', String(open));
      row.classList.toggle('is-open', open);
      if (!motion) { panel.hidden = !open; return; }
      if (open) {
        panel.hidden = false;
        gsap.fromTo(panel, { height: 0, autoAlpha: 0 }, { height: 'auto', autoAlpha: 1, duration: 0.7, ease: 'expo.out', onComplete: refresh });
      } else {
        gsap.to(panel, { height: 0, autoAlpha: 0, duration: 0.4, ease: 'power2.inOut',
          onComplete: function () { panel.hidden = true; gsap.set(panel, { clearProps: 'height,opacity,visibility' }); refresh(); } });
      }
    });
  });

  var preview = document.querySelector('.work-preview');
  if (!motion || !preview || !window.matchMedia('(min-width: 900px) and (hover: hover) and (pointer: fine)').matches) return;
  gsap.set(preview, { xPercent: -50, yPercent: -120, scale: 0.85 });
  var xTo = gsap.quickTo(preview, 'x', { duration: 0.6, ease: 'power3' });
  var yTo = gsap.quickTo(preview, 'y', { duration: 0.6, ease: 'power3' });
  list.addEventListener('pointermove', function (e) { xTo(e.clientX); yTo(e.clientY); });
  rows.forEach(function (row) {
    row.addEventListener('pointerenter', function () {
      if (row.classList.contains('is-open')) return;
      var cover = row.querySelector('.cover');
      if (cover) preview.replaceChildren(cover.cloneNode(true));
      gsap.to(preview, { autoAlpha: 1, scale: 1, rotation: gsap.utils.random(-4, 4), duration: 0.4, ease: 'power3.out' });
    });
    row.addEventListener('pointerleave', function () { gsap.to(preview, { autoAlpha: 0, scale: 0.85, duration: 0.3 }); });
  });
})();
```

- [ ] **Step 7: Run tests** — `npm test` — Expected: PASS.

- [ ] **Step 8: Browser check** — timeline line grows with scroll and dots activate; filters hide/show rows with animation and update the count; rows expand/collapse with keyboard (Tab + Enter) and mouse; desktop hover shows a tilted animated cover following the cursor; mobile shows the cover inside the expanded panel.

- [ ] **Step 9: Commit**

```bash
git add index.html css/sections.css js/work.js tests/site.test.mjs
git commit -m "feat: experience timeline and filterable work list with animated SVG covers"
```

---

### Task 7: Toolkit, Beyond the code, Contact, Footer + cursor and contact scripts

**Files:**
- Modify: `index.html` (replace `#toolkit`, `#beyond`, `#contact` placeholders; add footer; add `<script defer>` for `js/cursor.js`, `js/contact.js`), `css/sections.css`, `tests/site.test.mjs`
- Create: `js/cursor.js`, `js/contact.js`

**Interfaces:**
- Consumes: `PortfolioLib.{buildMailto, validateContact, formatClock}`, `Portfolio.motion`, `.cursor`, `.toast`, `[data-magnetic]`, `[data-cursor]`.
- Produces: `.contact-form[novalidate]` with fields `name,email,subject,message`, error spans `#{field}-error`, `.contact-form__status`; `[data-copy]`, `[data-clock]`, `[data-year]`.

- [ ] **Step 1: Add failing tests**

```js
test('toolkit has six groups', () => {
  const section = src.match(/<section id="toolkit"[\s\S]*?<\/section>/)[0];
  assert.equal((section.match(/class="tool-card\b/g) || []).length, 6);
});

test('contact form is labelled, novalidate and wired to error messages', () => {
  const form = src.match(/<form class="contact-form"[\s\S]*?<\/form>/)[0];
  assert.match(form, /novalidate/);
  for (const f of ['name', 'email', 'subject', 'message']) {
    assert.match(form, new RegExp(`<label[^>]*for="${f}"`));
    assert.match(form, new RegExp(`id="${f}"[^>]*name="${f}"`));
  }
  for (const f of ['name', 'email', 'message']) {
    assert.match(form, new RegExp(`aria-describedby="${f}-error"`));
    assert.match(form, new RegExp(`id="${f}-error"`));
  }
});

test('contact details, clock, year and copy button exist', () => {
  assert.match(src, /href="mailto:sachusudeve8690@gmail\.com"/);
  assert.match(src, /href="tel:\+918157864536"/);
  assert.match(src, /data-copy="sachusudeve8690@gmail\.com"/);
  assert.match(src, /data-clock/);
  assert.match(src, /data-year/);
  assert.match(src, /<section id="beyond"/);
});
```

- [ ] **Step 2: Run tests** — Expected: FAIL.

- [ ] **Step 3: Toolkit markup** — `<section id="toolkit" class="section toolkit">` with label `05 — Toolkit`, heading "The stack I *reach for*." (`data-anim="lines"`), `.bento` grid of six `<article class="tool-card" data-anim="fade">` each: small looping inline SVG icon (`aria-hidden`), `<h3>`, `<ul class="tags">`:
  1. Languages — Python, PHP, JavaScript — icon: `</>` brackets with blinking caret.
  2. Frameworks — Django, FastAPI, Laravel, ReactJS, Kohana — icon: three stacked layers sliding.
  3. Databases — PostgreSQL, MySQL, SQLite — icon: cylinder stack with pulsing top.
  4. Healthcare & EDI (wide card) — HIPAA compliance, 835 payments, 837 claims, EOB processing, Patient pay, Correspondence — icon: shield with drawn check.
  5. Tools & platforms — Git, REST APIs, CMS development, Payment gateways — icon: branching git graph with travelling dot.
  6. Architecture (wide card) — File pipelines, Data synchronisation, Reporting engines, Client customisation — icon: three nodes linked with flowing dashes.
  Below: "Key strengths" as `<ul class="strengths">` hairline list: Healthcare domain expertise · HIPAA-compliant architecture · EDI & 835 processing · Large-file processing · Client customisation frameworks · Technical leadership · Performance optimisation · Scalable API development.

- [ ] **Step 4: Beyond markup** — `<section id="beyond" class="beyond">` containing `.beyond__track` (flex row): intro card (`06 — Off the clock`, heading "Good coffee, *slow* walks, sharp suits.", short line "Away from the terminal I'm usually somewhere with good light and better coffee."), figure `street-coffee` (alt "Sachu S holding a coffee outside the Velvet & Bloom café, a blue sports car behind him"), figure `street-walk` (alt "Sachu S walking past a café terrace under a frangipani tree"), and a closing card "Let's talk →" linking `#contact`. Figures use `<picture>` + lazy images + `data-anim="wipe"`.

- [ ] **Step 5: Contact + footer markup**

```html
<section id="contact" class="section contact">
  <div class="container contact__grid">
    <div class="contact__intro">
      <p class="section-label">07 — Contact</p>
      <h2 class="display contact__title" data-anim="lines">Let's build something <em>reliable</em>.</h2>
      <p>I'm open to new opportunities and interesting problems. Whether it's a role, a project or just hello — my inbox is open.</p>
      <ul class="contact__list">
        <li><span class="mono-label">Email</span><a href="mailto:sachusudeve8690@gmail.com">sachusudeve8690@gmail.com</a>
            <button class="copy-btn" type="button" data-copy="sachusudeve8690@gmail.com" aria-label="Copy email address">Copy</button></li>
        <li><span class="mono-label">Phone</span><a href="tel:+918157864536">+91 81578 64536</a></li>
        <li><span class="mono-label">Location</span><span>Kerala, India · <span data-clock>--:--:--</span> IST</span></li>
        <li><span class="mono-label">Elsewhere</span><a href="https://linkedin.com/in/sachu-s-705813179" target="_blank" rel="noopener" data-magnetic="0.4">LinkedIn ↗</a> <a href="https://github.com/sachusudevan" target="_blank" rel="noopener" data-magnetic="0.4">GitHub ↗</a></li>
      </ul>
      <figure class="contact__photo" data-anim="wipe"><picture>…portrait-wall (alt "Black-and-white portrait of Sachu S leaning against a wall, eyes closed")…</picture></figure>
    </div>
    <form class="contact-form" novalidate>
      <div class="field"><label for="name">Your name</label><input id="name" name="name" type="text" autocomplete="name" required aria-describedby="name-error" /><span class="field__error" id="name-error"></span></div>
      <div class="field"><label for="email">Email</label><input id="email" name="email" type="email" autocomplete="email" required aria-describedby="email-error" /><span class="field__error" id="email-error"></span></div>
      <div class="field"><label for="subject">Subject <span class="optional">(optional)</span></label><input id="subject" name="subject" type="text" /></div>
      <div class="field"><label for="message">Message</label><textarea id="message" name="message" rows="5" required aria-describedby="message-error"></textarea><span class="field__error" id="message-error"></span></div>
      <button class="btn btn--solid btn--lg" type="submit" data-magnetic="0.3">Send message <span class="arrow" aria-hidden="true">→</span></button>
      <p class="contact-form__status mono-label" role="status"></p>
    </form>
  </div>
</section>
</main>
<footer class="footer">
  <div class="container footer__grid">
    <a class="footer__logo" href="#hero" aria-label="Back to top"><!-- monogram svg --></a>
    <nav aria-label="Footer"><a href="#work">Work</a><a href="#about">About</a><a href="#pipeline">Pipeline</a><a href="#contact">Contact</a></nav>
    <p class="mono-label">Kerala · <span data-clock>--:--:--</span> IST</p>
    <p class="mono-label">© <span data-year>2026</span> Sachu S</p>
    <a class="footer__top mono-label" href="#hero">Back to top ↑</a>
  </div>
  <p class="footer__wordmark display" aria-hidden="true">Sachu <em>S.</em></p>
</footer>
```

- [ ] **Step 6: CSS** — `.bento{display:grid;grid-template-columns:repeat(3,1fr);gap:1rem}` (wide cards `grid-column:span 2`; mobile 1 column), `.tool-card{background:var(--paper-2);border:1px solid var(--rule);border-radius:var(--radius);padding:1.75rem;transition:translate .4s var(--ease-out)}` hover `translate:0 -4px`; icon keyframes (`blink`, `slide`, `pulse`, `draw`, `travel`, `flow`). `.beyond{overflow:hidden;padding-block:var(--space-section)}` `.beyond__track{display:flex;gap:2rem;padding-inline:var(--gutter);width:max-content}` figures `height:70vh;aspect-ratio:2/3`; mobile: `.beyond__track{width:auto;overflow-x:auto;scroll-snap-type:x mandatory}` children `scroll-snap-align:center;height:60svh`. Contact grid two columns; `.field` floating label style (label above input, input bottom-border only, focus underline grows sage via `background-size`), `.field__error{color:#B4443A}` (dark: `#E08A80`), `[aria-invalid="true"]` red underline. Footer: wordmark `font-size:clamp(4rem,18vw,16rem)` clipped at bottom.

- [ ] **Step 7: Write `js/cursor.js`**

```js
/* Custom cursor + magnetic elements — fine pointers with motion only. */
(function () {
  'use strict';
  var P = window.Portfolio;
  var cursor = document.querySelector('.cursor');
  if (!P || !P.motion || !cursor || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  document.documentElement.classList.add('has-cursor');
  var dot = cursor.querySelector('.cursor__dot'), ring = cursor.querySelector('.cursor__ring'), label = cursor.querySelector('.cursor__label');
  gsap.set([dot, ring], { xPercent: -50, yPercent: -50 });
  var dx = gsap.quickTo(dot, 'x', { duration: 0.1, ease: 'power3' }), dy = gsap.quickTo(dot, 'y', { duration: 0.1, ease: 'power3' });
  var rx = gsap.quickTo(ring, 'x', { duration: 0.45, ease: 'power3' }), ry = gsap.quickTo(ring, 'y', { duration: 0.45, ease: 'power3' });
  window.addEventListener('pointermove', function (e) {
    dx(e.clientX); dy(e.clientY); rx(e.clientX); ry(e.clientY);
    cursor.classList.add('is-visible');
  }, { passive: true });
  document.documentElement.addEventListener('mouseleave', function () { cursor.classList.remove('is-visible'); });
  document.addEventListener('pointerover', function (e) {
    var view = e.target.closest('[data-cursor="view"]');
    var link = e.target.closest('a, button, label, input, textarea');
    // Work rows are buttons inside a [data-cursor="view"] row — the row's "view" state wins there.
    var inView = !!view && (!link || view.contains(link));
    cursor.classList.toggle('is-view', inView);
    cursor.classList.toggle('is-link', !!link && !inView);
    label.textContent = inView ? (view.dataset.cursorLabel || 'View') : '';
  });

  document.querySelectorAll('[data-magnetic]').forEach(function (el) {
    var strength = parseFloat(el.dataset.magnetic) || 0.3;
    var xTo = gsap.quickTo(el, 'x', { duration: 0.8, ease: 'elastic.out(1, 0.4)' });
    var yTo = gsap.quickTo(el, 'y', { duration: 0.8, ease: 'elastic.out(1, 0.4)' });
    el.addEventListener('pointermove', function (e) {
      var r = el.getBoundingClientRect();
      xTo((e.clientX - (r.left + r.width / 2)) * strength);
      yTo((e.clientY - (r.top + r.height / 2)) * strength);
    });
    el.addEventListener('pointerleave', function () { xTo(0); yTo(0); });
  });
})();
```
- [ ] **Step 8: Write `js/contact.js`**

```js
/* Contact form (mailto), copy-to-clipboard, toast, live IST clock and footer year. */
(function () {
  'use strict';
  var lib = window.PortfolioLib;
  var EMAIL = 'sachusudeve8690@gmail.com';
  var toastEl = document.querySelector('.toast'), toastTimer;

  function toast(message) {
    if (!toastEl) return;
    toastEl.textContent = message;
    toastEl.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('is-visible'); }, 2400);
  }

  var form = document.querySelector('.contact-form');
  if (form) form.addEventListener('submit', function (e) {
    e.preventDefault();
    var get = function (n) { return form.elements.namedItem(n).value; };
    var fields = { name: get('name'), email: get('email'), subject: get('subject'), message: get('message') };
    var result = lib.validateContact(fields);
    ['name', 'email', 'message'].forEach(function (key) {
      var msg = result.errors[key] || '';
      document.getElementById(key + '-error').textContent = msg;
      form.elements.namedItem(key).setAttribute('aria-invalid', String(!!msg));
    });
    var status = form.querySelector('.contact-form__status');
    if (!result.valid) {
      status.textContent = '';
      form.elements.namedItem(Object.keys(result.errors)[0]).focus();
      return;
    }
    status.textContent = 'Opening your email app…';
    window.location.href = lib.buildMailto(EMAIL, fields);
  });

  document.querySelectorAll('[data-copy]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var text = btn.dataset.copy;
      function fallback() {
        var ta = document.createElement('textarea');
        ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
        document.body.appendChild(ta); ta.select();
        var ok = false;
        try { ok = document.execCommand('copy'); } catch (err) { ok = false; }
        ta.remove();
        toast(ok ? 'Email copied to clipboard' : 'Copy failed — ' + text);
      }
      if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(function () { toast('Email copied to clipboard'); }, fallback);
      else fallback();
    });
  });

  var clocks = document.querySelectorAll('[data-clock]');
  function tick() {
    var time = lib.formatClock(new Date(), 'Asia/Kolkata');
    clocks.forEach(function (c) { c.textContent = time; });
  }
  if (clocks.length) { tick(); setInterval(tick, 1000); }
  document.querySelectorAll('[data-year]').forEach(function (el) { el.textContent = String(new Date().getFullYear()); });
})();
```

- [ ] **Step 9: Run tests** — `npm test` — Expected: PASS.

- [ ] **Step 10: Browser check** — bento icons loop; Beyond strip pins and scrolls horizontally on desktop, swipes on mobile; contact: submit empty → errors announced and first invalid field focused; valid → status text and `mailto:` navigation (verify the URL via `javascript_tool` by temporarily overriding `location` is not possible → instead check `PortfolioLib.buildMailto` output in console); copy button shows toast; clock ticks; cursor ring grows on links and shows "Open" on work rows; magnetic buttons pull.

- [ ] **Step 11: Commit**

```bash
git add index.html css/sections.css js/cursor.js js/contact.js tests/site.test.mjs
git commit -m "feat: toolkit, beyond-the-code strip, contact and footer with cursor + contact scripts"
```

---

### Task 8: Generated GIF and OG image

**Files:**
- Create: `tools/pipeline-frames.mjs`, `tools/render-gif.mjs`, `tools/render-og.mjs`, `tests/media.test.mjs`
- Create (generated): `assets/pipeline.gif`, `assets/og-image.png`

**Interfaces:**
- Produces: `pipeline-frames.mjs` exports `WIDTH=720, HEIGHT=360, FRAMES=72, FPS=18, renderFrame(i: number) → string (SVG)`; `render-gif.mjs` exports `rasterize(svg) → {data: Uint8Array, width, height}`, `buildGif(frameCount = FRAMES) → Uint8Array`; `render-og.mjs` exports `buildOgSvg(photoDataUri: string) → string`, `renderOg() → Buffer`.

- [ ] **Step 1: Write failing tests**

`tests/media.test.mjs`:
```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { root, exists, html } from './helpers.mjs';
import { renderFrame, FRAMES, WIDTH, HEIGHT } from '../tools/pipeline-frames.mjs';
import { buildGif } from '../tools/render-gif.mjs';
import { renderOg } from '../tools/render-og.mjs';

test('pipeline frames are valid SVG, animated, and loop seamlessly', () => {
  const first = renderFrame(0);
  assert.match(first, /^<svg[^>]+viewBox="0 0 720 360"/);
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
```

- [ ] **Step 2: Run tests** — Expected: FAIL (`Cannot find module '../tools/pipeline-frames.mjs'`).

- [ ] **Step 3: Write `tools/pipeline-frames.mjs`**

```js
// Deterministic frame geometry for the README GIF: frame i of FRAMES, loops seamlessly.
export const WIDTH = 720;
export const HEIGHT = 360;
export const FRAMES = 72;
export const FPS = 18;

const C = { paper: '#F4F1EA', paper2: '#EAE5DA', ink: '#141614', soft: '#5B605A', sage: '#6E8F72', moss: '#2F4A3A', sand: '#C8A97E' };
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

export function renderFrame(i) {
  const phase = (((i % FRAMES) + FRAMES) % FRAMES) / FRAMES; // 0..1
  const parts = [];
  parts.push(`<rect width="${WIDTH}" height="${HEIGHT}" fill="${C.paper}"/>`);
  parts.push(`<text x="24" y="34" font-family="Consolas, monospace" font-size="12" letter-spacing="2" fill="${C.soft}">EDI ENGINE · CLAIMS PIPELINE</text>`);

  DOCS.forEach((d, k) => {
    parts.push(`<g transform="translate(40 ${d.y})"><rect width="110" height="44" rx="6" fill="${C.paper2}" stroke="${C.ink}" stroke-width="1.5"/>`
      + `<text x="14" y="28" font-family="Consolas, monospace" font-size="13" fill="${C.ink}">${d.label}</text></g>`);
    const w = inWire(d.y);
    parts.push(`<path d="${pathD(w)}" fill="none" stroke="${C.sage}" stroke-width="2" opacity=".55"/>`);
    const t = ease((phase * 2 + k / 3) % 1);
    const [x, y] = point(w, t);
    parts.push(`<circle cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" r="5" fill="${C.sand}"/>`);
    const checkOn = Math.sin((phase + k / 3) * Math.PI * 2) > -0.2;
    parts.push(`<g transform="translate(200 ${d.y + 22})" opacity="${checkOn ? 1 : 0.25}"><circle r="10" fill="${C.sage}"/><path d="M-4.5 0l3 3 6-6" fill="none" stroke="${C.paper}" stroke-width="2.2" stroke-linecap="round"/></g>`);
  });

  const angle = (phase * 360).toFixed(2);
  const pulse = (1 + 0.04 * Math.sin(phase * Math.PI * 4)).toFixed(4);
  parts.push(`<g transform="translate(${CORE.x} ${CORE.y})"><circle r="74" fill="none" stroke="${C.sand}" stroke-width="2" stroke-dasharray="6 10" transform="rotate(${angle})"/>`
    + `<circle r="58" fill="${C.moss}" transform="scale(${pulse})"/><text y="7" text-anchor="middle" font-family="Georgia, serif" font-size="20" fill="${C.paper}">EDI ENGINE</text></g>`);

  OUTS.forEach((o, k) => {
    const w = outWire(o.y);
    parts.push(`<path d="${pathD(w)}" fill="none" stroke="${C.sage}" stroke-width="2" opacity=".55"/>`);
    const t = ease((phase * 2 + 0.5 + k / 3) % 1);
    const [x, y] = point(w, t);
    parts.push(`<circle cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" r="5" fill="${C.sand}"/>`);
    parts.push(`<g transform="translate(520 ${o.y})"><rect width="76" height="36" rx="18" fill="${C.paper2}" stroke="${C.ink}" stroke-width="1.5"/>`
      + `<text x="38" y="23" text-anchor="middle" font-family="Consolas, monospace" font-size="13" fill="${C.ink}">${o.label}</text></g>`);
  });

  parts.push(`<path d="M596 178 L620 178" stroke="${C.sage}" stroke-width="2"/>`);
  parts.push(`<rect x="620" y="110" width="80" height="136" rx="10" fill="${C.paper2}" stroke="${C.ink}" stroke-width="1.5"/>`);
  parts.push(`<text x="660" y="132" text-anchor="middle" font-family="Consolas, monospace" font-size="10" fill="${C.soft}">PORTAL</text>`);
  [0, 1, 2, 3].forEach((b) => {
    const h = 30 + 40 * (0.5 + 0.5 * Math.sin((phase + b / 4) * Math.PI * 2));
    parts.push(`<rect x="${632 + b * 16}" y="${(232 - h).toFixed(2)}" width="10" height="${h.toFixed(2)}" rx="2" fill="${C.sage}"/>`);
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${WIDTH} ${HEIGHT}" width="${WIDTH}" height="${HEIGHT}">${parts.join('')}</svg>`;
}
```

- [ ] **Step 4: Write `tools/render-gif.mjs`**

```js
// Renders tools/pipeline-frames.mjs into assets/pipeline.gif (resvg → gifenc).
import { Resvg } from '@resvg/resvg-js';
import gifenc from 'gifenc';
import { writeFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { renderFrame, WIDTH, FRAMES, FPS } from './pipeline-frames.mjs';

const { GIFEncoder, quantize, applyPalette } = gifenc;

export function rasterize(svg) {
  const img = new Resvg(svg, { fitTo: { mode: 'width', value: WIDTH }, font: { loadSystemFonts: true, defaultFontFamily: 'Georgia' } }).render();
  return { data: new Uint8Array(img.pixels), width: img.width, height: img.height };
}

export function buildGif(frameCount = FRAMES) {
  const frames = Array.from({ length: frameCount }, (_, i) => rasterize(renderFrame(i)));
  const sample = new Uint8Array(frames.reduce((n, f) => n + f.data.length, 0));
  frames.reduce((offset, f) => (sample.set(f.data, offset), offset + f.data.length), 0);
  const palette = quantize(sample, 64);
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
```
(If `import gifenc from 'gifenc'` fails because the package exposes named ESM exports, switch to `import { GIFEncoder, quantize, applyPalette } from 'gifenc';`.)

- [ ] **Step 5: Write `tools/render-og.mjs`**

```js
// Renders the 1200×630 social preview image (assets/og-image.png).
import { Resvg } from '@resvg/resvg-js';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

export function buildOgSvg(photoDataUri) {
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="1200" height="630" viewBox="0 0 1200 630">
  <defs><clipPath id="arch"><path d="M800 630 V250 a170 170 0 0 1 340 0 V630 Z"/></clipPath></defs>
  <rect width="1200" height="630" fill="#F4F1EA"/>
  <rect x="800" y="80" width="340" height="550" fill="#2F4A3A" clip-path="url(#arch)"/>
  <image href="${photoDataUri}" x="770" y="70" width="400" height="597" preserveAspectRatio="xMidYMin slice" clip-path="url(#arch)"/>
  <text x="80" y="120" font-family="Consolas, monospace" font-size="20" letter-spacing="4" fill="#5B605A">TECHNICAL LEAD · SOFTWARE ENGINEER</text>
  <text x="76" y="270" font-family="Georgia, serif" font-size="128" fill="#141614">Sachu S</text>
  <text x="80" y="360" font-family="Georgia, serif" font-style="italic" font-size="40" fill="#2F4A3A">Engineering calm systems</text>
  <text x="80" y="410" font-family="Georgia, serif" font-style="italic" font-size="40" fill="#2F4A3A">for messy healthcare data.</text>
  <line x1="80" y1="470" x2="700" y2="470" stroke="#141614" stroke-opacity=".15"/>
  <text x="80" y="520" font-family="Consolas, monospace" font-size="20" fill="#6E8F72">Python · Django · FastAPI · EDI 835/837 · HIPAA</text>
</svg>`;
}

export function renderOg() {
  const photo = readFileSync(join(ROOT, 'assets', 'img', 'portrait-sage.jpg')).toString('base64');
  const svg = buildOgSvg(`data:image/jpeg;base64,${photo}`);
  return new Resvg(svg, { fitTo: { mode: 'width', value: 1200 }, font: { loadSystemFonts: true, defaultFontFamily: 'Georgia' } }).render().asPng();
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const out = join(ROOT, 'assets', 'og-image.png');
  writeFileSync(out, renderOg());
  console.log(`wrote ${out}`);
}
```

- [ ] **Step 6: Generate and test**

Run: `npm run gif && npm run og && npm test` — Expected: both files written (GIF ≲ 1.5MB), all tests PASS. Open `assets/pipeline.gif` and `assets/og-image.png` with the Read tool to eyeball them; fix geometry overlaps if any.

- [ ] **Step 7: Commit**

```bash
git add tools/pipeline-frames.mjs tools/render-gif.mjs tools/render-og.mjs tests/media.test.mjs assets/pipeline.gif assets/og-image.png
git commit -m "feat: generate animated pipeline GIF and OG share image"
```

---

### Task 9: README, preview config, cleanup and full verification

**Files:**
- Create: `.claude/launch.json`
- Modify: `README.md`, `tests/site.test.mjs`
- Delete: `images/` (whole folder — originals live in git history)

- [ ] **Step 1: Add failing test**

```js
test('old image folder is gone and README showcases generated media', () => {
  assert.ok(!exists('images'));
  const readme = read('README.md');
  assert.match(readme, /assets\/pipeline\.gif/);
  assert.match(readme, /assets\/svg\/monogram\.svg/);
  assert.match(readme, /npm test/);
});
```
Run `npm test` — Expected: FAIL.

- [ ] **Step 2: Cleanup, launch config, README**

```bash
git rm -r -q images
```

`.claude/launch.json`:
```json
{
  "version": "0.0.1",
  "configurations": [
    { "name": "portfolio", "runtimeExecutable": "node", "runtimeArgs": ["node_modules/http-server/bin/http-server", ".", "-p", "5173", "-c-1", "--silent"], "port": 5173 }
  ]
}
```

`README.md` sections: title with `assets/svg/monogram.svg` (96px), one-line pitch, `![EDI ENGINE pipeline](assets/pipeline.gif)`, Live link, "Design" (Editorial × Engineering, palette, type), "Motion" (bullet list of animations), "Structure" (file map), "Develop" (`npm install`, `npm run serve`, `npm test`, `npm run images|gif|og`), "Deploy" (GitHub Pages from `main`, root), "Accessibility" (reduced motion, `?motion=off`, keyboard), author links.

Run: `npm test` — Expected: all PASS.

- [ ] **Step 3: Full browser verification** (preview server `portfolio`)

For each state, screenshot hero, pipeline, work, contact and record findings:
1. Desktop 1440×900 light → dark toggle (circular wipe), full scroll top→bottom: no layout jumps, pins release cleanly, console has no errors (`read_console_messages onlyErrors`).
2. Mobile 375×812 and 360px width: `document.documentElement.scrollWidth <= innerWidth` via `javascript_tool`; menu opens/closes, Esc closes, focus returns to burger; Beyond swipes; pipeline loops.
3. `?motion=off`: no loader, all content visible, no pin spacers (`document.querySelectorAll('.pin-spacer').length === 0`).
4. Scripts blocked: temporarily serve a copy with the CDN `<script>` tags removed (or block `cdn.jsdelivr.net` via a modified copy in the scratchpad) → content visible after ≤3.5s, no stuck loader.
5. Keyboard pass: skip link → main; Tab through nav, filters, rows (Enter toggles), form; visible focus rings throughout.

Fix anything found (each fix: smallest change + re-run `npm test` + re-check the failing state).

- [ ] **Step 4: Commit**

```bash
git add -A .claude/launch.json README.md tests/site.test.mjs
git commit -m "docs: README with generated media; chore: preview config and legacy image cleanup"
```

- [ ] **Step 5: Final review** — run the whole-branch review per the chosen execution skill; then use superpowers:finishing-a-development-branch.
