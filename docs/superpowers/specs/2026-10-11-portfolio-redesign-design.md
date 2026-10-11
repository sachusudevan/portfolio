# Portfolio Redesign — "Neo Terminal"

**Date:** 2026-10-11 (revision 2 — visual direction changed from "Editorial × Engineering" to "Neo Terminal")
**Status:** Direction chosen by user; pending spec review
**Branch:** `redesign/editorial-engineering`

## 1. Goal

Rebuild the portfolio of **Sachu S** (Software Engineer / Technical Lead, healthcare EDI & data
pipelines) from scratch as a bold, developer-edgy site: black and lime, sharp edges, huge
uppercase type, terminal motifs. It should feel like the personal site of an engineer who ships —
not a template.

Two assets carry the design:

1. **The engineering story** — healthcare claim files (EOB, 837, self-pay) flowing through the EDI engine
   and emerging as 835 / CSV / TXT, synced into Client Portal. This becomes the signature animation.
2. **Professional photography** — shown monochrome by default (fits the black/lime palette) and
   revealing colour on hover.

Every section has purposeful motion; generated animated SVGs and a GIF are part of the deliverable.

### Success criteria

- Instantly reads as "Neo Terminal": near-black canvas, lime accent, Syne display type, mono UI.
- All existing CV content is preserved (with typo fixes) and easier to scan.
- Motion on every section; signature scroll-driven pipeline animation with a synced terminal log.
- Works on GitHub Pages with no build step; `index.html` also works opened from disk.
- Responsive from 360px to wide desktop; `prefers-reduced-motion` honoured.
- No console errors; content fully visible if CDN scripts fail.

### Non-goals

- No backend (contact uses `mailto:`), no CMS, no framework/bundler, no analytics.
- **No light theme / theme toggle** — the black canvas is the identity (YAGNI).

## 2. Technical approach

Static HTML + CSS + classic `<script defer>` files (not ES modules, so `file://` works).

| Library | Version | Source | Use |
|---|---|---|---|
| GSAP core | 3.13.0 | cdn.jsdelivr.net | Timelines |
| ScrollTrigger | 3.13.0 | jsdelivr | Pinning, scrubbing, reveals |
| SplitText | 3.13.0 | jsdelivr | Line/char heading reveals |
| ScrambleTextPlugin | 3.13.0 | jsdelivr | Decode/scramble effects on headings, nav, labels |
| DrawSVGPlugin | 3.13.0 | jsdelivr | Logo, pipeline and git-graph stroke drawing |
| MotionPathPlugin | 3.13.0 | jsdelivr | Pipeline data packets travelling along wires |
| Lenis | 1.3.23 | cdn.jsdelivr.net | Smooth scroll (synced to ScrollTrigger) |
| Google Fonts | — | fonts.googleapis.com | Syne, Geist, JetBrains Mono |

Icons are hand-written inline SVG (Font Awesome dropped). AOS and Vanilla-Tilt dropped.

### Progressive enhancement contract

- HTML renders fully visible with no JS.
- An inline head script adds `html.motion-ready` (unless reduced motion or `?motion=off`) and
  removes it after 3.5s if `js/main.js` never confirms boot. `main.js` keeps it only when all GSAP
  pieces exist. All "start hidden" CSS states are scoped under `.motion-ready`.
- Reduced motion: no Lenis, no scrub/pin, no marquee, no boot loader, no scramble; pipeline shows
  its final composed state; simple opacity fades allowed.

## 3. File structure

```
index.html
package.json        # private, dev-only deps (sharp, @resvg/resvg-js, gifenc, http-server); npm test
tests/              # node:test suites (lib, site structure, assets, media)
css/
  tokens.css        # colour/type/spacing tokens
  base.css          # reset, typography, grid bg, scanlines, cursor, loader, nav, menu, buttons, toast
  sections.css      # hero → footer section styles + responsive rules + SVG keyframes
js/
  lib.js            # pure helpers (UMD) shared with Node tests
  main.js           # boot: feature detection, Lenis, nav, menu, progress, anchors, boot loader
  motion.js         # generic reveals: hero, split/scramble headings, wipes, parallax, counters, marquee, git graph, strip
  pipeline.js       # signature pinned pipeline timeline + synced terminal log
  work.js           # project filters, accordion rows, hover preview
  cursor.js         # block cursor + magnetic elements
  contact.js        # terminal mailto form, copy-email, toast, live IST clock, year
assets/
  img/              # renamed + optimised photos (.webp + .jpg)
  svg/logo.svg      # standalone self-animating "~/ss_" logo
  svg/pipeline.svg  # standalone self-animating pipeline (README)
  pipeline.gif      # generated GIF of the pipeline (dark)
  og-image.png      # 1200×630 social share image (dark)
  favicon.svg       # lime square with ">_"
tools/
  optimize-images.mjs
  pipeline-frames.mjs  # frame geometry for the GIF
  render-gif.mjs
  render-og.mjs
.claude/launch.json # local static server for preview
README.md           # updated, embeds pipeline.gif
```

Removed: `css/style.css`, `js/script.js`, `images/` (photos are renamed into `assets/img/`).

### Photo mapping

All photos render `filter: grayscale(1) contrast(1.05)` by default and transition to full colour on
hover/focus (desktop) or when scrolled into the centre (mobile).

| Old file | New name | Used in |
|---|---|---|
| `1 (5).jpeg` B&W studio, black suit | `portrait-noir` | Hero |
| `1 (1).jpeg` beige suit, concrete | `portrait-sand` | About (large) |
| `1 (6).jpeg` sage suit, green backdrop | `portrait-sage` | About (inset) |
| `1 (4).jpeg` B&W leaning on wall | `portrait-wall` | Contact |
| `1 (2).jpeg` street, facing camera | `street-coffee` | Offline strip |
| `1 (3).jpeg` street, walking | `street-walk` | Offline strip |

Resized to max 1000px wide, WebP (q≈76) with JPEG fallback via `<picture>`, explicit
`width`/`height`, `loading="lazy"` except the hero.

## 4. Visual system

### Colour tokens (single dark theme)

| Token | Value | Use |
|---|---|---|
| `--bg` | `#0B0B0B` | Page canvas |
| `--bg-2` | `#121212` | Raised panels, terminal windows |
| `--bg-3` | `#1A1A1A` | Hover rows, inputs |
| `--line` | `#2A2A2A` | 1px borders, grid lines |
| `--line-strong` | `#3A3A3A` | Emphasised borders |
| `--text` | `#EDEDED` | Body text |
| `--muted` | `#8A8A8A` | Secondary text, labels |
| `--lime` | `#C6F432` | Accent: fills, highlights, cursor, active states |
| `--lime-dim` | `#9DC21F` | Accent hover / pressed |
| `--on-lime` | `#0B0B0B` | Text on lime |
| `--danger` | `#FF5F56` | Form errors, terminal "red light" |
| `--warn` | `#FFBD2E` | Terminal "amber light" only |

Contrast: `--text` on `--bg` ≈ 16:1; `--muted` on `--bg` ≈ 5.6:1; lime on black ≈ 14:1;
black on lime for buttons.

### Typography

- Display: **Syne** 700/800, uppercase, tight leading (0.9), letter-spacing −0.01em; hero up to
  ~10rem via `clamp()`. Lime used on one key word per headline.
- Body: **Geist** 400/500, 1.0625rem, line-height 1.65, max ~65ch.
- UI / labels / code / nav: **JetBrains Mono** 400/500/700.
- Section labels in code-comment style: `01 // about`, `02 // pipeline`, …

### Shape, texture & details

- `border-radius: 0` everywhere (sharp). Borders 1px `--line`.
- Background: subtle 64px grid of 1px `--line` lines at 35% opacity, fixed; faint animated
  scanline/noise overlay (~4% opacity), disabled for reduced motion.
- Terminal chrome: window bars with three dots (`--danger`, `--warn`, `--lime`) and a mono title.
- Brutalist hover: buttons and cards get a hard offset shadow `6px 6px 0 var(--lime)` and shift
  `-3px -3px`.
- Blinking block caret `▌` after prompts; `[bracketed]` nav labels; `$` / `>` prompt prefixes.
- Selection: lime background, black text.

## 5. Sections

0. **Boot loader** — black screen, mono lines type in one by one:
   `> booting sachu.dev …` / `> loading python django fastapi … ok` /
   `> mounting healthcare/edi … ok` / ASCII progress `[██████████░░] 83%` counting to 100%, then the
   screen splits horizontally (two halves slide up/down) revealing the hero. Session-once
   (`sessionStorage`), skipped for reduced motion / missing GSAP, hard 3s cap.
1. **Nav** — fixed; left: `~/sachu` with blinking caret (links to top); centre: `[work] [about]
   [pipeline] [contact]` — hover scrambles the label and turns it lime; right: live status
   `● online · IST 14:05` and a lime `HIRE ME` button. Hides on scroll down, shows on scroll up;
   gains `--bg` + bottom border after 40px. Mobile (<900px): `[menu]` toggle → full-screen black
   overlay, huge Syne links revealed with stagger; `Esc` closes; focus trapped; `aria-expanded`.
2. **Hero** — headline `CODE THAT SHIPS. TEAMS THAT SCALE.` (lime on "SHIPS."), lines rise in and
   each word briefly scrambles. Prompt line types `$ whoami` → `sachu s — technical lead @ aventus
   informatics`. Right: the B&W studio portrait in a frame with lime corner brackets, scanline
   overlay and a clip-path reveal; hover = RGB-split glitch. Bottom strip: three stat chips
   (`5+ yrs`, `20+ projects`, `edi 835/837`) and CTA buttons `VIEW WORK` (lime) / `GITHUB ↗`
   (outline). Scroll cue: `scroll ↓` with a bouncing caret.
3. **Tape marquee** — two crossing bands rotated ±2°: a lime band with black Syne
   `PYTHON ✳ DJANGO ✳ FASTAPI ✳ POSTGRESQL ✳ REST APIS ✳` and a black band with lime-outline mono
   `HIPAA / EDI 835 / EDI 837 / EOB / FILE PIPELINES / TEAM LEAD /`; speed/direction follow scroll
   velocity.
4. **About** (`01 // about`) — a terminal window titled `README.md`: markdown-flavoured content
   (`# hi, i'm sachu`, bio paragraphs, `- ` bullet strengths), stats as count-up boxes. Photo
   collage (sand large + sage inset) in bracketed frames with `img_001.jpg` captions, differential
   parallax, colour on hover.
5. **Pipeline** (`02 // pipeline`) — the signature section. Desktop: pinned ~250vh, scrubbed GSAP
   timeline drives an inline SVG in lime line-art on black through five steps, while a terminal log
   panel prints the matching line for each step:
   1. **Ingest** — EOB, 837, SELF-PAY files slide in. Log: `[ingest] 3 files received (EOB, 837, SELF-PAY)`
   2. **Split** — files split into indexed pages. Log: `[split] 3 → 12 pages, indexed`
   3. **Validate** — gate draws, checks tick. Log: `[validate] schema ok ✓ 12/12`
   4. **Transform** — wires draw, EDI ENGINE core spins, packets travel. Log: `[transform] engine → canonical model`
   5. **Deliver & sync** — 835/CSV/TXT chips appear, sync line to Client Portal dashboard, bars grow.
      Log: `[deliver] 835 · csv · txt → client-portal ✓ synced`
   Step list on the left highlights the active step (lime). Mobile: no pin; same SVG + log loop
   while visible. Reduced motion: final frame + full log.
6. **Experience** (`03 // experience`) — styled as `git log --graph`: a lime branch graph line
   draws on scroll; each role is a "commit" with a short hash, date range, `feat(aventus): …`
   style subject, then the description. Education is the root commit
   (`init: bsc computer science — university of kerala (cgpa 6.6)`).
7. **Projects** (`04 // projects`) — `ls -la ~/projects` table: columns `perm`, `size`, `date`,
   `name`, `tags`. Filters are CLI flags `--all --healthcare --enterprise --commerce`. Rows expand
   (accordion) to `cat README.md` details + an animated lime line-art SVG cover. Desktop hover: a
   floating terminal-framed preview of the cover follows the cursor. Six projects:
   EDI ENGINE (files), Client Portal (bars), Ticketing & Analytics (SLA ring), School Management (grid),
   VLURB & E-commerce (sound wave), Clinic & Project Management (ECG pulse).
8. **Stack** (`05 // stack`) — bento grid of terminal panes, each titled like a config file
   (`languages.json`, `frameworks.toml`, `databases.yml`, `healthcare.edi`, `tools.sh`,
   `architecture.md`), with `[tag]` chips and a small looping lime icon. Key strengths as a
   `--help` style list.
9. **Offline** (`06 // offline`) — horizontal strip of the two street photos with captions
   `IMG_2031.JPG — coffee.run()` / `IMG_2047.JPG — walk.slow()`, intro card
   `when the terminal is closed…`. Desktop pins and scrolls horizontally; mobile scroll-snap.
10. **Contact** (`07 // contact`) — huge `LET'S BUILD SOMETHING THAT SHIPS.`; `contact.yml` panel
    (`email:`, `phone:`, `location: kerala, in · IST <clock>`, `linkedin:`, `github:`) with a copy
    button; terminal-style form (`> name_`, `> email_`, `> subject_`, `> message_`) validated in
    place, submit `[ SEND ↵ ]` opens a prefilled `mailto:`; B&W wall portrait.
11. **Footer** — giant outline `SACHU S` wordmark (lime stroke fills on hover), mono links, IST
    clock, `© 2026 · built with vanilla js, gsap & caffeine`, `cd ~ ↑` back-to-top.

### Global interactions

- Scroll progress bar (top, 2px lime).
- Custom cursor (fine pointers only): lime block that blinks when idle, becomes an outlined
  crosshair over links, and a `[open]` label over project rows; native cursor kept on form fields.
- Magnetic effect on primary buttons and social links.
- Section headings: split lines rise + scramble decode. Labels scramble on hover.
- Images: clip-path wipe in, grayscale → colour on hover.

## 6. Generated assets

| Asset | How it is made | Where used |
|---|---|---|
| `assets/svg/logo.svg` | Hand-authored SVG: `~/ss` text + blinking lime block caret + bracket strokes drawing on, CSS keyframes inside | README header |
| `assets/favicon.svg` | Static lime square with black `>_` | `<link rel=icon>` |
| `assets/svg/pipeline.svg` | Hand-authored dark SVG with internal CSS keyframes, 8s loop | README |
| 6 project covers | Inline lime line-art SVGs, CSS keyframe loops | Project rows + hover preview |
| `assets/pipeline.gif` | `tools/render-gif.mjs`: per-frame geometry in JS → SVG → `@resvg/resvg-js` → `gifenc` (720×360, 72 frames, 18 fps, dark palette) | README |
| `assets/og-image.png` | `tools/render-og.mjs`: dark card (name in heavy sans, lime accent, prompt line, B&W portrait) → PNG | `og:image` / Twitter card |

Dev dependencies live in the root `package.json` and are never loaded by the site.

## 7. Content changes

- "835/827" → "835/837"; "827" in EDI ENGINE bullets → "837".
- "CCPA: 6.6" → "CGPA 6.6".
- Copy tightened into the terminal voice (lowercase mono labels, uppercase Syne headlines);
  facts unchanged. Phone, email, LinkedIn, GitHub retained.
- `<title>`, meta description, Open Graph and Twitter meta, `theme-color` `#0B0B0B`, JSON-LD
  `Person` schema.

## 8. Accessibility & performance

- Semantic landmarks, one `h1`, ordered headings, skip-link, visible lime `:focus-visible` rings.
- Scrambled text keeps the real text in the DOM / `aria-label`, so screen readers never read noise.
- Decorative SVG `aria-hidden="true"`; the pipeline SVG has `role="img"` + title/desc and the step
  list + log as text equivalents.
- Fonts `display=swap` with preconnect; hero image `fetchpriority="high"`; others lazy.
- Animations use transforms/opacity/clip-path/filter only; ScrollTriggers refreshed on font load.

## 9. Verification

No browser test suite; Node `node:test` covers pure logic, HTML/CSS structure and generated media.
Manual verification via a local static server (`.claude/launch.json`) in the built-in browser:

1. Desktop 1440×900 and mobile 375×812 — screenshot each section.
2. `?motion=off`: everything visible, no pinning, no loader.
3. GSAP blocked: page fully readable, loader never sticks.
4. Console has no errors; no horizontal overflow at 360px.
5. Keyboard: tab through nav, menu, filters, rows, form.
6. Generated files open: `pipeline.gif` animates, `og-image.png` is 1200×630.
