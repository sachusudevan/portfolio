/* Pure helpers shared by the browser scripts (window.PortfolioLib) and the Node test suite. */
(function (root, factory) {
  var lib = factory();
  if (typeof module === 'object' && module.exports) module.exports = lib;
  else root.PortfolioLib = lib;
})(typeof window !== 'undefined' ? window : this, function () {
  'use strict';

  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  var PHONE_RE = /^\+?[\d\s()-]{7,20}$/;

  function clean(value) {
    return String(value == null ? '' : value).trim();
  }

  function encodePart(text) {
    return encodeURIComponent(String(text).replace(/\r\n|\r|\n/g, '\r\n'));
  }

  function buildMailto(to, fields) {
    var name = clean(fields.name);
    var subject = clean(fields.subject) || 'Portfolio enquiry from ' + name;
    var body = clean(fields.message) + '\n\n— ' + name + '\n' + clean(fields.email);
    return 'mailto:' + to + '?subject=' + encodePart(subject) + '&body=' + encodePart(body);
  }

  function buildWhatsApp(number, fields) {
    var lines = ['New website enquiry', '', 'Name: ' + clean(fields.name), 'Email: ' + clean(fields.email)];
    if (clean(fields.phone)) lines.push('Phone: ' + clean(fields.phone));
    if (clean(fields.subject)) lines.push('Subject: ' + clean(fields.subject));
    lines.push('Message:', clean(fields.message));
    return 'https://wa.me/' + number + '?text=' + encodeURIComponent(lines.join('\n'));
  }

  function validateContact(fields) {
    var errors = {};
    var phone = clean(fields.phone);
    if (clean(fields.name).length < 2) errors.name = 'Please enter your name.';
    if (!EMAIL_RE.test(clean(fields.email))) errors.email = 'Please enter a valid email address.';
    if (phone && !PHONE_RE.test(phone)) errors.phone = 'Please enter a valid phone number, or leave it empty.';
    if (clean(fields.message).length < 10) errors.message = 'Please write a little more (at least 10 characters).';
    return { valid: Object.keys(errors).length === 0, errors: errors };
  }

  function formatClock(date, timeZone) {
    return new Intl.DateTimeFormat('en-GB', {
      hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
      timeZone: timeZone || 'Asia/Kolkata'
    }).format(date);
  }

  function matchesFilter(categories, filter) {
    if (!filter || filter === 'all') return true;
    return String(categories).split(/\s+/).indexOf(filter) !== -1;
  }

  function createSafeStorage(getStorage) {
    function store() {
      try { return getStorage(); } catch (e) { return null; }
    }
    return {
      get: function (key) {
        try { var s = store(); return s ? s.getItem(key) : null; } catch (e) { return null; }
      },
      set: function (key, value) {
        try { var s = store(); if (!s) return false; s.setItem(key, value); return true; } catch (e) { return false; }
      }
    };
  }

  return {
    buildMailto: buildMailto,
    buildWhatsApp: buildWhatsApp,
    validateContact: validateContact,
    formatClock: formatClock,
    matchesFilter: matchesFilter,
    createSafeStorage: createSafeStorage
  };
});
