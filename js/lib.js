/* Pure helpers shared by the browser scripts (window.PortfolioLib) and the Node test suite. */
(function (root, factory) {
  var lib = factory();
  if (typeof module === 'object' && module.exports) module.exports = lib;
  else root.PortfolioLib = lib;
})(typeof window !== 'undefined' ? window : this, function () {
  'use strict';

  function formatClock(date, timeZone, withSeconds) {
    var opts = { hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: timeZone || 'Asia/Kolkata' };
    if (withSeconds !== false) opts.second = '2-digit';
    return new Intl.DateTimeFormat('en-GB', opts).format(date);
  }

  function matchesFilter(categories, filter) {
    if (!filter || filter === 'all') return true;
    return String(categories).split(/\s+/).indexOf(filter) !== -1;
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  /* How far an element has been scrolled through, 0..1, measured against a line at `anchor` × viewport height. */
  function scrollProgress(top, height, viewportHeight, anchor) {
    if (height <= 0) return 0;
    var line = viewportHeight * (anchor == null ? 0.6 : anchor);
    return clamp((line - top) / height, 0, 1);
  }

  /* easeOutExpo, used for the count-up numbers */
  function easeOutExpo(t) {
    return t >= 1 ? 1 : 1 - Math.pow(2, -10 * t);
  }

  function projectCountLabel(n) {
    return 'Showing ' + n + ' project' + (n === 1 ? '' : 's');
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
    formatClock: formatClock,
    matchesFilter: matchesFilter,
    clamp: clamp,
    scrollProgress: scrollProgress,
    easeOutExpo: easeOutExpo,
    projectCountLabel: projectCountLabel,
    createSafeStorage: createSafeStorage
  };
});
