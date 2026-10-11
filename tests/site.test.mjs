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
