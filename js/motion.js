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

  /* git-log experience graph */
  var progress = document.querySelector('.timeline__progress');
  if (progress) gsap.fromTo(progress, { scaleY: 0 }, { scaleY: 1, ease: 'none',
    scrollTrigger: { trigger: '.timeline', start: 'top 70%', end: 'bottom 60%', scrub: true } });
  each('.timeline__item', function (item) {
    gsap.from(item, { x: 40, autoAlpha: 0, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: item, start: 'top 82%', once: true } });
    ScrollTrigger.create({ trigger: item, start: 'top 60%', end: 'bottom 60%', toggleClass: 'is-active' });
  });

  /* Desktop: horizontal "offline" strip */
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
