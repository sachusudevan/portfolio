/* Contact helpers: copy-to-clipboard, toast, live IST clocks and footer year.
   (WhatsApp connect is a plain link in index.html, so it works without JavaScript.) */
(function () {
  'use strict';
  var lib = window.PortfolioLib;
  var toastEl = document.querySelector('.toast'), toastTimer;

  function toast(message) {
    if (!toastEl) return;
    toastEl.textContent = message;
    toastEl.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('is-visible'); }, 2400);
  }

  document.querySelectorAll('[data-copy]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var text = btn.dataset.copy;
      function fallback() {
        var ta = document.createElement('textarea');
        ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
        document.body.appendChild(ta); ta.select();
        var ok = false;
        try { ok = document.execCommand('copy'); } catch (err) { ok = false; }
        ta.remove();
        toast(ok ? '> email copied ✓' : '! copy failed — ' + text);
      }
      if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(function () { toast('> email copied ✓'); }, fallback);
      else fallback();
    });
  });

  var clocks = document.querySelectorAll('[data-clock]');
  function tick() {
    var time = lib.formatClock(new Date(), 'Asia/Kolkata');
    clocks.forEach(function (c) { c.textContent = c.dataset.clock === 'short' ? time.slice(0, 5) : time; });
  }
  if (clocks.length) { tick(); setInterval(tick, 1000); }
  document.querySelectorAll('[data-year]').forEach(function (el) { el.textContent = String(new Date().getFullYear()); });
})();
