/* Approach dial: the principle crossing the middle of the screen lights its segment, turns the pointer
   and swaps the motion study in the core. (js/motion.js marks the active principle itself.) */
(function () {
  'use strict';
  var w = window, d = document;
  var dial = d.querySelector('[data-dial]');
  var items = Array.prototype.slice.call(d.querySelectorAll('[data-principle]'));
  if (!dial || !items.length || !('IntersectionObserver' in w)) return;
  var segs = dial.querySelectorAll('[data-dial-seg]');
  var labels = dial.querySelectorAll('[data-dial-label]');
  var glyphs = dial.querySelectorAll('[data-dial-glyph]');
  var indexEl = dial.querySelector('[data-dial-index]');
  var nameEl = dial.querySelector('[data-dial-name]');
  var current = 0, nameTimer = null;

  function toggleAll(list, i) { Array.prototype.forEach.call(list, function (el, j) { el.classList.toggle('is-on', j === i); }); }
  function show(i) {
    if (i === current) return;
    current = i;
    toggleAll(segs, i);
    toggleAll(labels, i);
    toggleAll(glyphs, i);
    dial.style.setProperty('--angle', i * 72 + 'deg');
    if (indexEl) indexEl.textContent = '0' + (i + 1);
    if (!nameEl) return;
    var title = items[i].querySelector('.principle__title');
    w.clearTimeout(nameTimer);
    nameEl.classList.add('is-swap');
    nameTimer = w.setTimeout(function () {
      if (title) nameEl.textContent = title.textContent;
      nameEl.classList.remove('is-swap');
    }, 200);
  }

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) { if (e.isIntersecting) show(items.indexOf(e.target)); });
  }, { rootMargin: '-49% 0px -50% 0px' });
  items.forEach(function (el) { io.observe(el); });
})();
