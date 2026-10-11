# Portfolio Redesign ("Neo Terminal") Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the template-style portfolio with a black-and-lime "Neo Terminal" static site for Sachu S — fully animated, with a signature scroll-driven EDI pipeline SVG + synced terminal log, animated SVG covers, a generated GIF and an OG image.

**Architecture:** Plain HTML + three CSS files + classic deferred scripts, deployed as-is to GitHub Pages. Pure logic lives in a UMD file (`js/lib.js`) that Node tests import; DOM/motion scripts read `window.Portfolio` (set up by `main.js`). Motion is progressive enhancement: hidden start states exist only under `html.motion-ready`, which is removed whenever GSAP is missing or motion is reduced.

**Tech Stack:** HTML5, CSS (custom properties, grid, `clamp()`), GSAP 3.13.0 (+ ScrollTrigger, SplitText, ScrambleTextPlugin, DrawSVGPlugin, MotionPathPlugin), Lenis 1.3.23, Google Fonts (Syne, Geist, JetBrains Mono). Dev only: Node 20 `node:test`, sharp 0.34.5, @resvg/resvg-js 2.6.2, gifenc 1.0.3, http-server 14.1.1.

**Spec:** `docs/superpowers/specs/2026-10-11-portfolio-redesign-design.md` (revision 2 — Neo Terminal)

## Global Constraints

- No build step; `index.html` must work from GitHub Pages **and** `file://` → no `type="module"` scripts.
- CDN URLs pinned exactly: `https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/{gsap,ScrollTrigger,SplitText,ScrambleTextPlugin,DrawSVGPlugin,MotionPathPlugin}.min.js`, `https://cdn.jsdelivr.net/npm/lenis@1.3.23/dist/lenis.min.js`.
- Fonts URL: `https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=JetBrains+Mono:wght@400;500;700&family=Geist:wght@400;500&display=swap`
- Single dark theme, no toggle. Colour tokens: bg `#0B0B0B`, bg-2 `#121212`, bg-3 `#1A1A1A`, line `#2A2A2A`, line-strong `#3A3A3A`, text `#EDEDED`, muted `#8A8A8A`, lime `#C6F432`, lime-dim `#9DC21F`, on-lime `#0B0B0B`, danger `#FF5F56`, warn `#FFBD2E`.
- `border-radius: 0` everywhere; display type Syne uppercase; UI/labels JetBrains Mono; body Geist.
- Scrambled/typed text: the final text is always present in the HTML; JS only animates it (screen readers read the real text).
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
| `css/tokens.css` | design tokens (single dark theme), font stacks, type scale |
| `css/base.css` | reset, typography, grid bg, scanlines, progress, cursor, boot loader, nav, menu, buttons, terminal window chrome, toast |
| `css/sections.css` | hero → footer section layouts + responsive rules + SVG animation keyframes |
| `js/lib.js` | pure helpers (UMD): `buildMailto`, `validateContact`, `formatClock`, `matchesFilter`, `createSafeStorage` |
| `js/main.js` | boot: motion detection, plugin registration, Lenis, nav (+ scramble hover), menu, progress, anchors, boot loader → `window.Portfolio` |
| `js/motion.js` | generic reveals: hero intro + typed prompt, split/scramble headings, fades, wipes, parallax, counters, tape marquee, git graph, horizontal strip |
| `js/pipeline.js` | pipeline timeline + synced terminal log (pinned scrub on desktop, loop on mobile) |
| `js/work.js` | project flag filters, accordion rows, cursor-following preview |
| `js/cursor.js` | block cursor + magnetic elements |
| `js/contact.js` | terminal form validation + mailto, copy email, toast, IST clocks, year |
| `assets/img/*.{webp,jpg}` | optimised photos |
| `assets/favicon.svg`, `assets/svg/logo.svg`, `assets/svg/pipeline.svg` | SVG assets |
| `assets/pipeline.gif`, `assets/og-image.png` | generated media |
| `tools/optimize-images.mjs`, `tools/pipeline-frames.mjs`, `tools/render-gif.mjs`, `tools/render-og.mjs` | asset generators |
| `tests/helpers.mjs`, `tests/lib.test.mjs`, `tests/assets.test.mjs`, `tests/site.test.mjs`, `tests/media.test.mjs` | node:test suites |

### Shared DOM contract (used across tasks)

- `html` classes: `motion-ready`, `show-intro`, `menu-open`, `has-cursor`.
- `window.Portfolio = { motion: boolean, lenis: Lenis|null, storage: SafeStorage, introDone: Promise<void> }`.
- `data-anim` values: `hero-title`, `hero-fade`, `hero-media`, `lines`, `fade`, `stagger`, `wipe`. `data-scramble` = scramble the element's text on hover (nav links, labels). `data-type` = type the element's text when revealed (prompt lines). `data-speed="<number>"` = parallax. `data-count="<n>" data-suffix="+"` = counter. `data-magnetic="<strength>"`. `data-cursor="view" data-cursor-label="[open]"`. `data-copy="<text>"`. `data-clock` (HH:MM:SS) and `data-clock="short"` (HH:MM). `data-year`.
- Terminal window chrome (reused everywhere): `<div class="term"><div class="term__bar"><span class="term__dots" aria-hidden="true"><i></i><i></i><i></i></span><span class="term__title">README.md</span></div><div class="term__body">…</div></div>`.
- Section ids in order: `hero`, `about`, `pipeline`, `experience`, `work`, `toolkit`, `beyond`, `contact`; `<main id="main" tabindex="-1">`. (Ids are kept stable; visible labels are `about`, `pipeline`, `experience`, `projects`, `stack`, `offline`, `contact`.)

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

### Task 3: Document shell — head, tokens, base styles, nav, menu, boot loader, boot script

**Files:**
- Replace: `index.html` (new document; sections added in later tasks)
- Create: `css/tokens.css`, `css/base.css`, `css/sections.css` (header comment only for now), `js/main.js`, `assets/favicon.svg`, `assets/svg/logo.svg`, `tests/site.test.mjs`
- Delete: `css/style.css`, `js/script.js`

**Interfaces:**
- Consumes: `PortfolioLib.createSafeStorage`.
- Produces: `window.Portfolio` (see contract); `html.motion-ready/show-intro/menu-open`; nav markup `.nav`, `.nav__links a[data-scramble]`, `.nav__status [data-clock="short"]`, `.nav__burger[aria-controls=menu]`, `#menu.menu[inert]`; `.progress__bar`; `.loader` with `.loader__half--top/--bottom`, `.loader__term`, `.loader__line`, `.loader__bar`, `.loader__pct`; `.cursor > .cursor__block > .cursor__label`; `.toast[role=status]`; `.work-preview`; utility classes `.display`, `.hl`, `.mono`, `.muted`, `.lime`, `.section-label`, `.caret`, `.btn`, `.btn--lime`, `.term*`, `.photo`, `.photo__cap`.

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
  for (const re of [/name="description"/, /property="og:title"/, /property="og:description"/, /property="og:image"/, /name="twitter:card"/, /name="theme-color" content="#0B0B0B"/]) {
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
  assert.match(src, /gsap@3\.13\.0\/dist\/ScrambleTextPlugin\.min\.js/);
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

test('design tokens match the Neo Terminal palette and stay sharp', () => {
  const tokens = read('css/tokens.css');
  for (const hex of ['#0B0B0B', '#121212', '#EDEDED', '#8A8A8A', '#C6F432']) assert.ok(tokens.includes(hex), `token ${hex}`);
  assert.ok(!/data-theme/.test(src + cssText()), 'no theme switching');
  assert.ok(!/border-radius:\s*(?!0[;\s}]|50%)[\d.]+(px|rem|em)/.test(cssText()), 'rounded corners found');
});

test('legacy assets are no longer referenced', () => {
  assert.ok(!/css\/style\.css|js\/script\.js|images\//.test(src));
  assert.ok(!exists('css/style.css') && !exists('js/script.js'));
});

test('nav, menu and loader contract exists', () => {
  assert.match(src, /class="nav__burger"[^>]*aria-controls="menu"[^>]*aria-expanded="false"/);
  assert.match(src, /<div id="menu" class="menu"[^>]*inert/);
  assert.match(src, /class="loader"/);
  assert.equal((src.match(/class="loader__line"/g) || []).length, 3);
  assert.match(src, /class="skip-link" href="#main"/);
  assert.match(read('assets/svg/logo.svg'), /@keyframes/);
});
```
(The border-radius rule allows `0` and `50%` — the latter only for the round terminal dots and status dot.)

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test` — Expected: site tests FAIL (old `index.html`, no tokens file, etc.).

- [ ] **Step 3: Create the logo and favicon SVGs**

`assets/svg/logo.svg` — self-animating wordmark for the README:
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 96" width="360" height="96" role="img" aria-labelledby="t">
  <title id="t">~/sachu — Sachu S</title>
  <style>
    .bg { fill: #0B0B0B; }
    .txt { font: 700 40px "JetBrains Mono", Consolas, monospace; fill: #EDEDED; }
    .tilde { fill: #C6F432; }
    .caret { fill: #C6F432; animation: blink 1s steps(1) infinite; }
    .brk { fill: none; stroke: #C6F432; stroke-width: 3; stroke-dasharray: 60; stroke-dashoffset: 60; animation: draw 3.2s cubic-bezier(.7,0,.3,1) infinite; }
    @keyframes blink { 50% { opacity: 0; } }
    @keyframes draw { 0% { stroke-dashoffset: 60; } 30%, 80% { stroke-dashoffset: 0; } 100% { stroke-dashoffset: -60; } }
    @media (prefers-reduced-motion: reduce) { .caret, .brk { animation: none; stroke-dashoffset: 0; } }
  </style>
  <rect class="bg" width="360" height="96"/>
  <path class="brk" d="M30 18 H14 V78 H30"/>
  <path class="brk" d="M330 18 H346 V78 H330"/>
  <text class="txt" x="40" y="62"><tspan class="tilde">~/</tspan>sachu</text>
  <rect class="caret" x="282" y="30" width="22" height="38"/>
</svg>
```

`assets/favicon.svg`:
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" fill="#C6F432"/>
  <path d="M14 20l14 12-14 12" fill="none" stroke="#0B0B0B" stroke-width="6" stroke-linecap="square"/>
  <rect x="32" y="40" width="18" height="6" fill="#0B0B0B"/>
</svg>
```

- [ ] **Step 4: Write `css/tokens.css`**

```css
/* Design tokens — Neo Terminal (single dark theme). */
:root {
  --bg: #0B0B0B; --bg-2: #121212; --bg-3: #1A1A1A;
  --line: #2A2A2A; --line-strong: #3A3A3A; --grid: rgb(42 42 42 / .35);
  --text: #EDEDED; --muted: #8A8A8A;
  --lime: #C6F432; --lime-dim: #9DC21F; --on-lime: #0B0B0B;
  --danger: #FF5F56; --warn: #FFBD2E;
  --font-display: "Syne", "Arial Black", Impact, sans-serif;
  --font-body: "Geist", system-ui, -apple-system, "Segoe UI", sans-serif;
  --font-mono: "JetBrains Mono", ui-monospace, Consolas, monospace;
  --step--1: clamp(.78rem, .76rem + .1vw, .85rem);
  --step-0: clamp(1rem, .96rem + .2vw, 1.0625rem);
  --step-1: clamp(1.2rem, 1.05rem + .6vw, 1.5rem);
  --step-2: clamp(1.6rem, 1.2rem + 1.6vw, 2.5rem);
  --step-3: clamp(2.2rem, 1.4rem + 3.6vw, 4.8rem);
  --step-4: clamp(2.8rem, 1.2rem + 7vw, 8.5rem);
  --space-section: clamp(6rem, 4rem + 8vw, 10rem);
  --gutter: clamp(1rem, .5rem + 2.5vw, 3rem);
  --max: 1360px;
  --ease-out: cubic-bezier(.16, 1, .3, 1);
  --ease-in-out: cubic-bezier(.7, 0, .3, 1);
  color-scheme: dark;
}
```

- [ ] **Step 5: Write `css/base.css`**

Must contain complete rules for:
- Reset (`*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}`), `html{-webkit-text-size-adjust:100%}`, `body{background:var(--bg);color:var(--text);font:400 var(--step-0)/1.65 var(--font-body);overflow-x:clip}`, `img,svg{display:block;max-width:100%}`, `a{color:inherit;text-decoration:none}`, `button{font:inherit;color:inherit;background:none;border:0;cursor:pointer}`, `ul,ol{list-style:none}`, `::selection{background:var(--lime);color:var(--on-lime)}`.
- Fixed grid backdrop: `body::before{content:"";position:fixed;inset:0;z-index:-1;pointer-events:none;background-image:linear-gradient(var(--grid) 1px,transparent 1px),linear-gradient(90deg,var(--grid) 1px,transparent 1px);background-size:64px 64px;mask-image:radial-gradient(ellipse at 50% 30%,#000 30%,transparent 80%)}`.
- Scanlines: `body::after{content:"";position:fixed;inset:0;z-index:90;pointer-events:none;background:repeating-linear-gradient(to bottom,rgb(255 255 255 / .03) 0 1px,transparent 1px 3px)}` and `.motion-ready body::after{animation:scan 10s linear infinite}` with `@keyframes scan{to{background-position:0 300px}}`.
- Lenis: `html.lenis,html.lenis body{height:auto}` `.lenis.lenis-smooth{scroll-behavior:auto!important}` `.lenis.lenis-stopped{overflow:hidden}`.
- Type utilities: `.display{font-family:var(--font-display);font-weight:800;text-transform:uppercase;line-height:.9;letter-spacing:-.01em}` `.hl{color:var(--lime)}` `.mono{font-family:var(--font-mono)}` `.muted{color:var(--muted)}` `.lime{color:var(--lime)}` `.section-label{font:500 var(--step--1)/1 var(--font-mono);color:var(--muted);margin-bottom:1.5rem}` `.section-label span{color:var(--lime)}` `.section-title{font-size:var(--step-3);max-width:16ch;margin-bottom:3rem}`.
- Layout: `.container{width:min(100% - 2*var(--gutter),var(--max));margin-inline:auto}` `.section{padding-block:var(--space-section)}` `.visually-hidden{…standard…}`.
- `.skip-link{position:fixed;left:1rem;top:-4rem;z-index:120;background:var(--lime);color:var(--on-lime);padding:.6rem 1rem;font-family:var(--font-mono)}` `.skip-link:focus{top:1rem}` `:focus-visible{outline:2px solid var(--lime);outline-offset:3px}`.
- `.caret{display:inline-block;width:.55em;height:1em;background:var(--lime);vertical-align:-.12em;margin-left:.12em;animation:blink 1s steps(1) infinite}` `@keyframes blink{50%{opacity:0}}`.
- Progress: `.progress{position:fixed;inset:0 0 auto;height:2px;z-index:80}` `.progress__bar{height:100%;background:var(--lime);transform-origin:0 50%;transform:scaleX(0)}`.
- Buttons: `.btn{display:inline-flex;align-items:center;gap:.6rem;padding:.95rem 1.4rem;border:1px solid var(--text);font:500 13px/1 var(--font-mono);text-transform:uppercase;letter-spacing:.08em;transition:translate .25s var(--ease-out),box-shadow .25s var(--ease-out),background-color .2s}` `.btn:hover{translate:-3px -3px;box-shadow:6px 6px 0 var(--lime)}` `.btn--lime{background:var(--lime);color:var(--on-lime);border-color:var(--lime)}` `.btn--lime:hover{box-shadow:6px 6px 0 var(--text)}` (use the `translate` property — GSAP owns `transform` for magnetic movement).
- Terminal chrome: `.term{border:1px solid var(--line);background:var(--bg-2)}` `.term__bar{display:flex;align-items:center;gap:.8rem;padding:.6rem .9rem;border-bottom:1px solid var(--line);font:500 12px/1 var(--font-mono);color:var(--muted)}` `.term__dots{display:flex;gap:6px}` `.term__dots i{width:10px;height:10px;border-radius:50%;background:var(--line-strong)}` `.term__dots i:nth-child(1){background:var(--danger)}` `:nth-child(2){background:var(--warn)}` `:nth-child(3){background:var(--lime)}` `.term__body{padding:1.25rem 1.4rem}`.
- Photos: `.photo{position:relative;overflow:hidden;background:var(--bg-3)}` `.photo img{width:100%;height:100%;object-fit:cover;filter:grayscale(1) contrast(1.05);transition:filter .6s var(--ease-out)}` `.photo:hover img,.photo.is-color img{filter:none}` corner brackets: `.photo::before,.photo::after{content:"";position:absolute;width:22px;height:22px;z-index:2;border:2px solid var(--lime)}` `.photo::before{top:10px;left:10px;border-right:0;border-bottom:0}` `.photo::after{bottom:10px;right:10px;border-left:0;border-top:0}` `.photo__cap{position:absolute;left:12px;bottom:12px;z-index:2;font:500 11px var(--font-mono);background:var(--bg);padding:.25rem .5rem}`.
- Nav: `.nav{position:fixed;inset:0 0 auto;z-index:70;transition:transform .5s var(--ease-out),background-color .3s,border-color .3s;border-bottom:1px solid transparent}` `.nav.is-scrolled{background:rgb(11 11 11 / .86);backdrop-filter:blur(10px);border-bottom-color:var(--line)}` `.nav.is-hidden{transform:translateY(-100%)}` `.nav__inner{display:flex;align-items:center;gap:2rem;height:68px}` `.nav__logo{font:700 15px var(--font-mono)}` `.nav__links{display:flex;gap:1.4rem;margin-left:auto;font:500 13px var(--font-mono);color:var(--muted)}` `.nav__links a:hover,.nav__links a:focus-visible{color:var(--lime)}` `.nav__status{font:500 12px var(--font-mono);color:var(--muted)}` `.nav__status .dot{display:inline-block;width:7px;height:7px;border-radius:50%;background:var(--lime);margin-right:.5rem;animation:pulse 1.6s infinite}` `@keyframes pulse{0%{box-shadow:0 0 0 0 rgb(198 244 50 / .6)}100%{box-shadow:0 0 0 10px rgb(198 244 50 / 0)}}` `.nav__burger{display:none;margin-left:auto;font:500 13px var(--font-mono);color:var(--lime)}`; `@media (max-width:899px){.nav__links,.nav__status,.nav__cta{display:none}.nav__burger{display:block}}`.
- Menu: `.menu{position:fixed;inset:0;z-index:65;background:var(--bg);display:grid;align-content:center;padding:var(--gutter);opacity:0;visibility:hidden;transition:opacity .35s,visibility .35s}` `.menu-open .menu{opacity:1;visibility:visible}` `.menu__list li{overflow:hidden;border-bottom:1px solid var(--line)}` `.menu__link{display:flex;align-items:baseline;gap:1rem;font:800 clamp(2.4rem,12vw,5rem)/1.05 var(--font-display);text-transform:uppercase}` `.menu__link span{font:500 13px var(--font-mono);color:var(--lime)}` `.menu__link:hover{color:var(--lime)}`; `@media (min-width:900px){.menu{display:none}}`.
- Boot loader: `.loader{display:none}` `.show-intro .loader{display:block;position:fixed;inset:0;z-index:100}` `.loader__half{position:absolute;left:0;right:0;height:50.5%;background:var(--bg)}` `.loader__half--top{top:0;border-bottom:1px solid var(--line)}` `.loader__half--bottom{bottom:0}` `.loader__term{position:absolute;left:50%;top:50%;translate:-50% -50%;width:min(92vw,560px);font:500 14px/1.9 var(--font-mono);color:var(--muted)}` `.loader__line{white-space:pre}` `.loader__progress{color:var(--lime);margin-top:.6rem}`.
- Cursor: `.cursor{display:none}` `.has-cursor .cursor{display:block;position:fixed;top:0;left:0;z-index:95;pointer-events:none}` `.cursor__block{display:grid;place-items:center;width:12px;height:20px;background:var(--lime);transition:width .25s var(--ease-out),height .25s var(--ease-out),background-color .2s,outline-color .2s;outline:1px solid transparent}` `.cursor.is-idle .cursor__block{animation:blink 1s steps(1) infinite}` `.cursor.is-link .cursor__block{width:38px;height:38px;background:transparent;outline-color:var(--lime)}` `.cursor.is-view .cursor__block{width:auto;height:auto;padding:.35rem .6rem;background:var(--lime)}` `.cursor__label{font:700 11px var(--font-mono);color:var(--on-lime);white-space:nowrap}` `.cursor:not(.is-view) .cursor__label{display:none}` `.has-cursor,.has-cursor a,.has-cursor button{cursor:none}` `.has-cursor input,.has-cursor textarea{cursor:text}`.
- Toast: `.toast{position:fixed;left:var(--gutter);bottom:var(--gutter);z-index:110;background:var(--bg-2);border:1px solid var(--lime);color:var(--lime);font:500 13px var(--font-mono);padding:.75rem 1rem;translate:0 calc(100% + 3rem);transition:translate .5s var(--ease-out)}` `.toast.is-visible{translate:0 0}`.
- Work preview shell: `.work-preview{position:fixed;top:0;left:0;width:300px;z-index:60;pointer-events:none;opacity:0;visibility:hidden;background:var(--bg-2);border:1px solid var(--lime)}`.
- Reduced motion: `@media (prefers-reduced-motion: reduce){*,*::before,*::after{animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important;scroll-behavior:auto!important}}`.

`css/sections.css`: `/* Section layouts: hero → footer. */` (filled from Task 4).

- [ ] **Step 6: Write the new `index.html` shell**

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Sachu S — Technical Lead & Software Engineer</title>
  <meta name="description" content="Sachu S is a Technical Lead and Software Engineer in Kerala, India, building HIPAA-compliant healthcare data platforms with Python, Django and FastAPI." />
  <meta name="theme-color" content="#0B0B0B" />
  <meta property="og:type" content="website" />
  <meta property="og:title" content="Sachu S — Technical Lead & Software Engineer" />
  <meta property="og:description" content="Code that ships. Teams that scale. Python · Django · FastAPI · EDI 835/837 · HIPAA." />
  <meta property="og:image" content="https://sachusudevan.github.io/portfolio/assets/og-image.png" />
  <meta property="og:url" content="https://sachusudevan.github.io/portfolio/" />
  <meta name="twitter:card" content="summary_large_image" />
  <link rel="icon" href="assets/favicon.svg" type="image/svg+xml" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin />
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=JetBrains+Mono:wght@400;500;700&family=Geist:wght@400;500&display=swap" />
  <link rel="stylesheet" href="css/tokens.css" />
  <link rel="stylesheet" href="css/base.css" />
  <link rel="stylesheet" href="css/sections.css" />
  <script>
    /* Boot before first paint: motion flags. Falls back to static if scripts never boot. */
    (function (d, w) {
      var r = d.documentElement, seen = false;
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
    <div class="loader__half loader__half--top"></div>
    <div class="loader__half loader__half--bottom"></div>
    <div class="loader__term">
      <p class="loader__line">&gt; booting sachu.dev …</p>
      <p class="loader__line">&gt; loading python django fastapi … ok</p>
      <p class="loader__line">&gt; mounting healthcare/edi … ok</p>
      <p class="loader__progress"><span class="loader__bar">[░░░░░░░░░░░░░░░░]</span> <span class="loader__pct">000%</span></p>
    </div>
  </div>
  <div class="cursor" aria-hidden="true"><div class="cursor__block"><span class="cursor__label"></span></div></div>
  <header class="nav">
    <div class="nav__inner container">
      <a class="nav__logo" href="#hero" aria-label="Sachu S — back to top"><span class="lime">~/</span>sachu<span class="caret" aria-hidden="true"></span></a>
      <nav class="nav__links" aria-label="Primary">
        <a href="#work" data-scramble>[work]</a>
        <a href="#about" data-scramble>[about]</a>
        <a href="#pipeline" data-scramble>[pipeline]</a>
        <a href="#contact" data-scramble>[contact]</a>
      </nav>
      <p class="nav__status"><span class="dot" aria-hidden="true"></span>online · IST <span data-clock="short">--:--</span></p>
      <a class="btn btn--lime nav__cta" href="#contact" data-magnetic="0.25">Hire me</a>
      <button class="nav__burger" type="button" aria-controls="menu" aria-expanded="false" aria-label="Open menu">[menu]</button>
    </div>
  </header>
  <div id="menu" class="menu" inert>
    <nav aria-label="Mobile">
      <ul class="menu__list">
        <li><a class="menu__link" href="#work"><span>01</span>Work</a></li>
        <li><a class="menu__link" href="#about"><span>02</span>About</a></li>
        <li><a class="menu__link" href="#pipeline"><span>03</span>Pipeline</a></li>
        <li><a class="menu__link" href="#experience"><span>04</span>Experience</a></li>
        <li><a class="menu__link" href="#contact"><span>05</span>Contact</a></li>
      </ul>
    </nav>
  </div>
  <main id="main" tabindex="-1">
    <section id="hero" class="hero"></section>
    <section id="about"></section>
    <section id="pipeline"></section>
    <section id="experience"></section>
    <section id="work"></section>
    <section id="toolkit"></section>
    <section id="beyond"></section>
    <section id="contact"></section>
  </main>
  <div class="work-preview" aria-hidden="true"></div>
  <div class="toast" role="status" aria-live="polite"></div>

  <script defer src="https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/gsap.min.js"></script>
  <script defer src="https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/ScrollTrigger.min.js"></script>
  <script defer src="https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/SplitText.min.js"></script>
  <script defer src="https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/ScrambleTextPlugin.min.js"></script>
  <script defer src="https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/DrawSVGPlugin.min.js"></script>
  <script defer src="https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/MotionPathPlugin.min.js"></script>
  <script defer src="https://cdn.jsdelivr.net/npm/lenis@1.3.23/dist/lenis.min.js"></script>
  <script defer src="js/lib.js"></script>
  <script defer src="js/main.js"></script>
</body>
</html>
```
(The empty `<section id="…">` elements are placeholders so in-page anchors resolve; Tasks 4–7 replace each one.)

- [ ] **Step 7: Write `js/main.js`**

```js
/* Boot: motion detection, smooth scroll, nav, menu, progress, anchors and the boot loader. */
(function () {
  'use strict';
  var root = document.documentElement;
  var lib = window.PortfolioLib;
  var gsap = window.gsap;
  var hasMotionLibs = !!(gsap && window.ScrollTrigger && window.SplitText && window.ScrambleTextPlugin && window.DrawSVGPlugin && window.MotionPathPlugin);
  var motion = root.classList.contains('motion-ready') && hasMotionLibs;

  if (motion) {
    window.__portfolioBooted = true;
    gsap.registerPlugin(ScrollTrigger, SplitText, ScrambleTextPlugin, DrawSVGPlugin, MotionPathPlugin);
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
    burger.textContent = open ? '[close]' : '[menu]';
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

  /* Boot loader — always resolves within 3s */
  Portfolio.introDone = new Promise(function (resolve) {
    if (!motion || !root.classList.contains('show-intro')) return resolve();
    var loader = document.querySelector('.loader');
    var lines = loader.querySelectorAll('.loader__line');
    var barText = loader.querySelector('.loader__bar');
    var pct = loader.querySelector('.loader__pct');
    var CELLS = 16;
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
    lines.forEach(function (line, i) {
      var text = line.textContent;
      line.textContent = '';
      tl.to(line, { duration: 0.4, scrambleText: { text: text, chars: 'lowerCase', speed: 0.8 } }, i * 0.3);
    });
    tl.to(n, { v: 100, duration: 1.3, ease: 'power2.inOut', onUpdate: function () {
        var filled = Math.round((n.v / 100) * CELLS);
        barText.textContent = '[' + '█'.repeat(filled) + '░'.repeat(CELLS - filled) + ']';
        pct.textContent = String(Math.round(n.v)).padStart(3, '0') + '%';
      } }, 0)
      .to('.loader__term', { autoAlpha: 0, duration: 0.2 }, '+=0.1')
      .to('.loader__half--top', { yPercent: -100, duration: 0.8, ease: 'expo.inOut' })
      .to('.loader__half--bottom', { yPercent: 100, duration: 0.8, ease: 'expo.inOut' }, '<');
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
Expected: all site, lib and asset tests PASS.

- [ ] **Step 9: Browser smoke check**

Run `npx http-server . -p 5173 -c-1` (Task 9 adds `.claude/launch.json`). Load `http://localhost:5173/`. Expected: boot lines decode, ASCII bar fills, screen splits; reload → no loader (session); nav links scramble only after Task 4 (motion.js) — for now they are static; menu opens at 375px; console has no errors.

- [ ] **Step 10: Commit**

```bash
git add -A index.html css js/main.js assets/favicon.svg assets/svg/logo.svg tests/site.test.mjs
git commit -m "feat: neo terminal document shell with tokens, nav, menu, boot loader and boot script"
```

---

### Task 4: Hero, tape marquee and About + generic motion layer

**Files:**
- Modify: `index.html` (replace `#hero` and `#about` placeholders, add `.marquee` between them; add `<script defer src="js/motion.js">` after `main.js`), `css/sections.css`, `tests/site.test.mjs`
- Create: `js/motion.js`

**Interfaces:**
- Consumes: `window.Portfolio.{motion, introDone}`, `data-anim` / `data-scramble` / `data-type` contract.
- Produces: `Portfolio.typeText(el: Element, opts?: {delay?: number}) → gsap.core.Tween` (types `el.dataset.text || el.textContent`); generic handlers for `data-anim="lines|fade|stagger|wipe"`, `[data-scramble]`, `[data-speed]`, `[data-count]`, `.marquee__row/.marquee__track`, `.timeline__progress/.timeline__item`, `.beyond/.beyond__track`, mobile `.photo` colour toggle.

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

test('hero uses the noir portrait and about carries the three stats', () => {
  assert.match(src, /<section id="hero"[\s\S]*?portrait-noir\.jpg[\s\S]*?<\/section>/);
  assert.match(src, /data-count="5" data-suffix="\+"/);
  assert.match(src, /data-count="20" data-suffix="\+"/);
  assert.match(src, /data-count="100" data-suffix="%"/);
});
```

Run: `npm test` — Expected: these FAIL.

- [ ] **Step 2: Hero + tape marquee + About markup**

```html
<section id="hero" class="hero">
  <div class="hero__grid container">
    <div class="hero__copy">
      <p class="hero__prompt mono" data-anim="hero-fade"><span class="lime">$</span> whoami</p>
      <p class="hero__whoami mono" data-anim="hero-fade" data-type>sachu s — technical lead @ aventus informatics</p>
      <h1 class="hero__title display" data-anim="hero-title">Code that <span class="hl">ships.</span> Teams that scale.</h1>
      <p class="hero__lede" data-anim="hero-fade">I design and lead HIPAA-compliant platforms that turn EOBs, 835/837 files and patient-pay documents into clean, reliable data — with Python, Django and FastAPI.</p>
      <div class="hero__actions" data-anim="hero-fade">
        <a class="btn btn--lime" href="#work" data-magnetic="0.3">View work <span aria-hidden="true">→</span></a>
        <a class="btn" href="https://github.com/sachusudevan" target="_blank" rel="noopener" data-magnetic="0.3">GitHub ↗</a>
      </div>
    </div>
    <figure class="hero__media photo" data-anim="hero-media">
      <picture>
        <source srcset="assets/img/portrait-noir.webp" type="image/webp" />
        <img src="assets/img/portrait-noir.jpg" alt="Black-and-white studio portrait of Sachu S seated in a dark suit" width="{W}" height="{H}" fetchpriority="high" data-speed="-0.6" />
      </picture>
      <figcaption class="photo__cap">img_000.jpg</figcaption>
    </figure>
  </div>
  <ul class="hero__chips container mono" data-anim="hero-fade">
    <li><b class="lime">5+</b> yrs shipping</li>
    <li><b class="lime">20+</b> projects</li>
    <li><b class="lime">edi</b> 835 / 837</li>
    <li><b class="lime">hipaa</b> compliant</li>
  </ul>
  <a class="hero__scroll mono" href="#about" data-anim="hero-fade">scroll <span class="caret" aria-hidden="true"></span></a>
</section>

<div class="marquee" aria-hidden="true">
  <div class="marquee__row marquee__row--lime"><div class="marquee__track">
    <!-- the group below appears twice inside the track -->
    <span>Python</span><span>✳</span><span>Django</span><span>✳</span><span>FastAPI</span><span>✳</span><span>PostgreSQL</span><span>✳</span><span>REST APIs</span><span>✳</span><span>Laravel</span><span>✳</span>
  </div></div>
  <div class="marquee__row marquee__row--dark"><div class="marquee__track">
    <!-- twice -->
    <span>HIPAA</span><span>/</span><span>EDI 835</span><span>/</span><span>EDI 837</span><span>/</span><span>EOB</span><span>/</span><span>File pipelines</span><span>/</span><span>Team lead</span><span>/</span>
  </div></div>
</div>

<section id="about" class="section about">
  <div class="container">
    <p class="section-label"><span>01</span> // about</p>
    <h2 class="display section-title" data-anim="lines">I like the <span class="hl">unglamorous</span> problems.</h2>
    <div class="about__grid">
      <div class="term about__readme" data-anim="fade">
        <div class="term__bar"><span class="term__dots" aria-hidden="true"><i></i><i></i><i></i></span><span class="term__title">README.md</span></div>
        <div class="term__body md">
          <p class="md__h"># hi, i'm sachu</p>
          <p>Software engineer and technical lead with 5+ years of designing, building and leading scalable web applications and enterprise healthcare solutions — the kind of systems where the 835 file at 2 a.m. has to be right.</p>
          <p class="md__h">## what i do</p>
          <ul class="md__list" data-anim="stagger">
            <li>HIPAA-compliant healthcare data processing — EDI 835/837, EOB and patient-pay workflows</li>
            <li>Architectures that process very large files without breaking a sweat</li>
            <li>Product architecture, mentoring engineers and client-customised enterprise delivery</li>
          </ul>
          <p class="md__h">## stats</p>
          <dl class="stats">
            <div><dt>years experience</dt><dd class="display" data-count="5" data-suffix="+">5+</dd></div>
            <div><dt>projects delivered</dt><dd class="display" data-count="20" data-suffix="+">20+</dd></div>
            <div><dt>client satisfaction</dt><dd class="display" data-count="100" data-suffix="%">100%</dd></div>
          </dl>
        </div>
      </div>
      <div class="about__media">
        <figure class="photo about__photo--main" data-anim="wipe" data-speed="0.5"><picture><source srcset="assets/img/portrait-sand.webp" type="image/webp" /><img src="assets/img/portrait-sand.jpg" alt="Sachu S in a beige double-breasted suit against a concrete wall" width="{W}" height="{H}" loading="lazy" /></picture><figcaption class="photo__cap">img_001.jpg</figcaption></figure>
        <figure class="photo about__photo--inset" data-anim="wipe" data-speed="1.4"><picture><source srcset="assets/img/portrait-sage.webp" type="image/webp" /><img src="assets/img/portrait-sage.jpg" alt="Sachu S in a sage suit, seated on a stool against a green backdrop" width="{W}" height="{H}" loading="lazy" /></picture><figcaption class="photo__cap">img_002.jpg</figcaption></figure>
      </div>
    </div>
  </div>
</section>
```
(`{W}`/`{H}` = dimensions printed in Task 1 Step 4.)

- [ ] **Step 3: Section CSS** (append to `css/sections.css`)

Complete rules for:
- `.hero{min-height:100svh;padding-top:7rem;display:grid;align-content:center;gap:2.5rem}`; `.hero__grid{display:grid;grid-template-columns:minmax(0,1.35fr) minmax(0,.65fr);gap:var(--gutter);align-items:end}`; `.hero__prompt,.hero__whoami{font-size:var(--step--1);color:var(--muted)}` `.hero__whoami{color:var(--text);margin-bottom:1.5rem}`; `.hero__title{font-size:var(--step-4)}`; `.hero__lede{max-width:52ch;color:var(--muted);margin:1.75rem 0 2rem}`; `.hero__actions{display:flex;flex-wrap:wrap;gap:1rem}`; `.hero__media{aspect-ratio:3/4;max-height:72svh}` `.hero__media img{height:115%}`; hover glitch: `.hero__media:hover img{animation:glitch .6s steps(2) 2}` with `@keyframes glitch` shifting `translate` ±4px and `filter:drop-shadow(-3px 0 0 #ff2bd6) drop-shadow(3px 0 0 var(--lime))` mid-frames; `.hero__chips{display:flex;flex-wrap:wrap;gap:.75rem;font-size:var(--step--1)}` each `li{border:1px solid var(--line);padding:.55rem .85rem}`; `.hero__scroll{justify-self:start;font-size:var(--step--1);color:var(--muted)}`.
- Motion start states (scoped): `.motion-ready [data-anim="hero-title"]{visibility:hidden}` `.motion-ready [data-anim="hero-fade"]{opacity:0;transform:translateY(24px)}` `.motion-ready [data-anim="hero-media"]{clip-path:inset(100% 0 0 0)}`.
- Tape: `.marquee{position:relative;padding-block:4rem;overflow:hidden}` `.marquee__row{width:110%;margin-left:-5%;border-block:1px solid var(--lime)}` `.marquee__row--lime{background:var(--lime);color:var(--on-lime);rotate:-2deg}` `.marquee__row--dark{background:var(--bg);color:transparent;-webkit-text-stroke:1px var(--lime);rotate:1.5deg;margin-top:-1.2rem}` `.marquee__track{display:flex;width:max-content;gap:1.5rem;padding-block:.9rem;font:800 var(--step-2)/1 var(--font-display);text-transform:uppercase;white-space:nowrap}`.
- About: `.about__grid{display:grid;grid-template-columns:minmax(0,1.1fr) minmax(0,.9fr);gap:calc(var(--gutter)*2);align-items:start}`; `.md{font-size:var(--step-0)}` `.md__h{font:700 var(--step--1)/1 var(--font-mono);color:var(--lime);margin:1.5rem 0 .75rem}` `.md__h:first-child{margin-top:0}` `.md__list li{padding-left:1.4rem;position:relative;margin-bottom:.5rem}` `.md__list li::before{content:"-";position:absolute;left:0;color:var(--lime);font-family:var(--font-mono)}`; `.stats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));border:1px solid var(--line)}` `.stats>div{padding:1rem;border-right:1px solid var(--line)}` `.stats>div:last-child{border-right:0}` `.stats dt{font:500 11px var(--font-mono);color:var(--muted)}` `.stats dd{font-size:var(--step-3);color:var(--lime)}`; `.about__media{position:relative;padding-bottom:20%}` `.about__photo--main{width:78%;aspect-ratio:2/3}` `.about__photo--inset{position:absolute;right:0;bottom:0;width:46%;aspect-ratio:2/3;border:6px solid var(--bg)}`.
- `@media (max-width:899px)`: hero grid single column with media first (`order:-1`, `max-height:60svh`); about grid single column; stats keep 3 columns with `dd{font-size:var(--step-2)}`.

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

  /* Typing helper shared with pipeline.js — the final text stays in data-text */
  P.typeText = function (el, opts) {
    var text = el.dataset.text || el.textContent;
    el.dataset.text = text;
    var o = { n: 0 };
    return gsap.to(o, {
      n: text.length, duration: Math.min(text.length * 0.025, 1.4), ease: 'none', delay: (opts && opts.delay) || 0,
      onStart: function () { el.textContent = ''; },
      onUpdate: function () { el.textContent = text.slice(0, Math.round(o.n)); }
    });
  };

  function scrambleHighlights(container, tl, at) {
    container.querySelectorAll('.hl').forEach(function (hl, i) {
      tl.to(hl, { duration: 0.8, scrambleText: { text: hl.textContent, chars: 'upperCase', speed: 0.6 } }, at + i * 0.1);
    });
  }

  /* Hero entrance, after the boot loader */
  Promise.all([P.introDone, fontsReady]).then(function () {
    var title = document.querySelector('[data-anim="hero-title"]');
    if (!title) return;
    gsap.set(title, { visibility: 'visible' });
    var split = SplitText.create(title, { type: 'lines', mask: 'lines' });
    var tl = gsap.timeline({ defaults: { ease: 'expo.out' } })
      .from(split.lines, { yPercent: 110, duration: 1.2, stagger: 0.1 })
      .to('[data-anim="hero-media"]', { clipPath: 'inset(0% 0 0 0)', duration: 1.5, ease: 'expo.inOut' }, 0)
      .from('[data-anim="hero-media"] img', { scale: 1.3, duration: 2.2 }, 0.1)
      .to('[data-anim="hero-fade"]', { opacity: 1, y: 0, duration: 1, stagger: 0.07, ease: 'power3.out' }, 0.3);
    scrambleHighlights(title, tl, 0.7);
    var whoami = document.querySelector('.hero [data-type]');
    if (whoami) tl.add(P.typeText(whoami), 0.45);
  });

  /* Split-line headings, highlight word decodes after the lines land */
  fontsReady.then(function () {
    each('[data-anim="lines"]', function (el) {
      SplitText.create(el, {
        type: 'lines', mask: 'lines', autoSplit: true,
        onSplit: function (self) {
          var tl = gsap.timeline({ scrollTrigger: { trigger: el, start: 'top 85%', once: true } });
          tl.from(self.lines, { yPercent: 105, duration: 1.1, ease: 'expo.out', stagger: 0.08 });
          scrambleHighlights(el, tl, 0.5);
          return tl;
        }
      });
    });
  });

  /* Hover scramble on mono labels (text is restored to the original) */
  each('[data-scramble]', function (el) {
    var text = el.textContent;
    el.addEventListener('pointerenter', function () {
      gsap.to(el, { duration: 0.5, scrambleText: { text: text, chars: '01<>/_[]', speed: 0.9 }, overwrite: true });
    });
  });

  each('[data-anim="fade"]', function (el) {
    gsap.from(el, { y: 40, autoAlpha: 0, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 88%', once: true } });
  });

  each('[data-anim="stagger"]', function (el) {
    gsap.from(el.children, { y: 24, autoAlpha: 0, duration: 0.8, ease: 'power3.out', stagger: 0.08, scrollTrigger: { trigger: el, start: 'top 85%', once: true } });
  });

  each('[data-anim="wipe"]', function (el) {
    var img = el.querySelector('img');
    var tl = gsap.timeline({ scrollTrigger: { trigger: el, start: 'top 85%', once: true } });
    tl.fromTo(el, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.3, ease: 'expo.inOut' });
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

  /* Tape marquee: constant drift, boosted and reversed by scroll velocity */
  var loops = gsap.utils.toArray('.marquee__row').map(function (row, i) {
    var track = row.querySelector('.marquee__track');
    return i % 2
      ? gsap.fromTo(track, { xPercent: -50 }, { xPercent: 0, duration: 40, ease: 'none', repeat: -1 })
      : gsap.fromTo(track, { xPercent: 0 }, { xPercent: -50, duration: 40, ease: 'none', repeat: -1 });
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

  /* git-log experience graph (markup in Task 6) */
  var progress = document.querySelector('.timeline__progress');
  if (progress) gsap.fromTo(progress, { scaleY: 0 }, { scaleY: 1, ease: 'none',
    scrollTrigger: { trigger: '.timeline', start: 'top 70%', end: 'bottom 60%', scrub: true } });
  each('.timeline__item', function (item) {
    gsap.from(item, { x: 40, autoAlpha: 0, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: item, start: 'top 82%', once: true } });
    ScrollTrigger.create({ trigger: item, start: 'top 60%', end: 'bottom 60%', toggleClass: 'is-active' });
  });

  /* Desktop: horizontal "offline" strip (markup in Task 7) */
  mm.add('(min-width: 900px)', function () {
    var section = document.querySelector('.beyond');
    var track = section && section.querySelector('.beyond__track');
    if (!track) return;
    var distance = function () { return Math.max(0, track.scrollWidth - window.innerWidth); };
    gsap.to(track, { x: function () { return -distance(); }, ease: 'none',
      scrollTrigger: { trigger: section, start: 'top top', end: function () { return '+=' + distance(); }, pin: true, scrub: 1, invalidateOnRefresh: true } });
  });

  /* Mobile: photos turn to colour while centred (no hover on touch) */
  mm.add('(max-width: 899px)', function () {
    each('.photo', function (photo) {
      ScrollTrigger.create({ trigger: photo, start: 'top 65%', end: 'bottom 35%', toggleClass: 'is-color' });
    });
  });
})();
```

- [ ] **Step 5: Run tests** — `npm test` — Expected: all PASS.

- [ ] **Step 6: Browser check** — desktop 1440×900 and mobile 375×812: after the boot loader the headline lines rise and "SHIPS." decodes; `whoami` line types; portrait wipes up, goes colour on hover and glitches; tape bands drift and speed up with scroll; README panel fades in, stats count up; nav labels scramble on hover. Console clean.

- [ ] **Step 7: Commit**

```bash
git add index.html css/sections.css js/motion.js tests/site.test.mjs
git commit -m "feat: hero, tape marquee and README about section with generic motion layer"
```

---

### Task 5: Signature pipeline section + synced log + standalone pipeline SVG

**Files:**
- Modify: `index.html` (replace `#pipeline` placeholder; add `<script defer src="js/pipeline.js">` after `motion.js`), `css/sections.css`, `tests/site.test.mjs`
- Create: `js/pipeline.js`, `assets/svg/pipeline.svg`

**Interfaces:**
- Consumes: `window.Portfolio.{motion, typeText}`, GSAP DrawSVG + MotionPath.
- Produces: SVG classes `.pl-doc`, `.pl-page`, `.pl-gate`, `.pl-check-ring`, `.pl-check-mark`, `.pl-wire-in`, `.pl-core`, `.pl-core-ring`, `.pl-packet`, `.pl-wire-out`, `.pl-out`, `.pl-sync`, `.pl-dash`, `.pl-bar`; steps `.pipeline__step[data-step=ingest|split|validate|transform|deliver]`; log `.pl-log li[data-log=…] > .pl-log__msg`.

- [ ] **Step 1: Add failing tests**

```js
test('pipeline section has an accessible SVG, five steps and a matching log', () => {
  const section = src.match(/<section id="pipeline"[\s\S]*?<\/section>/)[0];
  assert.match(section, /<svg[^>]*role="img"[^>]*aria-labelledby="pl-title pl-desc"/);
  assert.match(section, /<title id="pl-title">/);
  assert.match(section, /<desc id="pl-desc">/);
  const order = ['ingest', 'split', 'validate', 'transform', 'deliver'];
  assert.deepEqual([...section.matchAll(/data-step="(\w+)"/g)].map((m) => m[1]), order);
  assert.deepEqual([...section.matchAll(/data-log="(\w+)"/g)].map((m) => m[1]), order);
  assert.equal((section.match(/class="pl-log__msg"/g) || []).length, 5);
  for (const cls of ['pl-doc', 'pl-page', 'pl-check-mark', 'pl-wire-in', 'pl-core-ring', 'pl-packet', 'pl-wire-out', 'pl-out', 'pl-sync', 'pl-bar']) {
    assert.match(section, new RegExp(`class="${cls}\\b`), `missing .${cls}`);
  }
});

test('standalone pipeline.svg is dark, animates itself and respects reduced motion', () => {
  const svg = read('assets/svg/pipeline.svg');
  assert.match(svg, /@keyframes/);
  assert.match(svg, /prefers-reduced-motion/);
  assert.match(svg, /EDI ENGINE/);
  assert.match(svg, /#C6F432/i);
  assert.match(svg, /#0B0B0B/i);
});
```

- [ ] **Step 2: Run tests** — Expected: FAIL.

- [ ] **Step 3: Pipeline markup** (viewBox `0 0 1100 560`; colours via CSS classes)

```html
<section id="pipeline" class="section pipeline">
  <div class="pipeline__inner container">
    <div class="pipeline__copy">
      <p class="section-label"><span>02</span> // pipeline</p>
      <h2 class="display pipeline__title" data-anim="lines">From claim files to <span class="hl">clean</span> data.</h2>
      <ol class="pipeline__steps">
        <li class="pipeline__step" data-step="ingest"><span class="mono">01</span><h3>Ingest</h3><p>EOBs, 837 claims and self-pay documents arrive in every shape a client can produce.</p></li>
        <li class="pipeline__step" data-step="split"><span class="mono">02</span><h3>Split</h3><p>An automated splitting engine breaks huge batches into indexed, traceable pages.</p></li>
        <li class="pipeline__step" data-step="validate"><span class="mono">03</span><h3>Validate</h3><p>Index-based schema validation catches bad data before anyone downstream sees it.</p></li>
        <li class="pipeline__step" data-step="transform"><span class="mono">04</span><h3>Transform</h3><p>The EDI engine maps every record into one consistent, HIPAA-compliant model.</p></li>
        <li class="pipeline__step" data-step="deliver"><span class="mono">05</span><h3>Deliver &amp; sync</h3><p>A customisable output engine writes 835, CSV or TXT and syncs results live into the client portal.</p></li>
      </ol>
    </div>
    <div class="pipeline__stage">
      <svg class="pipeline__svg" viewBox="0 0 1100 560" role="img" aria-labelledby="pl-title pl-desc">
        <title id="pl-title">The EDI claims pipeline</title>
        <desc id="pl-desc">EOB, 837 and self-pay files are ingested, split into pages, validated, transformed by the EDI engine, output as 835, CSV and TXT, and synced to a client-portal dashboard.</desc>
        <!-- geometry to author as real elements (no comments in the file): -->
        <!-- Docs: three <g class="pl-doc" transform="translate(40,{y})"> at y = 100, 248, 396: rect 100×64 + folded-corner path + 3 text-line rects + <text class="pl-label">EOB|837|SELF-PAY</text> -->
        <!-- Pages: six <rect class="pl-page"> 34×44: two per doc at (200,y-6) and (214,y+14) -->
        <!-- Gate: <line class="pl-gate" x1="330" y1="70" x2="330" y2="490"/> + <text class="pl-label">VALIDATE</text> -->
        <!-- Checks: per doc a <g transform="translate(330,{y+32})"> with <rect class="pl-check-ring" x="-14" y="-14" width="28" height="28"/> and <path class="pl-check-mark" d="M-6 0l4 4 8-8"/> -->
        <!-- Wires in: <path class="pl-wire-in" d="M344 132 C 430 132, 440 280, 500 280"/>, <path class="pl-wire-in" d="M344 280 L 500 280"/>, <path class="pl-wire-in" d="M344 428 C 430 428, 440 280, 500 280"/> -->
        <!-- Core: <g class="pl-core"> square 150×150 centred at (580,280) (fill lime), <circle class="pl-core-ring" cx="580" cy="280" r="104" stroke-dasharray="6 10"/>, <text>EDI ENGINE</text> in on-lime mono bold -->
        <!-- Packets: six <rect class="pl-packet" width="10" height="10" opacity="0"/> (3 in, 3 out) -->
        <!-- Wires out: <path class="pl-wire-out" d="M660 280 C 710 280, 710 150, 760 150"/>, <path class="pl-wire-out" d="M660 280 L 760 280"/>, <path class="pl-wire-out" d="M660 280 C 710 280, 710 410, 760 410"/> -->
        <!-- Outputs: three <g class="pl-out"> rects 96×44 at (760,128),(760,258),(760,388) labelled 835, CSV, TXT -->
        <!-- Sync: <path class="pl-sync" d="M856 280 L 900 280"/> -->
        <!-- Dashboard: <g class="pl-dash"> rect (900,190) 180×180 + label PORTAL + four <rect class="pl-bar"> width 26 at x=920,960,1000,1040, baseline y=350, heights 60/100/80/130 -->
      </svg>
      <div class="term pipeline__log">
        <div class="term__bar"><span class="term__dots" aria-hidden="true"><i></i><i></i><i></i></span><span class="term__title">edi-engine.log</span></div>
        <ol class="term__body pl-log" aria-label="Pipeline log">
          <li data-log="ingest"><span class="lime">[ingest]</span> <span class="pl-log__msg">3 files received (EOB, 837, SELF-PAY)</span></li>
          <li data-log="split"><span class="lime">[split]</span> <span class="pl-log__msg">3 → 12 pages, indexed</span></li>
          <li data-log="validate"><span class="lime">[validate]</span> <span class="pl-log__msg">schema ok ✓ 12/12</span></li>
          <li data-log="transform"><span class="lime">[transform]</span> <span class="pl-log__msg">engine → canonical model</span></li>
          <li data-log="deliver"><span class="lime">[deliver]</span> <span class="pl-log__msg">835 · csv · txt → portal ✓ synced</span></li>
        </ol>
      </div>
    </div>
  </div>
</section>
```

- [ ] **Step 4: Pipeline CSS**

`.pipeline__inner{display:grid;grid-template-columns:minmax(0,.75fr) minmax(0,1.25fr);gap:var(--gutter);min-height:100svh;align-items:center}`; `.pipeline__title{font-size:var(--step-3);margin-bottom:2rem}`; `.pipeline__step{display:grid;grid-template-columns:2.5rem 1fr;column-gap:.5rem;padding:.9rem 0;border-top:1px solid var(--line);color:var(--muted)}` `.pipeline__step h3{font:800 var(--step-1)/1 var(--font-display);text-transform:uppercase;color:var(--text)}` `.pipeline__step p{grid-column:2;font-size:var(--step--1)}` `.pipeline__step span{color:var(--lime)}`; motion-scoped dimming `.motion-ready .pipeline__step{opacity:.35;transition:opacity .4s}` `.motion-ready .pipeline__step.is-done{opacity:.6}` `.motion-ready .pipeline__step.is-active{opacity:1}` `.pipeline__step.is-active h3{color:var(--lime)}`; `.pipeline__stage{display:grid;gap:1rem}`; log `.pl-log{font:500 13px/1.9 var(--font-mono);min-height:12.5em}` `.motion-ready .pl-log li{opacity:.15;transition:opacity .3s}` `.motion-ready .pl-log li.is-shown{opacity:1}`. SVG styling: docs/pages/chips/dash `fill:var(--bg-2);stroke:var(--text);stroke-width:1.5`; doc text-line rects `fill:var(--line-strong)`; wires/sync `fill:none;stroke:var(--lime);stroke-width:2`; gate `stroke:var(--line-strong);stroke-dasharray:4 6`; check ring `fill:var(--lime)`, mark `fill:none;stroke:var(--on-lime);stroke-width:2.5`; core square `fill:var(--lime)`, core text `fill:var(--on-lime);font:700 22px var(--font-mono)`; core ring `fill:none;stroke:var(--lime);stroke-opacity:.6`; packets `fill:var(--lime)`; bars `fill:var(--lime)`; `.pl-label{font:500 13px var(--font-mono);fill:var(--muted)}`. Mobile (<900px): single column; steps become a horizontal scroll-snap row (`display:flex;overflow-x:auto;scroll-snap-type:x mandatory`, each step `min-width:72vw`).

- [ ] **Step 5: Write `js/pipeline.js`**

```js
/* Signature pipeline: scrubbed + pinned on desktop, looping when visible on mobile, with a synced log. */
(function () {
  'use strict';
  var P = window.Portfolio;
  var section = document.getElementById('pipeline');
  if (!P || !P.motion || !section) return;

  var svg = section.querySelector('.pipeline__svg');
  var steps = section.querySelectorAll('.pipeline__step');
  var logs = section.querySelectorAll('.pl-log li');
  var order = ['ingest', 'split', 'validate', 'transform', 'deliver'];
  var q = function (sel) { return svg.querySelectorAll(sel); };
  var lastIdx = -1;

  function setActive(label) {
    var idx = order.indexOf(label === 'end' ? 'deliver' : label);
    steps.forEach(function (step, i) {
      step.classList.toggle('is-active', i === idx);
      step.classList.toggle('is-done', i < idx);
    });
    logs.forEach(function (li, i) { li.classList.toggle('is-shown', i <= idx); });
    if (idx > lastIdx && logs[idx] && P.typeText) P.typeText(logs[idx].querySelector('.pl-log__msg'));
    lastIdx = idx;
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
    lastIdx = -1;
    var tl = build();
    if (ctx.conditions.desktop) {
      ScrollTrigger.create({ animation: tl, trigger: section, start: 'top top', end: '+=2400', pin: true, scrub: 1 });
    } else {
      tl.to(svg.querySelectorAll('g, path, rect, circle, line'), { autoAlpha: 0, duration: 0.4 }, '+=1.4')
        .call(function () { lastIdx = -1; });
      tl.repeat(-1).pause();
      ScrollTrigger.create({ trigger: svg, start: 'top 85%', end: 'bottom 15%',
        onToggle: function (self) { self.isActive ? tl.play() : tl.pause(); } });
    }
  });
})();
```

- [ ] **Step 6: Write standalone `assets/svg/pipeline.svg`**

Same geometry as the inline SVG with hard-coded Neo Terminal colours (`#0B0B0B` background rect, `#121212` panels, `#EDEDED` strokes, `#C6F432` accent) and an internal `<style>`: 8s infinite loop; `@keyframes` for doc slide-in (0–10%), pages pop (10–20%), checks draw via `stroke-dashoffset` (20–32%), wires draw (32–45%), packets moving with `offset-path: path('…')` + `offset-distance 0%→100%` (45–65%), outputs fade (60–70%), bars `scaleY` (70–85%), everything fades out (92–100%); core ring rotates continuously; `@media (prefers-reduced-motion: reduce){*{animation:none!important}}`; the non-animated state equals the final composed picture.

- [ ] **Step 7: Run tests** — `npm test` — Expected: PASS.

- [ ] **Step 8: Browser check** — desktop: section pins; scrolling scrubs the five steps; active step turns lime and the log line for it types out; packets follow wires; un-pins cleanly. Mobile: no pin; loops while visible with the log replaying. Open `assets/svg/pipeline.svg` directly: it loops on black.

- [ ] **Step 9: Commit**

```bash
git add index.html css/sections.css js/pipeline.js assets/svg/pipeline.svg tests/site.test.mjs
git commit -m "feat: scroll-driven EDI ENGINE pipeline with synced terminal log and standalone SVG"
```

---

### Task 6: git-log Experience + `ls -la` Projects with animated covers

**Files:**
- Modify: `index.html` (replace `#experience`, `#work` placeholders; add `<script defer src="js/work.js">`), `css/sections.css`, `tests/site.test.mjs`
- Create: `js/work.js`

**Interfaces:**
- Consumes: `PortfolioLib.matchesFilter`, `Portfolio.motion`, `.work-preview`.
- Produces: `.timeline`, `.timeline__progress`, `.timeline__item.commit`; `.work__flags [data-filter]`, `.work__list .work-row[data-category]`, `.work-row__toggle[aria-expanded][aria-controls]`, `.work-row__panel[hidden]`, `.cover.cover--{files|bars|ring|grid|wave|pulse}`, `.work__count[aria-live]` (text `total N`).

- [ ] **Step 1: Add failing tests**

```js
test('content fixes are applied', () => {
  assert.ok(!/827/.test(src), 'found 827');
  assert.ok(!/CCPA/.test(src), 'found CCPA');
  assert.match(src, /CGPA 6\.6/);
  assert.match(src, /Aventus Informatics/);
  assert.match(src, /Mobatia Technology/);
});

test('work rows, flags and accordions are wired consistently', () => {
  const filters = [...src.matchAll(/data-filter="([^"]+)"/g)].map((m) => m[1]);
  assert.deepEqual(filters, ['all', 'healthcare', 'enterprise', 'commerce']);
  const chunks = src.split('<li class="work-row"').slice(1);
  assert.equal(chunks.length, 6);
  for (const chunk of chunks) {
    const cats = chunk.match(/data-category="([^"]+)"/)[1];
    for (const c of cats.split(' ')) assert.ok(filters.includes(c), `unknown category ${c}`);
    const toggle = chunk.match(/<button class="work-row__toggle"[^>]*>/)[0];
    assert.equal(attr(toggle, 'aria-expanded'), 'false');
    const panelId = attr(toggle, 'aria-controls');
    assert.match(chunk, new RegExp(`id="${panelId}"[^>]*hidden`));
    assert.match(chunk, /class="cover cover--\w+"/);
  }
});
```

- [ ] **Step 2: Run tests** — Expected: FAIL.

- [ ] **Step 3: Experience markup**

```html
<section id="experience" class="section experience">
  <div class="container">
    <p class="section-label"><span>03</span> // experience</p>
    <h2 class="display section-title" data-anim="lines">Leading teams that <span class="hl">ship.</span></h2>
    <p class="mono muted gitlog__cmd"><span class="lime">$</span> git log --graph --career</p>
    <ol class="timeline">
      <li class="timeline__rail" aria-hidden="true"><span class="timeline__progress"></span></li>
      <li class="timeline__item commit">
        <p class="commit__meta mono"><span class="commit__hash">a7f3e21</span> <span class="lime">(HEAD → main)</span> 2022 — now</p>
        <h3 class="commit__subject">feat(aventus): software engineer — lead / technical head</h3>
        <p class="mono muted">Aventus Informatics</p>
        <p>Leading architecture, development and enhancement of enterprise healthcare systems — owning product scalability, HIPAA compliance, client-customisation frameworks and technical team leadership.</p>
      </li>
      <li class="timeline__item commit">
        <p class="commit__meta mono"><span class="commit__hash">4c9b0d2</span> dec 2019 — 2022</p>
        <h3 class="commit__subject">feat(mobatia): software engineer</h3>
        <p class="mono muted">Mobatia Technology Pvt Ltd</p>
        <p>Managed multiple Laravel and Django projects, built REST APIs for mobile apps, integrated payment gateways, delivered CMS-based enterprise applications and supported live production systems.</p>
      </li>
      <li class="timeline__item commit commit--root">
        <p class="commit__meta mono"><span class="commit__hash">0000001</span> root commit</p>
        <h3 class="commit__subject">init: bsc computer science</h3>
        <p class="mono muted">University of Kerala · CGPA 6.6</p>
      </li>
    </ol>
  </div>
</section>
```
(Commit hashes are decorative labels, not claims; `.timeline__rail` is a decorative `aria-hidden` list item.)

- [ ] **Step 4: Projects markup** — one row shown; repeat for all six with the table below.

```html
<section id="work" class="section work">
  <div class="container">
    <p class="section-label"><span>04</span> // projects</p>
    <div class="work__head">
      <h2 class="display section-title" data-anim="lines">Platforms I've <span class="hl">shipped.</span></h2>
      <div class="work__cmd mono">
        <span><span class="lime">$</span> ls -la ~/projects</span>
        <span class="work__flags" role="group" aria-label="Filter projects">
          <button class="flag" type="button" data-filter="all" aria-pressed="true">--all</button>
          <button class="flag" type="button" data-filter="healthcare" aria-pressed="false">--healthcare</button>
          <button class="flag" type="button" data-filter="enterprise" aria-pressed="false">--enterprise</button>
          <button class="flag" type="button" data-filter="commerce" aria-pressed="false">--commerce</button>
        </span>
      </div>
      <p class="work__count mono muted" aria-live="polite">total 6</p>
    </div>
    <div class="work__cols mono" aria-hidden="true"><span>perm</span><span>type</span><span>name</span><span>stack</span></div>
    <ol class="work__list">
      <li class="work-row" data-category="healthcare" data-cursor="view" data-cursor-label="[open]">
        <button class="work-row__toggle" type="button" aria-expanded="false" aria-controls="work-1">
          <span class="work-row__perm mono">drwxr-xr-x</span>
          <span class="work-row__type mono">healthcare</span>
          <span class="work-row__title">edi-engine/ <span class="muted">edi processing platform</span></span>
          <span class="work-row__tags mono">python · django</span>
          <span class="work-row__icon mono" aria-hidden="true">+</span>
        </button>
        <div class="work-row__panel" id="work-1" hidden>
          <div class="work-row__body">
            <div class="md">
              <p class="mono muted"><span class="lime">$</span> cat edi-engine/README.md</p>
              <ul class="md__list">
                <li>Designed the architecture for processing EOB, 837, self-pay and many other EOB file formats.</li>
                <li>Built an automated file-splitting engine with index-based schema validation.</li>
                <li>Created a customisable output engine supporting 835, CSV, TXT and client-specific formats.</li>
              </ul>
            </div>
            <svg class="cover cover--files" viewBox="0 0 320 240" aria-hidden="true"><!-- 3 outlined file rects fanning out/in (@keyframes fan) + a lime scan line sweeping down --></svg>
          </div>
        </div>
      </li>
      <!-- rows 2–6 -->
    </ol>
  </div>
</section>
```

Rows 2–6 (same structure; ids `work-2`…`work-6`; perm `drwxr-xr-x`; type column shows the first category):

| # | category | name / *muted* | stack | bullets | cover |
|---|---|---|---|---|---|
| 02 | `healthcare` | client-portal/ *client operations system* | data sync · dashboards | Real-time data sync from the EDI engine to the client portal. / Client dashboards for processed records, output management and file tracking. / Client-level access control and operational reporting. | `cover--bars` (outlined bars rising/falling, staggered) |
| 03 | `enterprise` | ticketing/ *sla & analytics* | sla · bi | Client and provider ticketing with SLA tracking and status workflows. / Report-generation engine and dynamic analytics dashboards. / Role-based access, resolution tracking and audit logs. | `cover--ring` (SLA ring stroke filling 0→80%, ticking hand) |
| 04 | `enterprise` | schools/ *management systems* | laravel · payments | BISAD — school management system for BIS Abu Dhabi. / NAIS Dubai, Al Khor and Manila — school CMS and payment portal. | `cover--grid` (4×3 outlined tiles lighting lime in sequence) |
| 05 | `commerce` | vlurb/ *social & e-commerce* | social · commerce | VLURB — a voice-based social media platform. / Tasveek — e-commerce platform. / Desert Motors — auto-parts e-commerce. | `cover--wave` (9 bars of a sound wave oscillating) |
| 06 | `healthcare enterprise` | clinic/ *clinic & project mgmt* | hospital · tasks | RAM Clinics — hospital management system. / Task tracking with module-based project segmentation and team performance. | `cover--pulse` (ECG polyline drawn by `stroke-dashoffset` loop) |

- [ ] **Step 5: CSS for git log, projects and covers**

Git log: `.gitlog__cmd{margin:-1.5rem 0 3rem}`; `.timeline{position:relative;display:grid;gap:3.5rem}`; rail `position:absolute;left:5px;top:.4rem;bottom:0;width:2px;background:var(--line)`; `.timeline__progress{position:absolute;inset:0;background:var(--lime);transform-origin:top}`; `.commit{position:relative;padding-left:2.75rem;max-width:62rem}` `.commit::before{content:"";position:absolute;left:0;top:.35rem;width:12px;height:12px;border:2px solid var(--lime);background:var(--bg);transition:background-color .3s}` `.commit.is-active::before{background:var(--lime)}`; `.commit__meta{font-size:var(--step--1);color:var(--muted)}` `.commit__hash{color:var(--warn)}` `.commit__subject{font:800 var(--step-2)/1.05 var(--font-display);text-transform:uppercase;margin:.5rem 0}`; `.commit--root .commit__subject{color:var(--muted)}`.

Projects: `.work__head{display:grid;grid-template-columns:1fr auto;align-items:end;gap:1rem 2rem;margin-bottom:2rem}`; `.work__cmd{display:flex;flex-wrap:wrap;gap:.75rem 1.25rem;align-items:center;font-size:13px}` `.flag{font:500 13px var(--font-mono);color:var(--muted);padding:.35rem .6rem;border:1px solid var(--line)}` `.flag[aria-pressed="true"]{background:var(--lime);color:var(--on-lime);border-color:var(--lime)}` `.flag:hover{color:var(--lime);border-color:var(--lime)}`; columns grid shared by `.work__cols` and `.work-row__toggle`: `grid-template-columns:8.5rem 7.5rem minmax(0,1fr) 12rem 2rem;gap:1rem;align-items:center`; `.work__cols{font-size:11px;color:var(--muted);padding:0 1rem .5rem;border-bottom:1px solid var(--line)}`; rows `border-bottom:1px solid var(--line)`; `.work-row__toggle{display:grid;width:100%;text-align:left;padding:1.4rem 1rem;transition:background-color .2s}` `.work-row__toggle:hover{background:var(--bg-3)}` `.work-row__perm,.work-row__type,.work-row__tags{font-size:12px;color:var(--muted)}` `.work-row__title{font:800 var(--step-1)/1.1 var(--font-display);text-transform:uppercase}` `.work-row__title .muted{font:400 var(--step--1) var(--font-mono);text-transform:none;margin-left:.5rem}` `.work-row__toggle:hover .work-row__title{color:var(--lime)}` `.work-row__icon{color:var(--lime);font-size:20px;transition:rotate .3s}` `[aria-expanded="true"] .work-row__icon{rotate:45deg}`; `.work-row__body{display:grid;grid-template-columns:minmax(0,1.2fr) minmax(0,.8fr);gap:2rem;padding:0 1rem 2rem}` cover `background:var(--bg-2);border:1px solid var(--line)`; `.work-row[hidden]{display:none}`. Cover SVG strokes `var(--text)`/fills `var(--lime)`; keyframes per type (`fan`, `bars`, `ring`, `tiles`, `wave`, `ecg`) with `animation-play-state:paused` by default and `running` inside `.work-row.is-open` and `.work-preview`. Mobile (<900px): `.work__cols` hidden; toggle grid `1fr 2rem` with perm/type/tags hidden and title wrapping; body single column; `.work__head` single column.

- [ ] **Step 6: Write `js/work.js`**

```js
/* Projects: CLI-flag filters, accordion rows and the cursor-following cover preview. */
(function () {
  'use strict';
  var P = window.Portfolio, lib = window.PortfolioLib;
  var list = document.querySelector('.work__list');
  if (!list) return;
  var motion = P && P.motion;
  var rows = Array.prototype.slice.call(list.querySelectorAll('.work-row'));
  var flags = document.querySelectorAll('.work__flags [data-filter]');
  var count = document.querySelector('.work__count');
  var refresh = function () { if (motion) ScrollTrigger.refresh(); };

  flags.forEach(function (flag) {
    flag.addEventListener('click', function () {
      var filter = flag.dataset.filter, shown = 0;
      flags.forEach(function (f) { f.setAttribute('aria-pressed', String(f === flag)); });
      rows.forEach(function (row) {
        var show = lib.matchesFilter(row.dataset.category, filter);
        if (show) shown++;
        if (show === !row.hidden) return;
        if (!motion) { row.hidden = !show; return; }
        if (show) {
          row.hidden = false;
          gsap.fromTo(row, { autoAlpha: 0, x: -16 }, { autoAlpha: 1, x: 0, duration: 0.5, ease: 'power3.out' });
        } else {
          gsap.to(row, { autoAlpha: 0, x: 16, duration: 0.2, onComplete: function () { row.hidden = true; refresh(); } });
        }
      });
      count.textContent = 'total ' + shown;
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
        gsap.fromTo(panel, { height: 0, autoAlpha: 0 }, { height: 'auto', autoAlpha: 1, duration: 0.6, ease: 'expo.out', onComplete: refresh });
      } else {
        gsap.to(panel, { height: 0, autoAlpha: 0, duration: 0.35, ease: 'power2.inOut',
          onComplete: function () { panel.hidden = true; gsap.set(panel, { clearProps: 'height,opacity,visibility' }); refresh(); } });
      }
    });
  });

  var preview = document.querySelector('.work-preview');
  if (!motion || !preview || !window.matchMedia('(min-width: 900px) and (hover: hover) and (pointer: fine)').matches) return;
  gsap.set(preview, { xPercent: -50, yPercent: -115, scale: 0.85 });
  var xTo = gsap.quickTo(preview, 'x', { duration: 0.5, ease: 'power3' });
  var yTo = gsap.quickTo(preview, 'y', { duration: 0.5, ease: 'power3' });
  list.addEventListener('pointermove', function (e) { xTo(e.clientX); yTo(e.clientY); });
  rows.forEach(function (row) {
    row.addEventListener('pointerenter', function () {
      if (row.classList.contains('is-open')) return;
      var cover = row.querySelector('.cover');
      if (cover) preview.replaceChildren(cover.cloneNode(true));
      gsap.to(preview, { autoAlpha: 1, scale: 1, duration: 0.35, ease: 'power3.out' });
    });
    row.addEventListener('pointerleave', function () { gsap.to(preview, { autoAlpha: 0, scale: 0.85, duration: 0.25 }); });
  });
})();
```

- [ ] **Step 7: Run tests** — `npm test` — Expected: PASS.

- [ ] **Step 8: Browser check** — git graph line grows with scroll and commit nodes fill; flags filter rows with slide animation and `total N` updates; rows expand/collapse via keyboard (Tab + Enter) and mouse; desktop hover shows a lime-framed animated cover following the cursor; mobile shows the cover inside the expanded panel.

- [ ] **Step 9: Commit**

```bash
git add index.html css/sections.css js/work.js tests/site.test.mjs
git commit -m "feat: git-log experience and ls -la projects with flag filters and animated covers"
```

---

### Task 7: Stack, Offline strip, Contact, Footer + cursor and contact scripts

**Files:**
- Modify: `index.html` (replace `#toolkit`, `#beyond`, `#contact` placeholders; add footer; add `<script defer>` for `js/cursor.js`, `js/contact.js`), `css/sections.css`, `tests/site.test.mjs`
- Create: `js/cursor.js`, `js/contact.js`

**Interfaces:**
- Consumes: `PortfolioLib.{buildMailto, validateContact, formatClock}`, `Portfolio.motion`, `.cursor`, `.toast`, `[data-magnetic]`, `[data-cursor]`.
- Produces: `.contact-form[novalidate]` with fields `name,email,subject,message`, error spans `#{field}-error`, `.contact-form__status`; `[data-copy]`, `[data-clock]`, `[data-clock="short"]`, `[data-year]`.

- [ ] **Step 1: Add failing tests**

```js
test('stack has six terminal panes', () => {
  const section = src.match(/<section id="toolkit"[\s\S]*?<\/section>/)[0];
  assert.equal((section.match(/class="term tool-card\b/g) || []).length, 6);
});

test('contact form is labelled, novalidate and wired to error messages', () => {
  const form = src.match(/<form class="contact-form[^"]*"[\s\S]*?<\/form>/)[0];
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

test('contact details, clocks, year and copy button exist', () => {
  assert.match(src, /href="mailto:sachusudeve8690@gmail\.com"/);
  assert.match(src, /href="tel:\+918157864536"/);
  assert.match(src, /data-copy="sachusudeve8690@gmail\.com"/);
  assert.match(src, /data-clock>/);
  assert.match(src, /data-clock="short"/);
  assert.match(src, /data-year/);
  assert.match(src, /<section id="beyond"/);
});
```

- [ ] **Step 2: Run tests** — Expected: FAIL.

- [ ] **Step 3: Stack markup** — `<section id="toolkit" class="section toolkit">`, label `<span>05</span> // stack`, heading "The stack I <span class="hl">reach for.</span>" (`data-anim="lines"`), `.bento` grid of six `<article class="term tool-card" data-anim="fade">` each with a `.term__bar` (dots + file name), and a `.term__body` holding a looping inline lime SVG icon (`aria-hidden`), an `<h3>` and `<ul class="tags">` of `[tag]` items:
  1. `languages.json` — Languages — `[python] [php] [javascript]` — icon: `</>` with blinking caret.
  2. `frameworks.toml` — Frameworks — `[django] [fastapi] [laravel] [reactjs] [kohana]` — icon: three stacked layers sliding.
  3. `databases.yml` — Databases — `[postgresql] [mysql] [sqlite]` — icon: cylinder stack with a pulsing top.
  4. `healthcare.edi` (wide) — Healthcare & EDI — `[hipaa] [835 payments] [837 claims] [eob processing] [patient pay] [correspondence]` — icon: shield with a drawn check.
  5. `tools.sh` — Tools & platforms — `[git] [rest apis] [cms development] [payment gateways]` — icon: git branch graph with a travelling dot.
  6. `architecture.md` (wide) — Architecture — `[file pipelines] [data sync] [reporting engines] [client customisation]` — icon: three nodes linked by flowing dashes.
  Below: a `.term strengths` pane titled `sachu --help` with a `<dl>` of flag/description pairs: `--healthcare` healthcare domain expertise · `--hipaa` HIPAA-compliant architecture · `--edi` EDI & 835 processing · `--big-files` large-file processing systems · `--custom` client customisation frameworks · `--lead` technical leadership · `--perf` performance optimisation · `--api` scalable API development.

- [ ] **Step 4: Offline strip markup** — `<section id="beyond" class="beyond">` with `.beyond__track` (flex row): intro card (`<span>06</span> // offline`, heading "When the terminal is <span class="hl">closed…</span>", line "…you'll find me somewhere with good light and better coffee."), `<figure class="photo beyond__photo" data-anim="wipe">` for `street-coffee` (alt "Sachu S holding a coffee outside the Velvet & Bloom café, a blue sports car behind him", caption `IMG_2031.JPG — coffee.run()`), the same for `street-walk` (alt "Sachu S walking past a café terrace under a frangipani tree", caption `IMG_2047.JPG — walk.slow()`), and a closing card linking `#contact` ("Back to work → let's talk").

- [ ] **Step 5: Contact + footer markup**

```html
<section id="contact" class="section contact">
  <div class="container">
    <p class="section-label"><span>07</span> // contact</p>
    <h2 class="display contact__title" data-anim="lines">Let's build something that <span class="hl">ships.</span></h2>
    <div class="contact__grid">
      <div class="contact__side">
        <div class="term contact__yml" data-anim="fade">
          <div class="term__bar"><span class="term__dots" aria-hidden="true"><i></i><i></i><i></i></span><span class="term__title">contact.yml</span></div>
          <dl class="term__body yml">
            <div><dt>email:</dt><dd><a href="mailto:sachusudeve8690@gmail.com">sachusudeve8690@gmail.com</a> <button class="copy-btn mono" type="button" data-copy="sachusudeve8690@gmail.com" aria-label="Copy email address">[copy]</button></dd></div>
            <div><dt>phone:</dt><dd><a href="tel:+918157864536">+91 81578 64536</a></dd></div>
            <div><dt>location:</dt><dd>kerala, in · IST <span data-clock>--:--:--</span></dd></div>
            <div><dt>linkedin:</dt><dd><a href="https://linkedin.com/in/sachu-s-705813179" target="_blank" rel="noopener" data-magnetic="0.3">/in/sachu-s ↗</a></dd></div>
            <div><dt>github:</dt><dd><a href="https://github.com/sachusudevan" target="_blank" rel="noopener" data-magnetic="0.3">@sachusudevan ↗</a></dd></div>
            <div><dt>status:</dt><dd class="lime">open to opportunities</dd></div>
          </dl>
        </div>
        <figure class="photo contact__photo" data-anim="wipe"><picture><source srcset="assets/img/portrait-wall.webp" type="image/webp" /><img src="assets/img/portrait-wall.jpg" alt="Black-and-white portrait of Sachu S leaning against a wall, eyes closed" width="{W}" height="{H}" loading="lazy" /></picture><figcaption class="photo__cap">img_003.jpg</figcaption></figure>
      </div>
      <form class="contact-form term" novalidate>
        <div class="term__bar"><span class="term__dots" aria-hidden="true"><i></i><i></i><i></i></span><span class="term__title">new_message.sh</span></div>
        <div class="term__body">
          <div class="field"><label for="name"><span class="lime">&gt;</span> name</label><input id="name" name="name" type="text" autocomplete="name" required aria-describedby="name-error" /><span class="field__error" id="name-error"></span></div>
          <div class="field"><label for="email"><span class="lime">&gt;</span> email</label><input id="email" name="email" type="email" autocomplete="email" required aria-describedby="email-error" /><span class="field__error" id="email-error"></span></div>
          <div class="field"><label for="subject"><span class="lime">&gt;</span> subject <span class="muted">(optional)</span></label><input id="subject" name="subject" type="text" /></div>
          <div class="field"><label for="message"><span class="lime">&gt;</span> message</label><textarea id="message" name="message" rows="5" required aria-describedby="message-error"></textarea><span class="field__error" id="message-error"></span></div>
          <button class="btn btn--lime" type="submit" data-magnetic="0.3">[ send ↵ ]</button>
          <p class="contact-form__status mono" role="status"></p>
        </div>
      </form>
    </div>
  </div>
</section>
</main>
<footer class="footer">
  <div class="container footer__grid mono">
    <a class="footer__logo" href="#hero" aria-label="Back to top"><span class="lime">~/</span>sachu</a>
    <nav aria-label="Footer"><a href="#work" data-scramble>[work]</a> <a href="#about" data-scramble>[about]</a> <a href="#pipeline" data-scramble>[pipeline]</a> <a href="#contact" data-scramble>[contact]</a></nav>
    <p class="muted">kerala · IST <span data-clock>--:--:--</span></p>
    <p class="muted">© <span data-year>2026</span> · built with vanilla js, gsap &amp; caffeine</p>
    <a class="footer__top" href="#hero">cd ~ ↑</a>
  </div>
  <p class="footer__wordmark display" aria-hidden="true">Sachu S</p>
</footer>
```
(Remove the `#toolkit`, `#beyond`, `#contact` placeholders; the new `</main>` closes after Contact.)

- [ ] **Step 6: CSS** — `.bento{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:1rem}` `.tool-card--wide{grid-column:span 2}` (mobile: 1 column, no spans); `.tool-card{transition:translate .25s var(--ease-out),box-shadow .25s var(--ease-out),border-color .2s}` `.tool-card:hover{translate:-4px -4px;box-shadow:8px 8px 0 var(--lime);border-color:var(--lime)}` `.tool-card h3{font:800 var(--step-1)/1 var(--font-display);text-transform:uppercase;margin:1rem 0}` `.tags{display:flex;flex-wrap:wrap;gap:.4rem;font:500 12px var(--font-mono);color:var(--muted)}` `.tags li:hover{color:var(--lime)}`; icon keyframes (`blink`, `slide`, `pulse`, `draw`, `travel`, `flow`); `.strengths dl` 2-column grid flag (lime) / description. Offline: `.beyond{overflow:hidden;padding-block:var(--space-section)}` `.beyond__track{display:flex;gap:2rem;padding-inline:var(--gutter);width:max-content;align-items:center}` `.beyond__photo{height:72vh;aspect-ratio:2/3}` cards `width:min(80vw,26rem)`; mobile: `.beyond__track{width:auto;overflow-x:auto;scroll-snap-type:x mandatory}` children `scroll-snap-align:center` and `.beyond__photo{height:60svh}`. Contact: `.contact__title{font-size:var(--step-4);margin-bottom:3rem}` `.contact__grid{display:grid;grid-template-columns:minmax(0,.9fr) minmax(0,1.1fr);gap:var(--gutter)}` `.yml>div{display:grid;grid-template-columns:7rem 1fr;gap:1rem;padding:.4rem 0;font:500 14px var(--font-mono)}` `.yml dt{color:var(--lime)}` `.yml a:hover{color:var(--lime)}` `.contact__photo{margin-top:1rem;aspect-ratio:4/3}`; `.field{display:grid;gap:.4rem;margin-bottom:1.25rem}` `.field label{font:500 13px var(--font-mono)}` `.field input,.field textarea{background:var(--bg-3);border:1px solid var(--line);color:var(--text);font:400 15px var(--font-mono);padding:.8rem .9rem;caret-color:var(--lime)}` `.field input:focus,.field textarea:focus{outline:none;border-color:var(--lime);box-shadow:4px 4px 0 var(--lime)}` `.field__error{font:500 12px var(--font-mono);color:var(--danger)}` `[aria-invalid="true"]{border-color:var(--danger)}` `.contact-form__status{margin-top:1rem;color:var(--lime)}`; mobile: contact grid single column. Footer: `.footer{border-top:1px solid var(--line);padding-top:3rem;overflow:hidden}` `.footer__grid{display:flex;flex-wrap:wrap;justify-content:space-between;gap:1rem 2rem;font-size:13px}` `.footer__wordmark{font-size:clamp(4rem,19vw,17rem);line-height:.8;color:transparent;-webkit-text-stroke:1px var(--line-strong);text-align:center;margin-top:3rem;transition:color .5s,-webkit-text-stroke-color .5s}` `.footer:hover .footer__wordmark{-webkit-text-stroke-color:var(--lime)}`.

- [ ] **Step 7: Write `js/cursor.js`**

```js
/* Block cursor + magnetic elements — fine pointers with motion only. */
(function () {
  'use strict';
  var P = window.Portfolio;
  var cursor = document.querySelector('.cursor');
  if (!P || !P.motion || !cursor || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  document.documentElement.classList.add('has-cursor');
  var label = cursor.querySelector('.cursor__label');
  gsap.set(cursor, { xPercent: -50, yPercent: -50 });
  var xTo = gsap.quickTo(cursor, 'x', { duration: 0.18, ease: 'power3' });
  var yTo = gsap.quickTo(cursor, 'y', { duration: 0.18, ease: 'power3' });
  var idleTimer;
  window.addEventListener('pointermove', function (e) {
    xTo(e.clientX); yTo(e.clientY);
    cursor.classList.remove('is-idle');
    clearTimeout(idleTimer);
    idleTimer = setTimeout(function () { cursor.classList.add('is-idle'); }, 1200);
  }, { passive: true });
  document.documentElement.addEventListener('mouseleave', function () { gsap.to(cursor, { autoAlpha: 0, duration: 0.2 }); });
  document.documentElement.addEventListener('mouseenter', function () { gsap.to(cursor, { autoAlpha: 1, duration: 0.2 }); });
  document.addEventListener('pointerover', function (e) {
    var view = e.target.closest('[data-cursor="view"]');
    var link = e.target.closest('a, button, label, input, textarea');
    // Project rows are buttons inside a [data-cursor="view"] row — the row's "view" state wins there.
    var inView = !!view && (!link || view.contains(link));
    cursor.classList.toggle('is-view', inView);
    cursor.classList.toggle('is-link', !!link && !inView);
    label.textContent = inView ? (view.dataset.cursorLabel || '[view]') : '';
  });

  document.querySelectorAll('[data-magnetic]').forEach(function (el) {
    var strength = parseFloat(el.dataset.magnetic) || 0.3;
    var mx = gsap.quickTo(el, 'x', { duration: 0.8, ease: 'elastic.out(1, 0.4)' });
    var my = gsap.quickTo(el, 'y', { duration: 0.8, ease: 'elastic.out(1, 0.4)' });
    el.addEventListener('pointermove', function (e) {
      var r = el.getBoundingClientRect();
      mx((e.clientX - (r.left + r.width / 2)) * strength);
      my((e.clientY - (r.top + r.height / 2)) * strength);
    });
    el.addEventListener('pointerleave', function () { mx(0); my(0); });
  });
})();
```

- [ ] **Step 8: Write `js/contact.js`**

```js
/* Terminal contact form (mailto), copy-to-clipboard, toast, live IST clocks and footer year. */
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
      document.getElementById(key + '-error').textContent = msg ? '! ' + msg : '';
      form.elements.namedItem(key).setAttribute('aria-invalid', String(!!msg));
    });
    var status = form.querySelector('.contact-form__status');
    if (!result.valid) {
      status.textContent = '';
      form.elements.namedItem(Object.keys(result.errors)[0]).focus();
      return;
    }
    status.textContent = '> opening your mail client … ok';
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
        toast(ok ? '> email copied ✓' : '! copy failed — ' + text);
      }
      if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(function () { toast('> email copied ✓'); }, fallback);
      else fallback();
    });
  });

  var clocks = document.querySelectorAll('[data-clock]');
  function tick() {
    var time = lib.formatClock(new Date(), 'Asia/Kolkata');
    clocks.forEach(function (c) { c.textContent = c.dataset.clock === 'short' ? time.slice(0, 5) : time; });
  }
  if (clocks.length) { tick(); setInterval(tick, 1000); }
  document.querySelectorAll('[data-year]').forEach(function (el) { el.textContent = String(new Date().getFullYear()); });
})();
```

- [ ] **Step 9: Run tests** — `npm test` — Expected: PASS.

- [ ] **Step 10: Browser check** — stack panes lift with lime offset shadow and icons loop; offline strip pins and scrolls horizontally on desktop, swipes on mobile; photos colourise on hover; contact: submit empty → `! …` errors and first invalid field focused; valid → status line and `mailto:` navigation (check the generated URL via `PortfolioLib.buildMailto` in the console); `[copy]` shows the toast; nav + contact + footer clocks tick; cursor is a lime block, outlines on links, shows `[open]` on project rows, blinks when idle; magnetic buttons pull.

- [ ] **Step 11: Commit**

```bash
git add index.html css/sections.css js/cursor.js js/contact.js tests/site.test.mjs
git commit -m "feat: stack panes, offline strip, terminal contact and footer with cursor + contact scripts"
```

---

### Task 8: Generated GIF and OG image (dark)

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

test('pipeline frames are valid dark SVG, animated, and loop seamlessly', () => {
  const first = renderFrame(0);
  assert.match(first, /^<svg[^>]+viewBox="0 0 720 360"/);
  assert.match(first, /#0B0B0B/);
  assert.match(first, /#C6F432/);
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
  if (caretOn) parts.push(`<rect x="370" y="19" width="8" height="14" fill="${C.lime}"/>`);

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
    + `<text y="7" text-anchor="middle" font-family="${MONO}" font-weight="bold" font-size="18" fill="${C.onLime}">EDI ENGINE</text></g>`);

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
```

- [ ] **Step 6: Generate and test**

Run: `npm run gif && npm run og && npm test` — Expected: both files written (GIF ≲ 1.5MB), all tests PASS. Open `assets/pipeline.gif` and `assets/og-image.png` with the Read tool to eyeball them; fix overlaps (e.g. headline width vs the photo frame) if any.

- [ ] **Step 7: Commit**

```bash
git add tools/pipeline-frames.mjs tools/render-gif.mjs tools/render-og.mjs tests/media.test.mjs assets/pipeline.gif assets/og-image.png
git commit -m "feat: generate dark animated pipeline GIF and OG share image"
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
  assert.match(readme, /assets\/svg\/logo\.svg/);
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

`README.md` sections: `assets/svg/logo.svg` header image, one-line pitch, `![EDI claims pipeline](assets/pipeline.gif)`, live link, "Design" (Neo Terminal: palette, Syne/Geist/JetBrains Mono, sharp edges), "Motion" (bullet list of animations), "Structure" (file map), "Develop" (`npm install`, `npm run serve`, `npm test`, `npm run images|gif|og`), "Deploy" (GitHub Pages from `main`, root), "Accessibility" (reduced motion, `?motion=off`, keyboard), author links.

Run: `npm test` — Expected: all PASS.

- [ ] **Step 3: Full browser verification** (preview server `portfolio`)

For each state, screenshot hero, pipeline, projects and contact and record findings:
1. Desktop 1440×900, full scroll top→bottom: boot loader once, no layout jumps, pins release cleanly, console has no errors (`read_console_messages onlyErrors`).
2. Mobile 375×812 and 360px width: `document.documentElement.scrollWidth <= innerWidth` via `javascript_tool`; `[menu]` opens/closes, Esc closes, focus returns to the toggle; offline strip swipes; pipeline loops; photos colourise when centred.
3. `?motion=off`: no loader, all content visible, no pin spacers (`document.querySelectorAll('.pin-spacer').length === 0`).
4. Scripts blocked: serve a scratchpad copy of `index.html` with the CDN `<script>` tags removed → content visible after ≤3.5s, no stuck loader.
5. Keyboard pass: skip link → main; Tab through nav, flags, project rows (Enter toggles), form; lime focus rings visible throughout.

Fix anything found (each fix: smallest change + re-run `npm test` + re-check the failing state).

- [ ] **Step 4: Commit**

```bash
git add -A .claude/launch.json README.md tests/site.test.mjs
git commit -m "docs: README with generated media; chore: preview config and legacy image cleanup"
```

- [ ] **Step 5: Final review** — run the whole-branch review per the chosen execution skill; then use superpowers:finishing-a-development-branch.
