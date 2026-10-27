/* Hero background video: always plays, loops, with sound and no controls.
   Browsers refuse audible autoplay until the visitor interacts with the page. When that happens the video
   keeps playing muted behind a welcome screen; one click on "Enter" restarts it from the top with sound. */
(function () {
  'use strict';
  var w = window, d = document, root = d.documentElement;
  var media = d.querySelector('[data-hero-video]');
  if (!media) return;
  var video = media.querySelector('video');
  var hint = d.querySelector('[data-sound-hint]');
  var gate = d.querySelector('[data-intro-gate]');
  var gateBtn = gate && gate.querySelector('[data-gate-enter]');
  var outside = [d.getElementById('main'), d.querySelector('.nav'), d.querySelector('.footer')];
  var autoPaused = false;   /* paused because the hero scrolled out of view */
  var failed = false;
  var gateOpen = false;

  video.removeAttribute('controls');
  video.loop = true;
  video.preload = 'auto';

  function showHint(show) { if (hint) hint.hidden = !show || failed; }

  /* ---------- Welcome screen ---------- */
  function openGate() {
    if (!gate || gateOpen || failed) return;
    gateOpen = true;
    gate.hidden = false;
    root.classList.add('gate-open');
    d.body.classList.add('is-locked');
    outside.forEach(function (el) { if (el) el.setAttribute('inert', ''); });
    w.requestAnimationFrame(function () { gate.classList.add('is-visible'); if (gateBtn) gateBtn.focus({ preventScroll: true }); });
  }
  function closeGate() {
    if (!gateOpen) return;
    gateOpen = false;
    root.classList.remove('gate-open');
    d.body.classList.remove('is-locked');
    outside.forEach(function (el) { if (el) el.removeAttribute('inert'); });
    gate.classList.remove('is-visible');
    gate.classList.add('is-leaving');
    w.setTimeout(function () { gate.hidden = true; gate.classList.remove('is-leaving'); }, 700);
    var main = d.getElementById('main');
    if (main) main.focus({ preventScroll: true });
  }

  function start() {
    if (failed) return;
    video.muted = false;
    video.play().then(function () { showHint(false); }).catch(function () {
      /* Audible autoplay refused: keep the video running muted and ask for one click */
      video.muted = true;
      video.play().catch(function () {});
      openGate();
      arm();
    });
  }

  /* The first real interaction turns the sound on (from the top if it came through the welcome screen) */
  var unlockEvents = ['pointerup', 'touchend', 'keydown', 'click'];
  var armed = false;
  function onGesture(e) {
    if (e && e.type === 'keydown') {
      if (e.key === 'Escape') { if (gateOpen) { closeGate(); showHint(true); } return; }
      if (gateOpen && e.key !== 'Enter' && e.key !== ' ') return;
    }
    if (navigator.userActivation && !navigator.userActivation.isActive) return;
    disarm();
    if (gateOpen) { video.currentTime = 0; closeGate(); }
    video.muted = false;
    showHint(false);
    if (video.paused && !autoPaused) video.play().catch(function () {});
  }
  function arm() {
    if (armed) return;
    armed = true;
    unlockEvents.forEach(function (ev) { d.addEventListener(ev, onGesture, { capture: true, passive: true }); });
  }
  function disarm() {
    armed = false;
    unlockEvents.forEach(function (ev) { d.removeEventListener(ev, onGesture, { capture: true }); });
  }
  if (gateBtn) gateBtn.addEventListener('click', function () { if (gateOpen) onGesture(); });

  /* If the browser pauses the video because it rejected the unmute, keep it running muted and re-arm */
  video.addEventListener('pause', function () {
    if (autoPaused || failed || d.hidden) return;
    w.setTimeout(function () {
      if (video.paused && !autoPaused && !d.hidden) {
        video.muted = true;
        video.play().catch(function () {});
        showHint(true);
        arm();
      }
    }, 60);
  });

  /* Failure: leave the poster (also the media background) in place, never trap the visitor */
  function fail() { failed = true; showHint(false); closeGate(); disarm(); }
  video.addEventListener('error', fail);
  var source = video.querySelector('source');
  if (source) source.addEventListener('error', fail);

  /* Pause while the hero is scrolled out of view (so the audio doesn't run under other sections), resume on return */
  if ('IntersectionObserver' in w) {
    new IntersectionObserver(function (entries) {
      var visible = entries[0].isIntersecting;
      if (!visible && !video.paused) { autoPaused = true; video.pause(); }
      else if (visible && autoPaused) { autoPaused = false; video.play().catch(function () {}); }
    }, { threshold: 0.25 }).observe(media);
  }

  /* ---------- Seal pinned to the lower-right corner of the video frame ----------
     The spot is (1740, 900), ~72px wide, in the 1920×1080 frame. Map that point through object-fit: cover
     and object-position to screen pixels; hide the seal when the crop pushes the spot off-screen (portrait). */
  var badge = media.querySelector('[data-wm-badge]');
  var MARK = { x: 1740 / 1920, y: 900 / 1080, size: 104 / 1920 };
  function placeBadge() {
    if (!badge) return;
    var W = video.clientWidth, H = video.clientHeight; /* the stage can be wider than the hero (desktop) */
    var vw = video.videoWidth || 1920, vh = video.videoHeight || 1080;
    var s = Math.max(W / vw, H / vh), rw = vw * s, rh = vh * s;
    var pos = getComputedStyle(video).objectPosition.split(' ').map(function (v) { return parseFloat(v) / 100; });
    var x = (W - rw) * (isNaN(pos[0]) ? 0.5 : pos[0]) + MARK.x * rw;
    var y = (H - rh) * (isNaN(pos[1]) ? 0.5 : pos[1]) + MARK.y * rh;
    var size = Math.max(56, MARK.size * rw);
    var r = (36 / 1920) * rw; /* half the mark's width: show the seal if any part of the mark is visible */
    var stage = video.parentElement, sx = x + stage.offsetLeft, sy = y + stage.offsetTop;
    var onScreen = sx + r > 0 && sx - r < media.clientWidth && sy + r > 0 && sy - r < media.clientHeight;
    badge.style.setProperty('--wm-x', x.toFixed(1) + 'px');
    badge.style.setProperty('--wm-y', y.toFixed(1) + 'px');
    badge.style.setProperty('--wm-size', size.toFixed(1) + 'px');
    badge.classList.toggle('is-placed', onScreen);
  }
  placeBadge();
  video.addEventListener('loadedmetadata', placeBadge);
  if ('ResizeObserver' in w) new ResizeObserver(placeBadge).observe(media);
  else w.addEventListener('resize', placeBadge);

  /* Background tabs often refuse playback: try again once the tab is visible */
  d.addEventListener('visibilitychange', function () {
    if (!d.hidden && video.paused && !autoPaused && !gateOpen) start();
  });

  start();
})();
