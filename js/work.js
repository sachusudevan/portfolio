/* Projects: CLI-flag filters, accordion rows and the cursor-following cover preview. */
(function () {
  'use strict';
  var P = window.Portfolio, lib = window.PortfolioLib;
  var list = document.querySelector('.work__list');
  if (!list) return;
  var motion = P && P.motion;
  var rows = Array.prototype.slice.call(list.querySelectorAll('.work-row'));
  var flags = document.querySelectorAll('.work__flags [data-filter]');
  var count = document.querySelector('.work__count');
  var refresh = function () { if (motion) ScrollTrigger.refresh(); };

  flags.forEach(function (flag) {
    flag.addEventListener('click', function () {
      var filter = flag.dataset.filter, shown = 0;
      flags.forEach(function (f) { f.setAttribute('aria-pressed', String(f === flag)); });
      rows.forEach(function (row) {
        var show = lib.matchesFilter(row.dataset.category, filter);
        if (show) shown++;
        if (show === !row.hidden) return;
        if (!motion) { row.hidden = !show; return; }
        if (show) {
          row.hidden = false;
          gsap.fromTo(row, { autoAlpha: 0, x: -16 }, { autoAlpha: 1, x: 0, duration: 0.5, ease: 'power3.out' });
        } else {
          gsap.to(row, { autoAlpha: 0, x: 16, duration: 0.2, onComplete: function () { row.hidden = true; refresh(); } });
        }
      });
      count.textContent = 'total ' + shown;
      refresh();
    });
  });

  rows.forEach(function (row) {
    var btn = row.querySelector('.work-row__toggle');
    var panel = document.getElementById(btn.getAttribute('aria-controls'));
    btn.addEventListener('click', function () {
      var open = btn.getAttribute('aria-expanded') !== 'true';
      btn.setAttribute('aria-expanded', String(open));
      row.classList.toggle('is-open', open);
      if (!motion) { panel.hidden = !open; return; }
      if (open) {
        panel.hidden = false;
        gsap.fromTo(panel, { height: 0, autoAlpha: 0 }, { height: 'auto', autoAlpha: 1, duration: 0.6, ease: 'expo.out', onComplete: refresh });
      } else {
        gsap.to(panel, { height: 0, autoAlpha: 0, duration: 0.35, ease: 'power2.inOut',
          onComplete: function () { panel.hidden = true; gsap.set(panel, { clearProps: 'height,opacity,visibility' }); refresh(); } });
      }
    });
  });

  var preview = document.querySelector('.work-preview');
  if (!motion || !preview || !window.matchMedia('(min-width: 900px) and (hover: hover) and (pointer: fine)').matches) return;
  gsap.set(preview, { xPercent: -50, yPercent: -115, scale: 0.85 });
  var xTo = gsap.quickTo(preview, 'x', { duration: 0.5, ease: 'power3' });
  var yTo = gsap.quickTo(preview, 'y', { duration: 0.5, ease: 'power3' });
  list.addEventListener('pointermove', function (e) { xTo(e.clientX); yTo(e.clientY); });
  rows.forEach(function (row) {
    row.addEventListener('pointerenter', function () {
      if (row.classList.contains('is-open')) return;
      var cover = row.querySelector('.cover');
      if (cover) preview.replaceChildren(cover.cloneNode(true));
      gsap.to(preview, { autoAlpha: 1, scale: 1, duration: 0.35, ease: 'power3.out' });
    });
    row.addEventListener('pointerleave', function () { gsap.to(preview, { autoAlpha: 0, scale: 0.85, duration: 0.25 }); });
    // The open row shows its own cover, so the floating copy gets out of the way
    row.addEventListener('click', function () { gsap.to(preview, { autoAlpha: 0, scale: 0.85, duration: 0.2 }); });
  });
})();
