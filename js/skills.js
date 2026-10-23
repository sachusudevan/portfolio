/* Skills section: trace a group through the stack map (and back), card glow, and pause the map's packets off-screen. */
(function () {
  'use strict';
  var w = window, d = document, root = d.documentElement;
  var map = d.querySelector('[data-stackmap]');
  var groups = d.querySelector('[data-skill-groups]');
  if (!map || !groups) return;
  var motion = root.classList.contains('motion');
  var cards = Array.prototype.slice.call(groups.querySelectorAll('.skill-group'));

  /* ---------- Focus tracing: hovering a card lights its nodes; hovering a node lights its card ---------- */
  function focus(g) {
    if (g) { map.setAttribute('data-focus', g); groups.setAttribute('data-focus', g); }
    else { map.removeAttribute('data-focus'); groups.removeAttribute('data-focus'); }
    cards.forEach(function (card) { card.classList.toggle('is-focus', !!g && card.getAttribute('data-g') === g); });
  }
  cards.forEach(function (card) {
    card.addEventListener('pointerenter', function () { focus(card.getAttribute('data-g')); });
    card.addEventListener('pointerleave', function () { focus(null); });
    card.addEventListener('pointermove', function (e) {
      var r = card.getBoundingClientRect();
      card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      card.style.setProperty('--my', (e.clientY - r.top) + 'px');
    });
  });
  map.querySelectorAll('.sm-node, .sm-zone, .sm-git').forEach(function (node) {
    node.addEventListener('pointerenter', function () { focus(node.getAttribute('data-n').split(' ')[0]); });
    node.addEventListener('pointerleave', function () { focus(null); });
  });

  /* ---------- SMIL packets: only animate while the map is on screen (and motion is allowed) ---------- */
  var svgs = Array.prototype.slice.call(map.querySelectorAll('svg')).filter(function (s) { return typeof s.pauseAnimations === 'function'; });
  function play(on) { svgs.forEach(function (s) { if (on) s.unpauseAnimations(); else s.pauseAnimations(); }); }
  if (!motion) { play(false); return; }
  if ('IntersectionObserver' in w) {
    play(false);
    new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { play(e.isIntersecting); });
    }, { rootMargin: '10% 0px' }).observe(map);
  }
})();
