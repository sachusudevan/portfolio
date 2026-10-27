/* Hero copy choreographed to the intro video.
   Beats in the video (one continuous shot): 0–2.4s walking into the studio · 2.6–5s facing the camera, saying
   hello · 5.4s turns to the code on the monitor · ~8s his name and role type on lower-left · 9.5s fade to black.
   Each [data-cue] element appears when the video reaches its time on the
   first play-through; on later loops the text stays put and only the accents replay at the cuts.
   If the video never starts (error, blocked, slow), everything falls back to a timed entrance. */
(function () {
  'use strict';
  var w = window, d = document, root = d.documentElement;
  var hero = d.querySelector('.hero');
  var media = d.querySelector('[data-hero-video]');
  var copy = d.querySelector('[data-hero-sync]');
  if (!hero || !media || !copy) return;
  var video = media.querySelector('video');

  /* Headline lines rise word by word */
  copy.querySelectorAll('[data-words]').forEach(function (line) {
    var words = line.textContent.trim().split(/\s+/);
    line.textContent = '';
    words.forEach(function (word, i) {
      if (i) line.appendChild(d.createTextNode(' '));
      var span = d.createElement('span');
      span.className = 'w';
      span.style.setProperty('--wi', i);
      span.textContent = word;
      line.appendChild(span);
    });
  });

  var cues = Array.prototype.slice.call(copy.querySelectorAll('[data-cue]')).map(function (el) {
    return { el: el, t: parseFloat(el.getAttribute('data-cue')) || 0, done: false };
  });
  function reveal(c) { if (!c.done) { c.done = true; c.el.classList.add('is-cued'); } }
  function revealAll() { cues.forEach(reveal); }

  if (!root.classList.contains('motion') || !video) { revealAll(); return; }

  /* ---------- Fallback: no playback within a moment → timed entrance instead of sync ---------- */
  var synced = false;
  var fallbackTimer = w.setTimeout(function () {
    if (synced) return;
    hero.classList.add('is-unsynced');
    revealAll();
  }, 2500);
  function giveUp() { w.clearTimeout(fallbackTimer); hero.classList.add('is-unsynced'); revealAll(); }
  video.addEventListener('error', giveUp);
  /* Buffering for long mid-intro: don't leave the copy half-shown */
  var waitTimer = null;
  video.addEventListener('waiting', function () { w.clearTimeout(waitTimer); waitTimer = w.setTimeout(function () { if (firstPass) revealAll(); }, 2500); });
  video.addEventListener('playing', function () { w.clearTimeout(waitTimer); });
  var source = video.querySelector('source');
  if (source) source.addEventListener('error', giveUp);

  /* ---------- Per-frame sync ---------- */
  var firstPass = true, lastT = 0;
  function beat(el) {
    el.classList.remove('is-beat');
    void el.offsetWidth; /* restart the CSS animation */
    el.classList.add('is-beat');
  }
  function settle() {
    firstPass = false;
    revealAll();
    hero.classList.add('is-settled');
  }
  function frame() {
    var t = video.currentTime;
    /* While the welcome gate covers the page, hold the copy: "Watch my intro" restarts the video from 0 */
    if (root.classList.contains('gate-open')) { lastT = 0; return; }
    var looped = t < lastT - 1;
    if (looped && firstPass) settle();
    if (firstPass) {
      cues.forEach(function (c) { if (t >= c.t) reveal(c); });
    } else {
      cues.forEach(function (c) {
        if (c.el.hasAttribute('data-words') && (looped ? t >= c.t : lastT < c.t && t >= c.t)) beat(c.el);
      });
    }
    lastT = t;
  }

  var running = false;
  function loop() {
    if (!running) return;
    frame();
    w.requestAnimationFrame(loop);
  }
  video.addEventListener('playing', function () {
    if (!synced) {
      synced = true;
      w.clearTimeout(fallbackTimer);
      hero.classList.add('is-synced');
    }
    if (!running) { running = true; w.requestAnimationFrame(loop); }
  });
  ['pause', 'ended', 'waiting'].forEach(function (ev) { video.addEventListener(ev, function () { running = false; frame(); }); });
  video.addEventListener('seeked', frame);
  video.addEventListener('timeupdate', frame); /* backup driver when animation frames are throttled */
})();
