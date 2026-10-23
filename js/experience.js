/* Experience: mark the role being read and mirror it in the sticky career log. */
(function () {
  'use strict';
  var w = window, d = document;
  var items = Array.prototype.slice.call(d.querySelectorAll('[data-exp-item]'));
  var now = d.querySelector('[data-exp-now]');
  if (!items.length || !now || !('IntersectionObserver' in w)) return;
  var fields = { year: now.querySelector('[data-exp-year]'), role: now.querySelector('[data-exp-role]'), org: now.querySelector('[data-exp-org]') };
  var current = null, swapTimer = null;

  function activate(item) {
    if (item === current) return;
    current = item;
    items.forEach(function (el) { el.classList.toggle('is-active', el === item); });
    w.clearTimeout(swapTimer);
    now.classList.add('is-swap');
    swapTimer = w.setTimeout(function () {
      fields.year.textContent = item.getAttribute('data-period');
      fields.role.textContent = item.getAttribute('data-title');
      fields.org.textContent = item.getAttribute('data-company');
      now.classList.remove('is-swap');
    }, 200);
  }

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) { if (e.isIntersecting) activate(e.target); });
  }, { rootMargin: '-40% 0px -55% 0px' });
  items.forEach(function (el) { observer.observe(el); });
})();
