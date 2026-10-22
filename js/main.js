/* Site chrome: nav state, active-section indicator, scroll progress, mobile menu, back-to-top, year. */
(function () {
  'use strict';
  var w = window, d = document, root = d.documentElement;
  w.__portfolioBooted = true;

  var reduceQuery = w.matchMedia('(prefers-reduced-motion: reduce)');
  function prefersReduced() { return !root.classList.contains('motion') || reduceQuery.matches; }

  /* ---------- Nav background + scroll progress ---------- */
  var nav = d.querySelector('[data-nav]');
  var bar = d.querySelector('.scroll-progress');
  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    w.requestAnimationFrame(function () {
      ticking = false;
      var y = w.scrollY;
      nav.classList.toggle('is-scrolled', y > 24);
      var max = root.scrollHeight - w.innerHeight;
      bar.style.setProperty('--scroll', max > 0 ? (y / max).toFixed(4) : 0);
    });
  }
  w.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Active section + gliding indicator ---------- */
  var links = Array.prototype.slice.call(d.querySelectorAll('[data-nav-link]'));
  var indicator = d.querySelector('.nav__indicator');
  var current = null;

  function moveIndicator() {
    var link = links.filter(function (a) { return a.getAttribute('aria-current') === 'true'; })[0];
    if (!link || !indicator) { if (indicator) indicator.style.setProperty('--ind-o', 0); return; }
    var inset = 14;
    indicator.style.setProperty('--ind-x', (link.offsetLeft + inset) + 'px');
    indicator.style.setProperty('--ind-w', Math.max(0, link.offsetWidth - inset * 2) + 'px');
    indicator.style.setProperty('--ind-o', 1);
  }
  function setActive(id) {
    if (id === current) return;
    current = id;
    links.forEach(function (a) {
      if (a.getAttribute('data-nav-link') === id) a.setAttribute('aria-current', 'true');
      else a.removeAttribute('aria-current');
    });
    moveIndicator();
  }
  if ('IntersectionObserver' in w) {
    var sectionObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) setActive(e.target.getAttribute('data-nav-section'));
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    d.querySelectorAll('[data-nav-section]').forEach(function (s) { sectionObserver.observe(s); });
  }
  w.addEventListener('resize', moveIndicator);
  if (d.fonts && d.fonts.ready) d.fonts.ready.then(moveIndicator);

  /* ---------- Mobile menu ---------- */
  var toggle = d.querySelector('.nav__toggle');
  var menu = d.getElementById('mobile-menu');
  var outside = [d.getElementById('main'), d.querySelector('.footer'), d.querySelector('.wordmark')];

  function focusables() {
    return [toggle].concat(Array.prototype.slice.call(menu.querySelectorAll('a[href]')));
  }
  function setMenu(open, restoreFocus) {
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    menu.classList.toggle('is-open', open);
    nav.classList.toggle('is-open', open);
    d.body.classList.toggle('is-locked', open);
    if (open) menu.removeAttribute('inert'); else menu.setAttribute('inert', '');
    outside.forEach(function (el) { if (!el) return; if (open) el.setAttribute('inert', ''); else el.removeAttribute('inert'); });
    if (open) w.setTimeout(function () { var first = menu.querySelector('a[href]'); if (first) first.focus(); }, 120);
    else if (restoreFocus) toggle.focus();
  }
  toggle.addEventListener('click', function () { setMenu(toggle.getAttribute('aria-expanded') !== 'true', true); });
  menu.addEventListener('click', function (e) {
    if (e.target.closest('a[href^="#"]')) setMenu(false, false);
  });
  d.addEventListener('keydown', function (e) {
    if (toggle.getAttribute('aria-expanded') !== 'true') return;
    if (e.key === 'Escape') { setMenu(false, true); return; }
    if (e.key !== 'Tab') return;
    var items = focusables(), first = items[0], last = items[items.length - 1];
    if (e.shiftKey && d.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && d.activeElement === last) { e.preventDefault(); first.focus(); }
  });
  w.matchMedia('(min-width: 960px)').addEventListener('change', function (mq) {
    if (mq.matches && toggle.getAttribute('aria-expanded') === 'true') setMenu(false, false);
  });

  /* ---------- In-page links: move focus to the target for keyboard and screen-reader users ---------- */
  d.addEventListener('click', function (e) {
    var a = e.target.closest('a[href^="#"]');
    if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey) return;
    var id = a.getAttribute('href').slice(1);
    var target = id ? d.getElementById(id) : null;
    if (!target) return;
    e.preventDefault();
    if (a.hasAttribute('data-back-to-top') || id === 'home') {
      w.scrollTo({ top: 0, behavior: prefersReduced() ? 'auto' : 'smooth' });
    } else {
      target.scrollIntoView({ behavior: prefersReduced() ? 'auto' : 'smooth', block: 'start' });
    }
    if (w.history && w.history.pushState) w.history.pushState(null, '', id === 'home' ? w.location.pathname + w.location.search : '#' + id);
    var focusTarget = id === 'home' ? d.getElementById('main') : target;
    if (!focusTarget.hasAttribute('tabindex')) focusTarget.setAttribute('tabindex', '-1');
    focusTarget.focus({ preventScroll: true });
  });

  /* ---------- Year ---------- */
  d.querySelectorAll('[data-year]').forEach(function (el) { el.textContent = String(new Date().getFullYear()); });
})();
