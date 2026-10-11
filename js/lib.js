/* Pure helpers shared by the browser scripts (window.PortfolioLib) and the Node test suite. */
(function (root, factory) {
  var lib = factory();
  if (typeof module === 'object' && module.exports) module.exports = lib;
  else root.PortfolioLib = lib;
})(typeof window !== 'undefined' ? window : this, function () {
  'use strict';

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
    formatClock: formatClock,
    matchesFilter: matchesFilter,
    createSafeStorage: createSafeStorage
  };
});
