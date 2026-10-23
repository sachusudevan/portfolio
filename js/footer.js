/* Footer: the back-to-top ring fills with how far down the page you are. */
(function () {
  'use strict';
  var w = window, d = document, root = d.documentElement;
  var ring = d.querySelector('[data-scroll-ring]');
  if (!ring) return;
  var queued = false;
  function paint() {
    queued = false;
    var max = root.scrollHeight - w.innerHeight;
    ring.style.setProperty('--p', max > 0 ? Math.min(1, w.scrollY / max).toFixed(4) : 0);
  }
  function schedule() { if (!queued) { queued = true; w.requestAnimationFrame(paint); } }
  w.addEventListener('scroll', schedule, { passive: true });
  w.addEventListener('resize', schedule);
  paint();
})();
