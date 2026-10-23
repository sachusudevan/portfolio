/* About section: scroll-lit headline, tilting portrait, card glow and a live Kerala clock. */
(function () {
  'use strict';
  var w = window, d = document, root = d.documentElement;
  var section = d.getElementById('about');
  if (!section) return;
  var motion = root.classList.contains('motion');
  var hover = w.matchMedia('(hover: hover)').matches;

  /* ---------- Headline: wrap words, light them up as the title crosses the viewport ---------- */
  var title = section.querySelector('[data-scrub]');
  if (title && motion) {
    var walker = d.createTreeWalker(title, NodeFilter.SHOW_TEXT);
    var textNodes = [];
    while (walker.nextNode()) textNodes.push(walker.currentNode);
    textNodes.forEach(function (node) {
      var frag = d.createDocumentFragment();
      node.nodeValue.split(/(\s+)/).forEach(function (part) {
        if (!part) return;
        if (/^\s+$/.test(part)) { frag.appendChild(d.createTextNode(part)); return; }
        var span = d.createElement('span');
        span.className = 'w';
        span.textContent = part;
        frag.appendChild(span);
      });
      node.parentNode.replaceChild(frag, node);
    });
    var words = title.querySelectorAll('.w');
    title.classList.add('is-scrub');
    var lit = -1, queued = false;
    var paint = function () {
      queued = false;
      var vh = w.innerHeight;
      var top = title.getBoundingClientRect().top;
      var p = Math.min(1, Math.max(0, (vh * 0.92 - top) / (vh * 0.5)));
      var n = Math.round(p * words.length);
      if (n === lit) return;
      lit = n;
      for (var i = 0; i < words.length; i++) words[i].classList.toggle('is-lit', i < n);
    };
    var schedule = function () { if (!queued) { queued = true; w.requestAnimationFrame(paint); } };
    w.addEventListener('scroll', schedule, { passive: true });
    w.addEventListener('resize', schedule);
    paint();
  }

  /* ---------- Cards: pointer-following glow; portrait tilts toward the pointer ---------- */
  if (hover) {
    section.querySelectorAll('.bento__card').forEach(function (card) {
      card.addEventListener('pointermove', function (e) {
        var r = card.getBoundingClientRect();
        card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        card.style.setProperty('--my', (e.clientY - r.top) + 'px');
      });
    });
    var tilt = section.querySelector('[data-tilt]');
    if (tilt && motion) {
      tilt.addEventListener('pointermove', function (e) {
        var r = tilt.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        tilt.style.setProperty('--ry', (x * 8).toFixed(2) + 'deg');
        tilt.style.setProperty('--rx', (y * -8).toFixed(2) + 'deg');
      });
      tilt.addEventListener('pointerleave', function () {
        tilt.style.removeProperty('--rx');
        tilt.style.removeProperty('--ry');
      });
    }
  }

  /* ---------- Live clock (Asia/Kolkata) ---------- */
  var clock = section.querySelector('[data-about-clock]');
  if (!clock || !w.Intl || !Intl.DateTimeFormat) return;
  var fmt;
  try {
    fmt = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  } catch (err) { return; }
  var hands = { h: clock.querySelector('[data-hand="h"]'), m: clock.querySelector('[data-hand="m"]'), s: clock.querySelector('[data-hand="s"]') };
  var timeEl = clock.querySelector('[data-clock-time]');
  var noteEl = clock.querySelector('[data-clock-note]');
  if (!hands.h || !hands.m || !hands.s || !timeEl || !noteEl) return;
  function note(h) {
    if (h >= 7 && h < 10) return 'Morning chai, then code.';
    if (h >= 10 && h < 19) return 'Probably shipping something right now.';
    if (h >= 19 && h < 23) return 'Winding down — still reachable on WhatsApp.';
    return 'Probably asleep — replies by morning.';
  }
  function tick() {
    var parts = {};
    fmt.formatToParts(new Date()).forEach(function (p) { parts[p.type] = p.value; });
    var h = Number(parts.hour) % 24, m = Number(parts.minute), s = Number(parts.second);
    hands.h.style.transform = 'rotate(' + ((h % 12) * 30 + m * 0.5) + 'deg)';
    hands.m.style.transform = 'rotate(' + (m * 6 + s * 0.1) + 'deg)';
    hands.s.style.transform = 'rotate(' + (s * 6) + 'deg)';
    timeEl.innerHTML = parts.hour + ':' + parts.minute + '<small>IST</small>';
    noteEl.textContent = note(h);
  }
  tick();
  w.setInterval(tick, 1000);
})();
