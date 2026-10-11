/* Boot: motion detection, smooth scroll, nav, menu, progress, anchors and the boot loader. */
(function () {
  'use strict';
  var root = document.documentElement;
  var lib = window.PortfolioLib;
  var gsap = window.gsap;
  var hasMotionLibs = !!(gsap && window.ScrollTrigger && window.SplitText && window.ScrambleTextPlugin && window.DrawSVGPlugin && window.MotionPathPlugin);
  var motion = root.classList.contains('motion-ready') && hasMotionLibs;

  if (motion) {
    window.__portfolioBooted = true;
    gsap.registerPlugin(ScrollTrigger, SplitText, ScrambleTextPlugin, DrawSVGPlugin, MotionPathPlugin);
  } else {
    root.classList.remove('motion-ready', 'show-intro');
  }

  var Portfolio = (window.Portfolio = {
    motion: motion,
    lenis: null,
    storage: lib.createSafeStorage(function () { return window.localStorage; }),
    introDone: null
  });
  var session = lib.createSafeStorage(function () { return window.sessionStorage; });

  /* Smooth scroll */
  if (motion && window.Lenis) {
    var lenis = new Lenis({ lerp: 0.1 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
    gsap.ticker.lagSmoothing(0);
    Portfolio.lenis = lenis;
  }

  /* Nav state + progress bar (plain scroll events — Lenis drives native scroll) */
  var nav = document.querySelector('.nav');
  var bar = document.querySelector('.progress__bar');
  var lastY = window.scrollY, ticking = false;
  function onScroll() {
    var y = window.scrollY;
    var max = root.scrollHeight - window.innerHeight;
    nav.classList.toggle('is-scrolled', y > 40);
    nav.classList.toggle('is-hidden', y > lastY && y > 240 && !root.classList.contains('menu-open'));
    bar.style.transform = 'scaleX(' + (max > 0 ? Math.min(y / max, 1) : 0) + ')';
    lastY = y;
    ticking = false;
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  nav.addEventListener('focusin', function () { nav.classList.remove('is-hidden'); });
  onScroll();

  /* Mobile menu */
  var burger = document.querySelector('.nav__burger');
  var menu = document.getElementById('menu');
  function setMenu(open, restoreFocus) {
    root.classList.toggle('menu-open', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    burger.textContent = open ? '[close]' : '[menu]';
    menu.inert = !open;
    if (Portfolio.lenis) open ? Portfolio.lenis.stop() : Portfolio.lenis.start();
    if (open) {
      if (motion) gsap.fromTo(menu.querySelectorAll('.menu__link'), { yPercent: 110 }, { yPercent: 0, duration: 0.9, ease: 'expo.out', stagger: 0.06 });
      menu.querySelector('a').focus();
    } else if (restoreFocus) burger.focus();
  }
  burger.addEventListener('click', function () { setMenu(!root.classList.contains('menu-open'), true); });
  document.addEventListener('keydown', function (e) {
    if (!root.classList.contains('menu-open')) return;
    if (e.key === 'Escape') return setMenu(false, true);
    if (e.key !== 'Tab') return;
    var items = [burger].concat(Array.prototype.slice.call(menu.querySelectorAll('a')));
    var i = items.indexOf(document.activeElement);
    if (e.shiftKey && i <= 0) { e.preventDefault(); items[items.length - 1].focus(); }
    else if (!e.shiftKey && i === items.length - 1) { e.preventDefault(); items[0].focus(); }
  });
  window.matchMedia('(min-width: 900px)').addEventListener('change', function (mq) { if (mq.matches) setMenu(false, false); });

  /* In-page anchors */
  document.addEventListener('click', function (e) {
    var link = e.target.closest('a[href^="#"]');
    if (!link) return;
    var id = link.getAttribute('href');
    var target = id.length > 1 && document.getElementById(id.slice(1));
    if (!target) return;
    e.preventDefault();
    if (root.classList.contains('menu-open')) setMenu(false, false);
    if (Portfolio.lenis) Portfolio.lenis.scrollTo(target, { duration: 1.4 });
    else target.scrollIntoView({ behavior: motion ? 'smooth' : 'auto' });
    if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
    history.replaceState(null, '', id);
  });

  /* Boot loader — always resolves within 3s */
  Portfolio.introDone = new Promise(function (resolve) {
    if (!motion || !root.classList.contains('show-intro')) return resolve();
    var loader = document.querySelector('.loader');
    var lines = loader.querySelectorAll('.loader__line');
    var barText = loader.querySelector('.loader__bar');
    var pct = loader.querySelector('.loader__pct');
    var CELLS = 16;
    var done = false;
    function finish() {
      if (done) return;
      done = true;
      session.set('intro-seen', '1');
      root.classList.remove('show-intro');
      if (Portfolio.lenis) Portfolio.lenis.start();
      resolve();
    }
    if (Portfolio.lenis) Portfolio.lenis.stop();
    var n = { v: 0 };
    var tl = gsap.timeline({ onComplete: finish });
    lines.forEach(function (line, i) {
      var text = line.textContent;
      line.textContent = '';
      tl.to(line, { duration: 0.4, scrambleText: { text: text, chars: 'lowerCase', speed: 0.8 } }, i * 0.3);
    });
    tl.to(n, { v: 100, duration: 1.3, ease: 'power2.inOut', onUpdate: function () {
        var filled = Math.round((n.v / 100) * CELLS);
        barText.textContent = '[' + '█'.repeat(filled) + '░'.repeat(CELLS - filled) + ']';
        pct.textContent = String(Math.round(n.v)).padStart(3, '0') + '%';
      } }, 0)
      .to('.loader__term', { autoAlpha: 0, duration: 0.2 }, '+=0.1')
      .to('.loader__half--top', { yPercent: -100, duration: 0.8, ease: 'expo.inOut' })
      .to('.loader__half--bottom', { yPercent: 100, duration: 0.8, ease: 'expo.inOut' }, '<');
    window.setTimeout(function () { tl.progress(1); finish(); }, 3000);
  });

  if (motion) document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
})();
