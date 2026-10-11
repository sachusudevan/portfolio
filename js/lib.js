/* Pure helpers shared by the browser scripts (window.PortfolioLib) and the Node test suite. */
(function (root, factory) {
  var lib = factory();
  if (typeof module === 'object' && module.exports) module.exports = lib;
  else root.PortfolioLib = lib;
})(typeof window !== 'undefined' ? window : this, function () {
  'use strict';

  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

  function validateContact(fields) {
    var errors = {};
    if (clean(fields.name).length < 2) errors.name = 'Please enter your name.';
    if (!EMAIL_RE.test(clean(fields.email))) errors.email = 'Please enter a valid email address.';
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
    validateContact: validateContact,
    formatClock: formatClock,
    matchesFilter: matchesFilter,
    createSafeStorage: createSafeStorage
  };
});
