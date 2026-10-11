/* Block cursor + magnetic elements — fine pointers with motion only. */
(function () {
  'use strict';
  var P = window.Portfolio;
  var cursor = document.querySelector('.cursor');
  if (!P || !P.motion || !cursor || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  document.documentElement.classList.add('has-cursor');
  var label = cursor.querySelector('.cursor__label');
  gsap.set(cursor, { xPercent: -50, yPercent: -50 });
  var xTo = gsap.quickTo(cursor, 'x', { duration: 0.18, ease: 'power3' });
  var yTo = gsap.quickTo(cursor, 'y', { duration: 0.18, ease: 'power3' });
  var idleTimer;
  window.addEventListener('pointermove', function (e) {
    xTo(e.clientX); yTo(e.clientY);
    cursor.classList.remove('is-idle');
    clearTimeout(idleTimer);
    idleTimer = setTimeout(function () { cursor.classList.add('is-idle'); }, 1200);
  }, { passive: true });
  document.documentElement.addEventListener('mouseleave', function () { gsap.to(cursor, { autoAlpha: 0, duration: 0.2 }); });
  document.documentElement.addEventListener('mouseenter', function () { gsap.to(cursor, { autoAlpha: 1, duration: 0.2 }); });
  document.addEventListener('pointerover', function (e) {
    var view = e.target.closest('[data-cursor="view"]');
    var link = e.target.closest('a, button, label, input, textarea');
    // Project rows are buttons inside a [data-cursor="view"] row — the row's "view" state wins there.
    var inView = !!view && (!link || view.contains(link));
    cursor.classList.toggle('is-view', inView);
    cursor.classList.toggle('is-link', !!link && !inView);
    label.textContent = inView ? (view.dataset.cursorLabel || '[view]') : '';
  });

  document.querySelectorAll('[data-magnetic]').forEach(function (el) {
    var strength = parseFloat(el.dataset.magnetic) || 0.3;
    var mx = gsap.quickTo(el, 'x', { duration: 0.8, ease: 'elastic.out(1, 0.4)' });
    var my = gsap.quickTo(el, 'y', { duration: 0.8, ease: 'elastic.out(1, 0.4)' });
    el.addEventListener('pointermove', function (e) {
      var r = el.getBoundingClientRect();
      mx((e.clientX - (r.left + r.width / 2)) * strength);
      my((e.clientY - (r.top + r.height / 2)) * strength);
    });
    el.addEventListener('pointerleave', function () { mx(0); my(0); });
  });
})();
