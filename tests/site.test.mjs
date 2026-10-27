import { test } from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import sharp from 'sharp';
import { html, tags, attr, exists, read, cssText, root } from './helpers.mjs';

const src = html();
const isLocal = (u) => u && !/^(https?:|mailto:|tel:|#|data:)/.test(u);
const section = (id) => {
  const m = src.match(new RegExp(`<section id="${id}"[\\s\\S]*?</section>`));
  assert.ok(m, `section #${id} missing`);
  return m[0];
};

test('head has title, description, social, canonical and theme meta', () => {
  assert.match(src, /<title>Sachu S — Software Engineer &amp; Technical Lead<\/title>/);
  for (const re of [/name="description"/, /rel="canonical"/, /property="og:title"/, /property="og:description"/, /property="og:image"/, /property="og:image:alt"/, /name="twitter:card" content="summary_large_image"/, /name="twitter:image"/, /name="theme-color" content="#121212"/]) {
    assert.match(src, re);
  }
  assert.match(src, /<link rel="icon" href="assets\/favicon\.svg" type="image\/svg\+xml"/);
  assert.match(src, /"@type":\s*"Person"/);
});

test('every local src/href/srcset/poster target exists', () => {
  const refs = [];
  for (const t of [...tags(src, 'img'), ...tags(src, 'source'), ...tags(src, 'script'), ...tags(src, 'link'), ...tags(src, 'a'), ...tags(src, 'video')]) {
    for (const name of ['src', 'href', 'poster']) refs.push(attr(t, name));
    const srcset = attr(t, 'srcset');
    if (srcset) srcset.split(',').forEach((s) => refs.push(s.trim().split(/\s+/)[0]));
  }
  for (const ref of refs.filter(isLocal)) assert.ok(exists(decodeURI(ref.split('?')[0])), `missing ${ref}`);
  for (const [, url] of cssText().matchAll(/url\("?\.\.\/([^")]+)"?\)/g)) assert.ok(exists(url), `css references missing ${url}`);
});

test('every in-page anchor and <use> points to an existing id', () => {
  const ids = new Set([...src.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
  for (const t of tags(src, 'a')) {
    const href = attr(t, 'href');
    if (href && href.startsWith('#') && href.length > 1) assert.ok(ids.has(href.slice(1)), `no id for ${href}`);
  }
  for (const t of tags(src, 'use')) assert.ok(ids.has(attr(t, 'href').slice(1)), `no symbol for ${attr(t, 'href')}`);
  for (const t of tags(src, '[a-z]+').filter((x) => /aria-(controls|labelledby)=/.test(x))) {
    for (const name of ['aria-controls', 'aria-labelledby']) {
      const v = attr(t, name);
      if (v) v.split(' ').forEach((id) => assert.ok(ids.has(id), `${name} → missing #${id}`));
    }
  }
});

test('ids are unique', () => {
  const ids = [...src.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
  assert.deepEqual(ids.filter((id, i) => ids.indexOf(id) !== i), []);
});

test('no third-party scripts: only local, classic, deferred scripts', () => {
  for (const t of tags(src, 'script').filter((x) => /\ssrc=/.test(x))) {
    assert.ok(!/type="module"/.test(t), 'module script found');
    assert.ok(isLocal(attr(t, 'src')), `external script ${attr(t, 'src')}`);
    assert.match(t, /\sdefer\b/);
    assert.ok(exists(attr(t, 'src')), `missing ${attr(t, 'src')}`);
  }
  assert.ok(!/gsap|lenis/i.test(src), 'legacy animation libraries still referenced');
});

test('head boot script sets js/motion classes with a safety timeout', () => {
  const head = src.slice(0, src.indexOf('</head>'));
  assert.match(head, /classList\.add\('js'\)/);
  assert.match(head, /prefers-reduced-motion/);
  assert.match(head, /motion=off/);
  assert.match(head, /__portfolioBooted/);
  assert.match(head, /setTimeout\(/);
});

test('hidden reveal/entrance states only apply under .motion', () => {
  const hiding = /opacity:\s*0(?![.\d])|visibility:\s*hidden/;
  for (const [, selectors, body] of cssText().replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    if (!hiding.test(body)) continue;
    for (const sel of selectors.split(',')) {
      if (/\.reveal|\[data-enter/.test(sel)) assert.ok(sel.trim().startsWith('.motion'), `unscoped: ${sel.trim()}`);
    }
  }
});

test('design tokens use the specified palette as custom properties', () => {
  const tokens = read('css/tokens.css');
  const palette = { '--c-bg': '#121212', '--c-surface': '#242424', '--c-accent': '#D72638', '--c-text': '#F5F5F5', '--c-text-2': '#BFC3C9', '--c-text-3': '#8B9098' };
  for (const [name, hex] of Object.entries(palette)) assert.match(tokens, new RegExp(`${name}:\\s*${hex};`), `${name} should be ${hex}`);
  assert.ok(!/#C6F432|lime/i.test(src + cssText()), 'old lime accent still present');
});

test('reduced motion is respected for page animations (the hero video always plays by design)', () => {
  assert.match(read('css/base.css'), /@media \(prefers-reduced-motion: reduce\)/);
});

test('nav: SACHU wordmark, six section links, accessible mobile menu', () => {
  assert.match(src, /class="wordmark"[^>]*>SACHU</);
  const links = [...src.matchAll(/data-nav-link="(\w+)"/g)].map((m) => m[1]);
  assert.deepEqual(links, ['home', 'about', 'skills', 'experience', 'projects', 'contact']);
  for (const id of links) assert.match(src, new RegExp(`<section id="${id}"[^>]*data-nav-section="${id}"`));
  assert.match(src, /class="nav__toggle"[^>]*aria-controls="mobile-menu"[^>]*aria-expanded="false"/);
  assert.match(src, /<div id="mobile-menu" class="mobile-menu" inert>/);
  assert.match(src, /class="skip-link" href="#main"/);
});

test('exactly one h1, inside the hero, with the specified headline', () => {
  assert.equal((src.match(/<h1\b/g) || []).length, 1);
  const hero = section('home');
  assert.match(hero, /<h1\b[\s\S]*Building Scalable Software\.[\s\S]*Solving Complex Problems\.[\s\S]*<\/h1>/);
  assert.match(hero, /<strong>Sachu<\/strong>/);
  assert.match(hero, /Software Engineer &amp; Technical Lead/);
  assert.match(hero, /I build reliable applications and backend systems with a focus on clean architecture, performance, and practical engineering solutions\./);
  assert.match(hero, /href="#projects">Explore My Work/);
  assert.match(hero, /href="#contact">Get In Touch/);
  assert.match(hero, /class="scroll-cue"/);
});

test('hero video: existing file, looping full-bleed background, inline, poster, sound with gesture fallback', async () => {
  const hero = section('home');
  const video = tags(hero, 'video')[0];
  assert.ok(video, 'hero video missing');
  for (const a of [/\smuted\b/, /\sloop\b/, /\splaysinline\b/, /preload="metadata"/, /poster="assets\/img\/hero-poster\.webp"/, /aria-label="[^"]+"/]) assert.match(video, a);
  assert.ok(!/\sautoplay\b/.test(video), 'autoplay is handled in JS so reduced-motion/data-saver can opt out');
  assert.match(cssText(), /\.hero__media \{\s*position: absolute;\s*inset: 0 0 auto;/, 'video is positioned as the hero background');
  const source = attr(tags(hero, 'source')[0], 'src');
  assert.equal(source, 'assets/videos/Software_engineer_portfolio_intro_1080p_20261027204659.mp4');
  assert.ok(exists(source));
  assert.equal((src.match(/<video\b/g) || []).length, 1, 'only one intro video');
  const meta = await sharp(join(root, 'assets/img/hero-poster.webp')).metadata();
  assert.ok(Math.abs(meta.width / meta.height - 16 / 9) < 0.01, 'poster keeps the video aspect ratio');
  const js = read('js/video.js');
  assert.match(js, /video\.loop = true/);
  assert.match(js, /video\.removeAttribute\('controls'\)/);
  assert.match(js, /video\.muted = false;\s*video\.play\(\)/, 'always tries to start with sound');
  assert.match(js, /pointerup', 'touchend', 'keydown', 'click'/, 'turns sound on at the first interaction when autoplay audio is refused');
  assert.ok(!/<button[^>]*(data-video-toggle|data-video-sound)|class="hero__play"/.test(hero), 'no play/pause or mute controls');
  assert.match(hero, /data-sound-hint hidden/);
  // welcome screen: hidden by default (never blocks the page without JS), opened only when audible autoplay is refused
  assert.match(src, /<div class="intro-gate" data-intro-gate role="dialog" aria-modal="true" aria-labelledby="gate-title" hidden>/);
  assert.match(src, /<button class="intro-gate__play" type="button" data-gate-enter>/);
  assert.match(src, /Watch my intro/);
  assert.ok(!/>\s*Enter\s*</.test(src), 'old Enter label removed');
  assert.ok(!/10-second/i.test(src), 'no intro-length text');
  // animated seal pinned over the corner mark in the video frames
  assert.match(hero, /<div class="hero__stage">[\s\S]*<video[\s\S]*data-wm-badge[\s\S]*<\/div>/, 'seal shares the video stage');
  assert.match(js, /MARK = \{ x: 1740 \/ 1920, y: 900 \/ 1080/);
  assert.match(js, /new ResizeObserver\(placeBadge\)/);
  assert.match(js, /openGate\(\);/);
  assert.match(js, /video\.currentTime = 0; closeGate\(\);/, 'entering restarts the video from the top with sound');
  assert.match(js, /e\.key === 'Escape'/, 'Escape always dismisses the welcome screen');
});

test('images have alt, width, height, matching aspect and lazy-loading', async () => {
  for (const t of tags(src, 'img')) {
    assert.ok(attr(t, 'alt') !== null, `alt missing: ${t}`);
    const w = Number(attr(t, 'width')), h = Number(attr(t, 'height'));
    assert.ok(w > 0 && h > 0, `size missing: ${t}`);
    const meta = await sharp(join(root, attr(t, 'src'))).metadata();
    assert.ok(Math.abs(w / h - meta.width / meta.height) < 0.01, `aspect mismatch: ${attr(t, 'src')}`);
    assert.match(t, /loading="lazy"/);
  }
});

test('about carries the verified stats', () => {
  const about = section('about');
  assert.match(about, /data-count="6"/);
  assert.match(about, /data-count="20"/);
  assert.match(about, /data-count="100"/);
  assert.ok(!/5\+ (yrs|years)/.test(src), 'stale 5+ years');
});

test('skills are grouped labels without percentages and include the core stack', () => {
  const skills = section('skills');
  assert.ok(!/\d+%/.test(skills), 'no proficiency percentages');
  for (const t of ['Python', 'Django', 'FastAPI', 'PostgreSQL', 'Redis', 'Celery', 'AWS', 'Docker', 'Git', 'REST APIs']) {
    assert.match(skills, new RegExp(`<li[^>]*>${t}</li>`), `missing ${t}`);
  }
  assert.equal((skills.match(/class="skill-group reveal"/g) || []).length, 6);
});

test('experience lists verified roles in a timeline', () => {
  const exp = section('experience');
  assert.match(exp, /data-timeline/);
  assert.match(exp, /Aventus Informatics/);
  assert.match(exp, /Mobatia Technology Pvt Ltd/);
  assert.match(exp, /Dec 2019/);
  assert.match(exp, /CGPA 6\.6/);
  assert.equal((exp.match(/class="timeline__item\b/g) || []).length, 3);
});

test('projects: six cards, valid filter categories, no fake links', () => {
  const projects = section('projects');
  const filters = [...projects.matchAll(/data-filter="([^"]+)"/g)].map((m) => m[1]);
  assert.deepEqual(filters, ['all', 'healthcare', 'enterprise', 'commerce']);
  const cards = [...projects.matchAll(/<article class="project\b[^"]*"[^>]*data-category="([^"]+)"/g)];
  assert.equal(cards.length, 6);
  for (const [, cats] of cards) for (const c of cats.split(' ')) assert.ok(filters.includes(c), `unknown category ${c}`);
  const hrefs = tags(projects, 'a').map((t) => attr(t, 'href'));
  assert.deepEqual(hrefs, ['https://github.com/sachusudevan'], 'only verified links in projects');
  assert.match(projects, /aria-live="polite"/);
});

test('engineering approach has five principles', () => {
  const approach = section('approach');
  assert.equal((approach.match(/class="principle reveal"/g) || []).length, 5);
});

test('confidential project names never appear in published files', () => {
  const files = ['index.html', 'README.md', 'assets/svg/pipeline.svg', 'tools/pipeline-frames.mjs', 'docs/superpowers/specs/2026-10-11-portfolio-redesign-design.md', 'docs/superpowers/plans/2026-10-11-portfolio-redesign.md'];
  // the name itself is base64-encoded so it never appears in the repo either
  const banned = new RegExp(Buffer.from('eHRyYWN0fHJldmFyY3x6YXBhcmU=', 'base64').toString(), 'i');
  for (const f of files) assert.ok(!banned.test(read(f)), f + ' mentions a confidential project name');
});

test('site does not advertise job-seeking status', () => {
  assert.ok(!/open to (new )?(opportunities|work)|hire me|looking for (new )?(opportunities|a job)/i.test(src), 'job-seeking wording found');
});

test('contact: verified details, copy button, WhatsApp with prefilled enquiry, no form', () => {
  const contact = section('contact');
  assert.ok(!/<form\b|<input\b|<textarea\b/.test(contact), 'contact section must not collect visitor details');
  assert.match(contact, /href="mailto:sachusudeve8690@gmail\.com"/);
  assert.match(contact, /data-copy="sachusudeve8690@gmail\.com"/);
  assert.match(contact, /href="tel:\+918157864536"/);
  assert.match(contact, /href="https:\/\/linkedin\.com\/in\/sachu-s-705813179"/);
  assert.match(contact, /href="https:\/\/github\.com\/sachusudevan"/);
  assert.match(contact, /data-clock/);
  const cta = contact.match(/<a class="[^"]*\bwa-cta\b[^"]*"[^>]*>/);
  assert.ok(cta, 'WhatsApp connect button missing');
  const href = attr(cta[0], 'href').replace(/&amp;/g, '&');
  assert.ok(href.startsWith('https://wa.me/918157864536?text='), href);
  assert.match(new URLSearchParams(href.split('?')[1]).get('text'), /^Hi Sachu, I came across your portfolio/);
  assert.equal(attr(cta[0], 'target'), '_blank');
  assert.match(attr(cta[0], 'rel'), /noopener/);
  assert.match(attr(cta[0], 'aria-label'), /WhatsApp/);
  assert.ok(!/came across your portfolio/.test(contact.replace(/href="[^"]*"/g, '')), 'message preview is shown on the page');
});

test('external links opening a new tab use rel=noopener', () => {
  for (const t of tags(src, 'a').filter((x) => /target="_blank"/.test(x))) assert.match(attr(t, 'rel') || '', /noopener/, t);
});

test('footer has wordmark, dynamic year, social links and back-to-top', () => {
  const footer = src.match(/<footer class="footer">[\s\S]*?<\/footer>/)[0];
  assert.match(footer, /class="wordmark"/);
  assert.match(footer, /data-year/);
  assert.match(footer, /data-back-to-top/);
  assert.match(footer, /github\.com\/sachusudevan/);
  assert.match(footer, /linkedin\.com\/in\/sachu-s-705813179/);
});

test('keyframe animations avoid full-repaint properties like background-position', () => {
  for (const [, name, body] of cssText().matchAll(/@keyframes\s+([\w-]+)\s*\{([\s\S]*?\})\s*\}/g)) {
    assert.ok(!/background-position|width:|height:|top:|left:/.test(body), `@keyframes ${name} animates a layout/repaint-heavy property`);
  }
});

test('README documents the design and commands', () => {
  const readme = read('README.md');
  assert.match(readme, /assets\/pipeline\.gif/);
  assert.match(readme, /assets\/svg\/logo\.svg/);
  assert.match(readme, /npm test/);
  assert.match(readme, /#D72638/);
});
