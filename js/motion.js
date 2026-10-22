/* Motion layer: scroll reveals, in-view toggles, count-ups, parallax, timeline progress, principle focus, card glow. */
(function () {
  'use strict';
  var w = window, d = document, root = d.documentElement;
  var lib = w.PortfolioLib;
  var motion = root.classList.contains('motion');
  var hasIO = 'IntersectionObserver' in w;

  /* ---------- Reveal once ---------- */
  var reveals = d.querySelectorAll('.reveal');
  if (motion && hasIO) {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('is-in');
        revealObserver.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    reveals.forEach(function (el) { revealObserver.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ---------- In-view toggle: looping illustrations only run while visible ---------- */
  var loopers = d.querySelectorAll('.project, .marquee, .approach__art, .contact');
  if (hasIO) {
    var viewObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { e.target.classList.toggle('in-view', e.isIntersecting); });
    }, { rootMargin: '10% 0px' });
    loopers.forEach(function (el) { viewObserver.observe(el); });
  }

  /* ---------- Count-up numbers (real value is already in the markup) ---------- */
  var counters = d.querySelectorAll('[data-count]');
  function countUp(el) {
    var target = Number(el.getAttribute('data-count'));
    var start = null, duration = 1600;
    function step(ts) {
      if (start === null) start = ts;
      var t = Math.min(1, (ts - start) / duration);
      el.textContent = String(Math.round(target * lib.easeOutExpo(t)));
      if (t < 1) w.requestAnimationFrame(step);
    }
    w.requestAnimationFrame(step);
  }
  if (motion && hasIO) {
    var countObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        countUp(e.target);
        countObserver.unobserve(e.target);
      });
    }, { threshold: 0.6 });
    counters.forEach(function (el) { el.textContent = '0'; countObserver.observe(el); });
  }

  /* ---------- Principles: highlight the one crossing the middle of the viewport ---------- */
  var principles = d.querySelectorAll('.principle');
  if (hasIO) {
    var principleObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { e.target.classList.toggle('is-active', e.isIntersecting); });
    }, { rootMargin: '-49% 0px -50% 0px' });
    principles.forEach(function (el) { principleObserver.observe(el); });
  } else {
    principles.forEach(function (el) { el.classList.add('is-active'); });
  }

  /* ---------- Scroll-linked: hero depth, parallax, timeline fill ---------- */
  var hero = d.querySelector('.hero');
  var timeline = d.querySelector('[data-timeline]');
  var parallaxEls = Array.prototype.slice.call(d.querySelectorAll('[data-parallax], .project .viz'));
  var desktop = w.matchMedia('(min-width: 900px)');
  var scheduled = false;

  function update() {
    scheduled = false;
    var vh = w.innerHeight;
    if (hero) {
      var p = lib.clamp(w.scrollY / (hero.offsetHeight || vh), 0, 1);
      hero.style.setProperty('--hero-p', motion && desktop.matches ? p.toFixed(4) : 0);
    }
    if (timeline) {
      var r = timeline.getBoundingClientRect();
      timeline.style.setProperty('--progress', lib.scrollProgress(r.top, r.height, vh, 0.6).toFixed(4));
    }
    if (!motion || !desktop.matches) return;
    for (var i = 0; i < parallaxEls.length; i++) {
      var el = parallaxEls[i];
      var rect = el.getBoundingClientRect();
      if (rect.bottom < -200 || rect.top > vh + 200) continue;
      var speed = Number(el.getAttribute('data-parallax') || 0.04);
      var offset = (rect.top + rect.height / 2 - vh / 2) * -speed;
      el.style.setProperty('--py', offset.toFixed(1) + 'px');
    }
  }
  function schedule() {
    if (scheduled) return;
    scheduled = true;
    w.requestAnimationFrame(update);
  }
  w.addEventListener('scroll', schedule, { passive: true });
  w.addEventListener('resize', schedule);
  desktop.addEventListener('change', function () {
    if (!desktop.matches) parallaxEls.forEach(function (el) { el.style.removeProperty('--py'); });
    schedule();
  });
  update();

  /* ---------- Project cards: pointer-following glow ---------- */
  if (w.matchMedia('(hover: hover)').matches) {
    d.querySelectorAll('.project').forEach(function (card) {
      card.addEventListener('pointermove', function (e) {
        var r = card.getBoundingClientRect();
        card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        card.style.setProperty('--my', (e.clientY - r.top) + 'px');
      });
    });
  }
})();
