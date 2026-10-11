/* Terminal contact form (mailto), copy-to-clipboard, toast, live IST clocks and footer year. */
(function () {
  'use strict';
  var lib = window.PortfolioLib;
  var EMAIL = 'sachusudeve8690@gmail.com';
  var toastEl = document.querySelector('.toast'), toastTimer;

  function toast(message) {
    if (!toastEl) return;
    toastEl.textContent = message;
    toastEl.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('is-visible'); }, 2400);
  }

  var form = document.querySelector('.contact-form');
  if (form) form.addEventListener('submit', function (e) {
    e.preventDefault();
    var get = function (n) { return form.elements.namedItem(n).value; };
    var fields = { name: get('name'), email: get('email'), subject: get('subject'), message: get('message') };
    var result = lib.validateContact(fields);
    ['name', 'email', 'message'].forEach(function (key) {
      var msg = result.errors[key] || '';
      document.getElementById(key + '-error').textContent = msg ? '! ' + msg : '';
      form.elements.namedItem(key).setAttribute('aria-invalid', String(!!msg));
    });
    var status = form.querySelector('.contact-form__status');
    if (!result.valid) {
      status.textContent = '';
      form.elements.namedItem(Object.keys(result.errors)[0]).focus();
      return;
    }
    status.textContent = '> opening your mail client … ok';
    window.location.href = lib.buildMailto(EMAIL, fields);
  });

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
