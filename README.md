<p align="center"><img src="assets/svg/logo.svg" alt="SACHU" width="300" /></p>

# Sachu S — Portfolio

Personal site of **Sachu S**, Software Engineer & Technical Lead building scalable applications and reliable backend systems — including HIPAA-compliant healthcare data platforms (EDI 835/837, EOB processing) — with Python, Django and FastAPI.

![EDI claims pipeline animation](assets/pipeline.gif)

**Live:** [sachusudevan.github.io/portfolio](https://sachusudevan.github.io/portfolio/)

## Design

- Dark, editorial and minimal, with one restrained crimson accent.
- Palette (CSS custom properties in `css/tokens.css`):

  | Token | Colour | Use |
  | --- | --- | --- |
  | `--c-bg` | Matte Black `#121212` | page background |
  | `--c-surface` | Charcoal Gray `#242424` | cards, panels |
  | `--c-accent` | Crimson Red `#D72638` | buttons, active states, highlights |
  | `--c-text` | Soft White `#F5F5F5` | primary text |
  | `--c-text-2` | Silver Gray `#BFC3C9` | secondary headings |
  | `--c-text-3` | Muted Gray `#8B9098` | descriptions, metadata |

- **Geist** for everything, **Geist Mono** for small metadata.
- The hero is built around the introduction video, used as a full-bleed looping background with sound.

## Motion

- Hero entrance: staggered rise-and-unblur of the intro, headline, copy and buttons (CSS only).
- Scroll reveals via `IntersectionObserver`, triggered once, with staggered skills, timeline entries and project cards.
- Scroll-linked depth: the hero copy lifts and the video eases back as you scroll; subtle parallax on the portrait, glows and project illustrations (desktop only).
- Experience timeline fills as you scroll; the active engineering principle lights up as it crosses the middle of the screen.
- Animated SVG illustrations for each project (EDI pipeline, live dashboard, SLA ring, tiles, waveform, ECG) that only run while on screen.
- Micro-interactions: gliding nav indicator, link underlines, button sheen and arrow nudge, pointer-following glow on project cards, copy-to-clipboard feedback.
- No animation libraries — plain CSS + a few small vanilla scripts. Everything respects `prefers-reduced-motion` (or add `?motion=off` to the URL).

### Intro video

`assets/videos/Software_engineer_portfolio_intro_1080p_20261023093003.mp4` is the full-bleed hero background. It **loops with sound and has no controls**. Browsers refuse audible autoplay until the visitor interacts with the page, so when that happens the video keeps playing muted behind a welcome screen (name, role and an **Enter** button); one click restarts the video from the top with sound and plays the hero entrance. Browsers that allow audible autoplay skip the welcome screen. Escape dismisses it without sound (a *Tap anywhere for sound* note then appears). The video pauses while the hero is scrolled out of view and resumes on return. If the file fails, the poster (`assets/img/hero-poster.webp`, the video's last frame) stays in place.

Layout: on wide desktops (3:2 and wider) the video covers the hero, slid 12% left so the face and the in-video "Welcome to my portfolio" screen stay clear, and the copy overlays the darkened right side; on narrower and portrait screens the video fills the top of the screen and fades into the page, with the copy below so the face is never covered.

The copy is choreographed to the video (`js/hero-sync.js`): the name pill and role appear during the walk-in (0–3.5s), the headline rises word by word at the 3.5s cut and its red line lands at 5s, and the lede and buttons arrive with the push-in on the welcome screen (7.3s+). After the first loop the text stays put and only the accents replay on the cuts. If the video can't start within 2.5s the copy falls back to a timed entrance; with reduced motion it is simply shown.

## Structure

```
index.html            # the whole page (content, inline SVG icons + illustrations)
css/tokens.css        # palette, type scale, spacing, motion tokens
css/base.css          # reset, typography, buttons, nav, mobile menu, reveal system, toast
css/sections.css      # hero → footer layouts and illustration animations
js/lib.js             # pure helpers shared with the tests
js/main.js            # nav state, active-section indicator, scroll progress, mobile menu, in-page links
js/motion.js          # reveals, count-ups, parallax, timeline progress, principles, card glow
js/video.js           # hero video controller
js/work.js            # project filters
js/contact.js         # copy email, toast, live IST clock
assets/videos/        # intro video
assets/img/           # hero poster + optimised photos (WebP + JPEG)
assets/svg/           # logo.svg and pipeline.svg (self-animating)
assets/pipeline.gif   # generated animation for this README
assets/og-image.png   # generated social share card
tools/                # scripts that generate the poster, GIF and share card
tests/                # node:test suites
```

No build step: the site is plain HTML, CSS and JavaScript with no runtime dependencies (fonts from Google Fonts). `index.html` also works when opened straight from disk.

## Develop

```bash
npm install                              # dev tools only (tests, image + GIF generation, local server)
npm run serve                            # http://localhost:5173
npm test                                 # structure, content, helper and media tests
node tools/make-poster.mjs frame.png     # rebuild the hero poster from a 1920×1080 video frame
npm run gif                              # regenerate assets/pipeline.gif
npm run og                               # regenerate assets/og-image.png (uses the hero poster)
```

## Deploy

GitHub Pages → **Settings › Pages** → deploy from the `main` branch, root folder.

## Accessibility

Semantic landmarks and headings, a skip link, visible focus rings, a keyboard-operable mobile menu with focus trap and Escape-to-close, labelled video controls, `aria-pressed` filters with a live result count, and real text behind every animated number. Content stays fully visible if the scripts fail to load.

## Author

**Sachu S** — [LinkedIn](https://linkedin.com/in/sachu-s-705813179) · [GitHub](https://github.com/sachusudevan) · sachusudeve8690@gmail.com
