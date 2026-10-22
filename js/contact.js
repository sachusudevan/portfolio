/* Contact: copy-to-clipboard with toast feedback and the live IST clock. */
(function () {
  'use strict';
  var w = window, d = document;
  var lib = w.PortfolioLib;
  var toast = d.querySelector('.toast');
  var toastTimer = null;

  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('is-visible');
    w.clearTimeout(toastTimer);
    toastTimer = w.setTimeout(function () { toast.classList.remove('is-visible'); }, 2400);
  }

  function legacyCopy(text) {
    var ta = d.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    d.body.appendChild(ta);
    ta.select();
    var ok = false;
    try { ok = d.execCommand('copy'); } catch (e) { ok = false; }
    d.body.removeChild(ta);
    return ok;
  }

  d.querySelectorAll('[data-copy]').forEach(function (btn) {
    var label = btn.querySelector('.copy-btn__label');
    var resetTimer = null;
    btn.addEventListener('click', function () {
      var text = btn.getAttribute('data-copy');
      function done(ok) {
        if (!ok) { showToast('Copy failed — the address is ' + text); return; }
        btn.classList.add('is-copied');
        if (label) label.textContent = 'Copied';
        btn.setAttribute('aria-label', 'Email address copied');
        showToast('Email address copied to clipboard');
        w.clearTimeout(resetTimer);
        resetTimer = w.setTimeout(function () {
          btn.classList.remove('is-copied');
          if (label) label.textContent = 'Copy';
          btn.setAttribute('aria-label', 'Copy email address');
        }, 2200);
      }
      if (navigator.clipboard && w.isSecureContext) {
        navigator.clipboard.writeText(text).then(function () { done(true); }, function () { done(legacyCopy(text)); });
      } else {
        done(legacyCopy(text));
      }
    });
  });

  var clocks = d.querySelectorAll('[data-clock]');
  function tick() {
    var now = lib.formatClock(new Date(), 'Asia/Kolkata', false);
    clocks.forEach(function (el) { el.textContent = now; });
  }
  if (clocks.length) { tick(); w.setInterval(tick, 15000); }
})();
