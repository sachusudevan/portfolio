/* Signature pipeline: scrubbed + pinned on desktop, looping when visible on mobile, with a synced log. */
(function () {
  'use strict';
  var P = window.Portfolio;
  var section = document.getElementById('pipeline');
  if (!P || !P.motion || !section) return;

  var svg = section.querySelector('.pipeline__svg');
  var steps = section.querySelectorAll('.pipeline__step');
  var logs = section.querySelectorAll('.pl-log li');
  var order = ['ingest', 'split', 'validate', 'transform', 'deliver'];
  var q = function (sel) { return svg.querySelectorAll(sel); };
  var lastIdx = -1;

  function setActive(label) {
    var idx = order.indexOf(label === 'end' ? 'deliver' : label);
    steps.forEach(function (step, i) {
      step.classList.toggle('is-active', i === idx);
      step.classList.toggle('is-done', i < idx);
    });
    logs.forEach(function (li, i) { li.classList.toggle('is-shown', i <= idx); });
    if (idx > lastIdx && logs[idx] && P.typeText) P.typeText(logs[idx].querySelector('.pl-log__msg'));
    lastIdx = idx;
  }

  function travel(tl, packets, wires, at) {
    packets.forEach(function (packet, i) {
      // set() reverts when scrubbing backwards, so packets stay hidden before their run
      tl.set(packet, { autoAlpha: 1 }, at + i * 0.1)
        .to(packet, { motionPath: { path: wires[i], align: wires[i], alignOrigin: [0.5, 0.5] }, duration: 0.7, ease: 'power1.inOut' }, at + i * 0.1)
        .to(packet, { autoAlpha: 0, duration: 0.15 }, '>');
    });
  }

  function build() {
    var packets = q('.pl-packet');
    var tl = gsap.timeline({ defaults: { ease: 'power2.inOut' }, onUpdate: function () { setActive(tl.currentLabel()); } });
    tl.addLabel('ingest')
      .from(q('.pl-doc'), { x: -60, autoAlpha: 0, duration: 0.6, stagger: 0.12, ease: 'power3.out' })
      .addLabel('split')
      .from(q('.pl-page'), { x: -70, autoAlpha: 0, scale: 0.6, transformOrigin: '50% 50%', duration: 0.5, stagger: 0.06 })
      .addLabel('validate')
      .from(q('.pl-gate'), { drawSVG: '50% 50%', duration: 0.5 })
      .from(q('.pl-check-ring'), { scale: 0, transformOrigin: '50% 50%', duration: 0.35, stagger: 0.1, ease: 'back.out(2)' }, '<0.2')
      .from(q('.pl-check-mark'), { drawSVG: 0, duration: 0.35, stagger: 0.1 }, '<0.1')
      .addLabel('transform')
      .from(q('.pl-wire-in'), { drawSVG: 0, duration: 0.6, stagger: 0.08 })
      .from(q('.pl-core'), { scale: 0.4, autoAlpha: 0, transformOrigin: '50% 50%', duration: 0.6, ease: 'back.out(1.6)' }, '<0.2')
      .from(q('.pl-core-ring'), { autoAlpha: 0, duration: 0.4 }, '<');
    travel(tl, [packets[0], packets[1], packets[2]], q('.pl-wire-in'), tl.duration());
    tl.addLabel('deliver')
      .from(q('.pl-wire-out'), { drawSVG: 0, duration: 0.6, stagger: 0.08 })
      .from(q('.pl-out'), { x: -20, autoAlpha: 0, duration: 0.5, stagger: 0.1 }, '<0.2');
    travel(tl, [packets[3], packets[4], packets[5]], q('.pl-wire-out'), tl.duration() - 0.4);
    tl.from(q('.pl-sync'), { drawSVG: 0, duration: 0.5 })
      .from(q('.pl-dash'), { y: 20, autoAlpha: 0, duration: 0.5 }, '<')
      .from(q('.pl-bar'), { scaleY: 0, transformOrigin: '50% 100%', duration: 0.5, stagger: 0.08 })
      .addLabel('end');
    return tl;
  }

  gsap.to(q('.pl-core-ring'), { rotation: 360, svgOrigin: '580 280', duration: 14, ease: 'none', repeat: -1 });

  gsap.matchMedia().add({ desktop: '(min-width: 900px)', mobile: '(max-width: 899px)' }, function (ctx) {
    lastIdx = -1;
    var tl = build();
    if (ctx.conditions.desktop) {
      // refreshPriority: pins must be measured before every trigger below them (they were created earlier in motion.js)
      ScrollTrigger.create({ animation: tl, trigger: section, start: 'top top', end: '+=2400', pin: true, scrub: 1, refreshPriority: 2 });
    } else {
      tl.to(svg.querySelectorAll('g, path, rect, circle, line'), { autoAlpha: 0, duration: 0.4 }, '+=1.4')
        .call(function () { lastIdx = -1; });
      tl.repeat(-1).pause();
      ScrollTrigger.create({ trigger: svg, start: 'top 85%', end: 'bottom 15%',
        onToggle: function (self) { self.isActive ? tl.play() : tl.pause(); } });
    }
  });
})();
