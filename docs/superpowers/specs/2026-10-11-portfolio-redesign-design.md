# Portfolio Redesign — "Editorial × Engineering"

**Date:** 2026-10-11
**Status:** Approved design, pending spec review
**Branch:** `redesign/editorial-engineering`

## 1. Goal

Rebuild the portfolio of **Sachu S** (Software Engineer / Technical Lead, healthcare EDI & data
pipelines) from scratch so it reads as a personal brand rather than a template. The design is built
around two assets the current site under-uses:

1. **Editorial-quality photography** — six portraits (sage suit on green, beige suit on concrete,
   two B&W studio shots, two street shots).
2. **A distinctive engineering story** — healthcare claim files (EOB, 837, self-pay) flowing through
   EDI ENGINE and emerging as 835 / CSV / TXT, synced into Client Portal.

Every section has purposeful motion; generated animated SVGs and a GIF are part of the deliverable.

### Success criteria

- Looks and feels like a magazine spread about an engineer, not a dark-neon template.
- All existing CV content is preserved (with typo fixes) and easier to scan.
- Motion on every section; signature scroll-driven pipeline animation.
- Works on GitHub Pages with no build step; `index.html` also works opened from disk.
- Responsive from 360px to wide desktop; light + dark themes; `prefers-reduced-motion` honoured.
- No console errors; content fully visible if CDN scripts fail.

### Non-goals

- No backend (contact uses `mailto:`), no CMS, no framework/bundler, no analytics.

## 2. Technical approach

Static HTML + CSS + classic `<script defer>` files (not ES modules, so `file://` works).

| Library | Version | Source | Use |
|---|---|---|---|
| GSAP core | 3.13.0 | cdn.jsdelivr.net | Timelines |
| ScrollTrigger | 3.13.0 | jsdelivr | Pinning, scrubbing, reveals |
| SplitText | 3.13.0 | jsdelivr | Line/char heading reveals |
| DrawSVGPlugin | 3.13.0 | jsdelivr | Monogram + pipeline stroke drawing |
| Lenis | 1.3.23 | cdn.jsdelivr.net | Smooth scroll (synced to ScrollTrigger) |
| Google Fonts | — | fonts.googleapis.com | Fraunces, Inter, JetBrains Mono |

Icons are hand-written inline SVG (Font Awesome is dropped). AOS and Vanilla-Tilt are dropped.

### Progressive enhancement contract

- HTML renders fully visible with no JS.
- `js/main.js` adds `html.motion-ready` only when `window.gsap` and `ScrollTrigger` exist **and**
  reduced motion is off. All "start hidden" CSS states are scoped under `.motion-ready`.
- Reduced motion: no Lenis, no scrub/pin, no marquee, loader skipped; pipeline shows its final
  composed state; simple opacity fades allowed.

## 3. File structure

```
index.html
css/
  tokens.css        # colour/type/spacing tokens, light + dark themes
  base.css          # reset, typography, utilities, grain, cursor, loader, nav
  sections.css      # hero → footer section styles + responsive rules
js/
  main.js           # boot: feature detection, Lenis, theme, nav, loader orchestration
  motion.js         # generic reveals: split headings, image wipes, counters, marquee, timeline
  pipeline.js       # signature pinned pipeline timeline
  work.js           # project filters, hover preview, accordion
  cursor.js         # custom cursor + magnetic buttons (fine pointers only)
  contact.js        # mailto form, copy-email, live IST clock
assets/
  img/              # renamed + optimised photos (.webp + .jpg fallback)
  svg/monogram.svg  # standalone self-animating SS monogram
  svg/pipeline.svg  # standalone self-animating pipeline (README)
  pipeline.gif      # generated GIF of the pipeline
  og-image.png      # 1200×630 social share image
  favicon.svg
tools/
  package.json      # dev-only deps: sharp, @resvg/resvg-js, gifenc
  optimize-images.mjs
  render-gif.mjs    # draws pipeline frames → GIF
  render-og.mjs     # SVG → og-image.png
.claude/launch.json # local static server for preview
README.md           # updated, embeds pipeline.gif
```

Removed: `css/style.css`, `js/script.js`, `images/hero_bg.png`, `images/hero_bg_v2.png`,
`images/profile/*` (moved/renamed into `assets/img/`).

### Photo mapping

| Old file | New name | Used in |
|---|---|---|
| `1 (6).jpeg` sage suit, green backdrop | `portrait-sage` | Hero |
| `1 (1).jpeg` beige suit, concrete | `portrait-sand` | About (large) |
| `1 (5).jpeg` B&W studio seated | `portrait-noir` | About (inset) |
| `1 (4).jpeg` B&W leaning on wall | `portrait-wall` | Contact |
| `1 (2).jpeg` street, facing camera | `street-coffee` | Beyond the code |
| `1 (3).jpeg` street, walking | `street-walk` | Beyond the code |

Photos are resized (max 1600px long edge), exported as WebP (q≈80) with JPEG fallback via
`<picture>`, with explicit `width`/`height`, `loading="lazy"` except the hero.

## 4. Visual system

### Colour tokens

| Token | Light | Dark |
|---|---|---|
| `--paper` (bg) | `#F4F1EA` | `#0F120F` |
| `--paper-2` (raised) | `#EAE5DA` | `#171B17` |
| `--ink` (text) | `#141614` | `#ECE8DF` |
| `--ink-soft` (muted) | `#5B605A` | `#A3A89F` |
| `--sage` (accent) | `#6E8F72` | `#8FB393` |
| `--moss` (deep accent) | `#2F4A3A` | `#C9DCC8` |
| `--sand` (highlight) | `#C8A97E` | `#D6BA8F` |
| `--rule` (hairlines) | `rgb(20 22 20 / .14)` | `rgb(236 232 223 / .14)` |

Theme: defaults to system preference; toggle persists in `localStorage`
(try/catch). Toggle uses the View Transitions API for a circular reveal from the button, falling
back to an instant swap.

### Typography

- Display: **Fraunces** (variable, opsz + SOFT axes; italic used for accent words), sizes via
  `clamp()` up to ~9rem for hero.
- Body: **Inter** 400/500/600, 1.0625rem, line-height 1.65, max ~65ch.
- Labels/meta/code: **JetBrains Mono** 400/500, uppercase, letter-spaced, small.
- Section labels: `01 — About`, `02 — Pipeline`, … in mono.

### Texture & details

- Animated film grain: fixed full-screen SVG `feTurbulence` overlay at ~6% opacity, stepped
  `background-position` animation (disabled for reduced motion).
- Hairline rules, generous whitespace, 12-column grid, max content width 1320px.
- Arched photo frames (`border-radius: 999px 999px 0 0`) for the hero portrait.

## 5. Sections

0. **Loader** — paper screen; SS monogram strokes draw on (DrawSVG, ~1s), counter 0→100 in mono,
   then curtain slides up revealing hero. Session-once (`sessionStorage`), skipped when reduced
   motion or when GSAP is unavailable. Hard timeout 3s so it can never block.
1. **Nav** — fixed; monogram logo, links (Work, About, Pipeline, Contact), theme toggle, "Let's talk"
   pill. Hides on scroll down / shows on scroll up; gains a blurred paper background after 40px.
   Mobile (<900px): burger → full-screen overlay, links reveal with stagger; `Esc` closes;
   focus trapped while open; `aria-expanded` maintained.
2. **Hero** — headline *"Engineering calm systems for messy healthcare data."* (italic accent on
   *calm*), SplitText line reveal. Sage portrait in arched frame: clip-path wipe in, slow parallax.
   Meta strip: `Technical Lead · Aventus Informatics · Kerala, IN` + pulsing "Open to opportunities"
   dot. Rotating circular SVG text badge ("Python · Django · FastAPI ·") around a down-arrow as
   scroll cue. CTA buttons: "See the work" / "Get in touch".
3. **Marquee** — two counter-scrolling rows of skills in large Fraunces italic and mono; speed and
   direction respond to scroll velocity.
4. **About** (`01 — About`) — pull quote, 3 short bio paragraphs, photo collage
   (sand large + noir inset) with differential parallax, and three count-up stats:
   **5+** years experience · **20+** projects delivered · **100%** client satisfaction.
5. **Pipeline** (`02 — How I build`) — the signature section. Desktop: section pinned for ~250vh;
   a scrubbed GSAP timeline animates an inline SVG through five steps, with a step list on the
   left whose active item updates:
   1. **Ingest** — EOB, 837 and Self-Pay document icons slide in from the left.
   2. **Split** — a large batch file splits into smaller page files (file-splitting engine).
   3. **Validate** — each file passes an index/schema gate; check marks draw on.
   4. **Transform** — files enter the EDI ENGINE core (rotating gear/ring), packets travel along
      DrawSVG paths.
   5. **Deliver & Sync** — outputs 835 / CSV / TXT appear; a sync line draws to a Client Portal
      dashboard card whose bars grow.
   Mobile (<900px): no pin; the same SVG plays as an autoplaying looped timeline when in view.
   Reduced motion: static final frame.
6. **Experience** (`03 — Experience`) — vertical timeline; centre/left line draws via scrub;
   entries: Aventus Informatics — Software Engineer (Lead / Technical Head), 2022–Present;
   Mobatia Technology Pvt Ltd — Software Engineer, Dec 2019–2022; Education — BSc Computer
   Science, University of Kerala, CGPA 6.6.
7. **Selected Work** (`04 — Selected work`) — filter chips (All / Healthcare / Enterprise /
   Commerce & Social); numbered rows 01–06 with title, tags, category. Hover (fine pointer): a
   floating card follows the cursor showing that project's animated SVG cover. Click/Enter: row
   expands (accordion, `aria-expanded`) showing bullet details. Filtering animates rows out/in.
   Projects:
   1. EDI ENGINE — EDI Processing Platform (healthcare) — cover: stacked files
   2. Client Portal — Client Operations System (healthcare) — cover: dashboard bars
   3. Enterprise Ticketing & Analytics (enterprise) — cover: SLA progress ring
   4. School Management Systems (enterprise) — cover: grid of tiles
   5. VLURB & E-commerce (commerce) — cover: sound wave
   6. Project Management & Clinic CMS (healthcare) — cover: ECG pulse line
8. **Toolkit** (`05 — Toolkit`) — bento grid of six cards: Languages, Frameworks, Databases,
   Healthcare & EDI, Tools & Platforms, Architecture. Each has a small looping SVG icon; tags
   stagger in. Key strengths listed as a hairline-separated list.
9. **Beyond the code** (`06 — Off the clock`) — horizontal strip of the two street photos plus a
   caption card; desktop pins and scrolls horizontally; mobile uses native horizontal
   scroll-snap.
10. **Contact** (`07 — Contact`) — huge headline "Let's build something *reliable*.", B&W wall
    portrait, magnetic primary button, contact list (email with copy-to-clipboard + toast, phone,
    location, LinkedIn, GitHub), form (name, email, subject, message) that validates and opens a
    `mailto:` with prefilled subject/body.
11. **Footer** — monogram, nav repeat, live Kerala time (`Asia/Kolkata`, updates every second),
    © year, back-to-top.

### Global interactions

- Scroll progress bar (top, sage).
- Custom cursor (dot + ring, `mix-blend-mode: difference`) only for `(pointer: fine)`; grows on
  links, shows "View" label on work rows. Native cursor stays available (no `cursor: none` on
  form fields).
- Magnetic effect on primary buttons and social icons.
- Section headings: SplitText chars/lines rise in on scroll; images: clip-path wipe.

## 6. Generated assets

| Asset | How it is made | Where used |
|---|---|---|
| `assets/svg/monogram.svg` | Hand-authored SVG, CSS `stroke-dashoffset` keyframes inside the file | Favicon basis, README |
| `assets/favicon.svg` | Static SS monogram, sage on paper | `<link rel=icon>` |
| `assets/svg/pipeline.svg` | Hand-authored SVG with internal CSS keyframes, loops 8s | README, fallback |
| 6 project covers | Inline SVG in `index.html`, CSS keyframe loops, colours via tokens | Work hover card + expanded row |
| `assets/pipeline.gif` | `tools/render-gif.mjs`: computes each frame's geometry in JS, renders SVG → RGBA via `@resvg/resvg-js`, encodes with `gifenc` (≈ 720×360, 60 frames, 15 fps) | README |
| `assets/og-image.png` | `tools/render-og.mjs`: SVG card (name, title, monogram, sage) → PNG via resvg | `og:image` / Twitter card |

`tools/` dependencies are dev-only and never loaded by the site.

## 7. Content changes

- "835/827" → "835/837"; "827" in EDI ENGINE bullets → "837".
- "CCPA: 6.6" → "CGPA: 6.6".
- Copy tightened; facts unchanged. Phone, email, LinkedIn, GitHub retained.
- `<title>`, meta description, Open Graph and Twitter meta, `theme-color` per scheme, JSON-LD
  `Person` schema.

## 8. Accessibility & performance

- Semantic landmarks, one `h1`, ordered headings, skip-link, visible `:focus-visible` rings.
- All decorative SVG `aria-hidden="true"`; meaningful SVG (pipeline) has `role="img"` + title/desc
  and a text step list equivalent.
- Colour contrast ≥ 4.5:1 for body text in both themes (sage used for accents, not body text).
- Fonts `display=swap` with preconnect; hero image `fetchpriority="high"`; others lazy.
- Animations use transforms/opacity/clip-path only; ScrollTriggers refreshed on font load and
  resize.

## 9. Verification

No automated test suite (static site). Verification is manual, via a local static server
(`npx http-server` configured in `.claude/launch.json`) driven in the built-in browser:

1. Desktop 1440×900 and mobile 375×812, light and dark — screenshot each section.
2. Reduced-motion emulation: everything visible, no pinning.
3. GSAP blocked (simulate by removing scripts): page fully readable.
4. Console has no errors; no horizontal overflow at 360px.
5. Keyboard: tab through nav, menu, filters, accordion, form.
6. Generated files exist and open: `pipeline.gif` animates, `og-image.png` is 1200×630.
