/* Project filters: show cards matching a category, with a short entrance animation. */
(function () {
  'use strict';
  var d = document;
  var lib = window.PortfolioLib;
  var buttons = Array.prototype.slice.call(d.querySelectorAll('[data-filter]'));
  var cards = Array.prototype.slice.call(d.querySelectorAll('.project[data-category]'));
  var count = d.querySelector('.projects__count');
  if (!buttons.length || !cards.length) return;

  function apply(filter) {
    var shown = 0;
    buttons.forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-filter') === filter)); });
    cards.forEach(function (card) {
      var match = lib.matchesFilter(card.getAttribute('data-category'), filter);
      var wasHidden = card.hidden;
      card.hidden = !match;
      if (!match) return;
      shown++;
      card.classList.add('is-in');
      if (wasHidden && d.documentElement.classList.contains('motion')) {
        card.classList.remove('is-entering');
        void card.offsetWidth; /* restart the animation */
        card.classList.add('is-entering');
      }
    });
    if (count) count.textContent = lib.projectCountLabel(shown);
  }

  buttons.forEach(function (b) {
    b.addEventListener('click', function () { apply(b.getAttribute('data-filter')); });
  });
  cards.forEach(function (card) {
    card.addEventListener('animationend', function (e) { if (e.animationName === 'card-in') card.classList.remove('is-entering'); });
  });
})();
