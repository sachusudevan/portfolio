/* Projects showcase: the project being read (scroll on desktop, hover/focus too) plays in the sticky
   case-study window; the filter pill slides to the pressed button. Filtering itself lives in js/work.js. */
(function () {
  'use strict';
  var w = window, d = document;
  var work = d.querySelector('[data-work]');
  if (!work) return;
  var cards = Array.prototype.slice.call(work.querySelectorAll('.project'));
  var screen = work.querySelector('[data-stage-screen]');
  var urlEl = work.querySelector('[data-stage-url]');
  var indexEl = work.querySelector('[data-stage-index]');
  var totalEl = work.querySelector('[data-stage-total]');
  var catEl = work.querySelector('[data-stage-cat]');
  var progress = work.querySelector('[data-stage-progress]');
  var desktop = w.matchMedia('(min-width: 1080px)');
  if (!cards.length || !screen) return;

  /* ---------- Build the window's shots from each card's illustration ---------- */
  var shots = cards.map(function (card) {
    var shot = d.createElement('div');
    shot.className = 'stage__shot';
    var svg = card.querySelector('.project__visual svg');
    if (svg) shot.appendChild(svg.cloneNode(true));
    screen.appendChild(shot);
    return shot;
  });
  var ticks = cards.map(function () {
    var i = d.createElement('i');
    if (progress) progress.appendChild(i);
    return i;
  });

  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function visible() { return cards.filter(function (c) { return !c.hidden; }); }

  var active = -1, swapTimer = null;
  function setActive(i, force) {
    if (i < 0 || (i === active && !force)) return;
    var changed = i !== active;
    active = i;
    cards.forEach(function (c, j) { c.classList.toggle('is-active', j === i); });
    shots.forEach(function (s, j) { s.classList.toggle('is-active', j === i); });
    ticks.forEach(function (t, j) { t.classList.toggle('is-on', j === i); t.hidden = cards[j].hidden; });
    var list = visible();
    if (indexEl) indexEl.textContent = pad(list.indexOf(cards[i]) + 1);
    if (totalEl) totalEl.textContent = pad(list.length);
    if (urlEl) urlEl.textContent = 'case-study/' + (cards[i].getAttribute('data-slug') || '');
    var cat = cards[i].querySelector('.project__cat');
    if (catEl && cat) catEl.textContent = cat.textContent;
    if (changed) {
      screen.classList.remove('is-swapping');
      void screen.offsetWidth; /* restart the scan line */
      screen.classList.add('is-swapping');
      w.clearTimeout(swapTimer);
      swapTimer = w.setTimeout(function () { screen.classList.remove('is-swapping'); }, 950);
    }
  }

  /* Scroll: the project crossing the middle of the screen becomes active */
  if ('IntersectionObserver' in w) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting && !e.target.hidden) setActive(cards.indexOf(e.target));
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    cards.forEach(function (c) { io.observe(c); });
  }
  /* Hover / keyboard focus previews a project in the window (desktop) */
  cards.forEach(function (c, i) {
    c.addEventListener('pointerenter', function () { if (desktop.matches) setActive(i); });
    c.addEventListener('focusin', function () { setActive(i); });
  });

  /* ---------- Filter pill + keeping the window in step with the filter ---------- */
  var group = d.querySelector('[data-filter-group]');
  var buttons = group ? Array.prototype.slice.call(group.querySelectorAll('[data-filter]')) : [];
  function placePill() {
    if (!group) return;
    var on = buttons.filter(function (b) { return b.getAttribute('aria-pressed') === 'true'; })[0];
    if (!on) return;
    group.style.setProperty('--pill-x', on.offsetLeft + 'px');
    group.style.setProperty('--pill-w', on.offsetWidth + 'px');
    group.classList.add('has-pill');
  }
  buttons.forEach(function (b) {
    b.addEventListener('click', function () {
      /* js/work.js has already shown/hidden the cards by now */
      placePill();
      var list = visible();
      if (!list.length) return;
      setActive(cards[active] && !cards[active].hidden ? active : cards.indexOf(list[0]), true);
    });
  });
  placePill();
  w.addEventListener('resize', placePill);
  if (d.fonts && d.fonts.ready) d.fonts.ready.then(placePill);

  setActive(0);
})();
