import { test } from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import sharp from 'sharp';
import { html, tags, attr, exists, read, cssText, root } from './helpers.mjs';

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
  assert.match(src, /data-count="6" data-suffix="\+"/);
  assert.ok(!/5\+ (yrs|years)/.test(src), 'stale 5+ years');
  assert.match(src, /data-count="20" data-suffix="\+"/);
  assert.match(src, /data-count="100" data-suffix="%"/);
});

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

test('old image folder is gone and README showcases generated media', () => {
  assert.ok(!exists('images'));
  const readme = read('README.md');
  assert.match(readme, /assets\/pipeline\.gif/);
  assert.match(readme, /assets\/svg\/logo\.svg/);
  assert.match(readme, /npm test/);
});

test('keyframe animations avoid full-repaint properties like background-position', () => {
  for (const [, name, body] of cssText().matchAll(/@keyframes\s+([\w-]+)\s*\{([\s\S]*?\})\s*\}/g)) {
    assert.ok(!/background-position/.test(body), `@keyframes ${name} animates background-position`);
  }
});

test('confidential project names never appear in published files', () => {
  const files = ['index.html', 'README.md', 'assets/svg/pipeline.svg', 'tools/pipeline-frames.mjs', 'docs/superpowers/specs/2026-10-11-portfolio-redesign-design.md', 'docs/superpowers/plans/2026-10-11-portfolio-redesign.md'];
  // the name itself is base64-encoded so it never appears in the repo either
  const banned = new RegExp(Buffer.from('eHRyYWN0fHJldmFyY3x6YXBhcmU=', 'base64').toString(), 'i');
  for (const f of files) assert.ok(!banned.test(read(f)), f + ' mentions a confidential project name');
});
