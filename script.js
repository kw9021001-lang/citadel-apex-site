(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia('(pointer:fine)').matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
  var HAS_IO = 'IntersectionObserver' in window;

  $('#yr').textContent = new Date().getFullYear();

  /* ---------- nav, mobile menu, active link ---------- */
  var nav = $('#nav'), prog = $('#progress'), burger = $('#burger'), menu = $('#menu');
  function setMenu(open) {
    menu.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', open);
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  }
  burger.addEventListener('click', function () { setMenu(!menu.classList.contains('open')); });
  $$('#menu a').forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
  var links = $$('#menu a');
  if (HAS_IO) {
    var so = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) links.forEach(function (a) { a.classList.toggle('on', a.getAttribute('href') === '#' + e.target.id); });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    links.forEach(function (a) { var s = $(a.getAttribute('href')); if (s) so.observe(s); });
  }

  /* ---------- HUD: ring ticks, Lagos clock, reticle ---------- */
  var ticks = $('#hudRing .ticks'), ns = 'http://www.w3.org/2000/svg';
  for (var i = 0; i < 72; i++) {
    var l = document.createElementNS(ns, 'line'), a = i * 5 * Math.PI / 180, big = i % 6 === 0, r1 = 296, r2 = big ? 280 : 288;
    l.setAttribute('x1', 300 + Math.cos(a) * r1); l.setAttribute('y1', 300 + Math.sin(a) * r1);
    l.setAttribute('x2', 300 + Math.cos(a) * r2); l.setAttribute('y2', 300 + Math.sin(a) * r2);
    if (!big) l.setAttribute('opacity', '.5');
    ticks.appendChild(l);
  }
  var clock = $('#clock');
  try {
    var fmt = new Intl.DateTimeFormat('en-GB', { timeZone: 'Africa/Lagos', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    (function tick() { clock.textContent = fmt.format(new Date()); setTimeout(tick, 1000); })();
  } catch (e) { clock.textContent = '--:--:--'; }

  var ret = $('#reticle');
  if (fine && !reduce) {
    var rx = 0, ry = 0, tx = 0, ty = 0;
    addEventListener('pointermove', function (e) { tx = e.clientX; ty = e.clientY; ret.classList.add('on'); }, { passive: true });
    document.addEventListener('pointerleave', function () { ret.classList.remove('on'); });
    $$('a,button,input,select,textarea').forEach(function (el) {
      el.addEventListener('pointerenter', function () { ret.classList.add('big'); });
      el.addEventListener('pointerleave', function () { ret.classList.remove('big'); });
    });
    (function follow() { rx += (tx - rx) * .22; ry += (ty - ry) * .22; ret.style.transform = 'translate3d(' + rx + 'px,' + ry + 'px,0)'; requestAnimationFrame(follow); })();
  }

  /* ---------- headline word masks ---------- */
  $$('[data-split]').forEach(function (h) {
    var words = h.textContent.trim().split(/\s+/);
    h.setAttribute('aria-label', h.textContent.trim());
    h.innerHTML = words.map(function (w, i) {
      return '<span class="w" aria-hidden="true"><span style="transition-delay:' + (i * 70) + 'ms">' + w + '</span></span>';
    }).join(' ');
  });

  /* ---------- gauges count up ---------- */
  function countTo(el, to, fmtFn, ms) {
    if (reduce) { el.textContent = fmtFn(to); return; }
    var s = performance.now();
    (function tick(t) {
      var k = Math.min(1, (t - s) / ms), e = 1 - Math.pow(1 - k, 3);
      el.textContent = fmtFn(to * e);
      if (k < 1) requestAnimationFrame(tick);
    })(s);
  }
  $$('.gauge').forEach(function (g) { g.style.setProperty('--f', g.dataset.fill || '.8'); });

  /* ---------- reveal on scroll ---------- */
  var revealTargets = $$('.reveal, [data-split]');
  function showAll() { revealTargets.forEach(function (el) { el.classList.add('in', 'split-in'); if (el.classList.contains('gauge')) $('b', el).textContent = el.dataset.count; }); }
  if (HAS_IO && !reduce) {
    var ro = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('in', 'split-in'); ro.unobserve(e.target);
        if (e.target.classList.contains('gauge')) countTo($('b', e.target), +e.target.dataset.count, function (v) { return Math.round(v); }, 1500);
      });
    }, { threshold: 0.18, rootMargin: '0px 0px -6% 0px' });
    revealTargets.forEach(function (el) { ro.observe(el); });
  } else showAll();
  if (HAS_IO) $$('.pillar').forEach(function (p) {
    new IntersectionObserver(function (e, o) { if (e[0].isIntersecting) { p.classList.add('in'); o.disconnect(); } }, { threshold: .3 }).observe(p);
  });

  /* ---------- statement words ---------- */
  var wordsEl = $('#words'), HOT = /^(lagos|websites|apps|fintech|ai|live)/i;
  var wordSpans = wordsEl.textContent.trim().split(/\s+/).map(function (w) {
    var s = document.createElement('span'); s.textContent = w + ' ';
    if (HOT.test(w.replace(/[^a-z]/gi, ''))) s.className = 'hot';
    return s;
  });
  wordsEl.textContent = ''; wordSpans.forEach(function (s) { wordsEl.appendChild(s); });
  if (reduce) wordSpans.forEach(function (s) { s.classList.add('on'); });

  /* ---------- scroll engine ---------- */
  var heroMedia = $('#heroMedia'), hudRing = $('#hudRing'), heroCopy = $('#heroCopy'), hero = $('#top'),
      statement = $('#statement'), hscroll = $('#services'), track = $('#hTrack'), hFill = $('#hFill'),
      mtrack = $('#mtrack'), reelZoom = $('#reelZoom'), steps = $('#steps'), railFill = $('#railFill'),
      stepItems = $$('li', steps), motionEls = $$('[data-speed],[data-zoom]'), bigs = $$('[data-hero]');
  var dist = 0, mx = 0, lastY = scrollY, vel = 0, ticking = false;

  function measure() {
    dist = Math.max(0, track.scrollWidth - innerWidth);
    hscroll.style.height = (dist + innerHeight * 1.05) + 'px';
  }
  measure(); addEventListener('resize', measure); addEventListener('load', measure);

  function frame() {
    var y = scrollY, vh = innerHeight, r;
    var h = document.documentElement.scrollHeight - vh;
    prog.style.width = (h > 0 ? (y / h) * 100 : 0) + '%';
    nav.classList.toggle('stuck', y > 40);

    if (!reduce) {
      /* hero: scene pushes in, HUD ring spins up, copy lifts and fades */
      if (y < vh * 1.4) {
        var p = clamp(y / vh, 0, 1.4);
        heroMedia.style.transform = 'translate3d(0,' + (p * 70) + 'px,0) scale(' + (1 + p * .22) + ')';
        hudRing.style.transform = 'translateY(-50%) translate3d(0,' + (p * 60) + 'px,0) rotate(' + (p * 80) + 'deg) scale(' + (1 + p * .25) + ')';
        heroCopy.style.transform = 'translate3d(0,' + (-p * 90) + 'px,0)';
        heroCopy.style.opacity = clamp(1 - p * 1.1, 0, 1);
        bigs.forEach(function (b, i) { b.style.transform = 'translate3d(' + ((i % 2 ? 1 : -1) * p * 60) + 'px,0,0)'; });
      }

      /* parallax and scroll-zoom against the parent's position in the viewport */
      motionEls.forEach(function (el) {
        r = el.parentElement.getBoundingClientRect();
        if (r.bottom < -300 || r.top > vh + 300) return;
        var t = '', sp = el.dataset.speed, z = el.dataset.zoom;
        if (sp) t += 'translate3d(0,' + (-(r.top + r.height / 2 - vh / 2) * parseFloat(sp)) + 'px,0) ';
        if (z) t += 'scale(' + (1 + clamp((vh - r.top) / (vh + r.height), 0, 1) * parseFloat(z)) + ')';
        el.style.transform = t;
      });

      /* showreel zooms up as it enters */
      r = reelZoom.getBoundingClientRect();
      var z2 = clamp((vh - r.top) / (vh * .8), 0, 1);
      reelZoom.style.transform = 'scale(' + (.78 + .22 * z2) + ')';
      reelZoom.style.opacity = .35 + .65 * z2;

      /* services: vertical scroll becomes horizontal travel */
      r = hscroll.getBoundingClientRect();
      var hp = clamp(-r.top / (r.height - vh), 0, 1);
      track.style.transform = 'translate3d(' + (-hp * dist) + 'px,0,0)';
      hFill.style.width = (hp * 100) + '%';
    }

    /* statement words light up */
    r = statement.getBoundingClientRect();
    var sp2 = clamp(-r.top / (r.height - vh), 0, 1), lit = Math.round(clamp(sp2 / .82, 0, 1) * wordSpans.length);
    if (!reduce) wordSpans.forEach(function (s, i) { var on = i < lit; if (on !== s.classList.contains('on')) s.classList.toggle('on', on); });

    /* process rail */
    r = steps.getBoundingClientRect();
    railFill.style.transform = 'scaleY(' + clamp((vh * .62 - r.top) / r.height, 0, 1) + ')';
    stepItems.forEach(function (li) { li.classList.toggle('lit', reduce || li.getBoundingClientRect().top < vh * .66); });

    ticking = false;
  }
  function req() { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }
  addEventListener('scroll', req, { passive: true });
  addEventListener('resize', req);
  /* the marquee is the only thing that runs every frame, and only while it is on screen */
  var marqueeOn = true, half = 0;
  if (HAS_IO) new IntersectionObserver(function (e) { marqueeOn = e[0].isIntersecting; half = mtrack.scrollWidth / 2; }).observe(mtrack.parentElement);
  (function mq() {
    var dy = scrollY - lastY; lastY = scrollY; vel += (dy - vel) * .18;
    if (!reduce && marqueeOn && !document.hidden) {
      mx -= .8 + vel * .9;
      if (!half) half = mtrack.scrollWidth / 2;
      if (mx < -half) mx += half; else if (mx > 0) mx -= half;
      mtrack.style.transform = 'translate3d(' + mx + 'px,0,0)';
    }
    requestAnimationFrame(mq);
  })();
  /* slow or data-saving connections keep the still poster instead of autoplaying video */
  var conn = navigator.connection;
  if (conn && (conn.saveData || /2g$/.test(conn.effectiveType || ''))) { var hv = $('#heroVid'); hv.removeAttribute('autoplay'); hv.preload = 'none'; hv.innerHTML = ''; hv.load(); $$('video').forEach(function (v) { v.dataset.still = '1'; }); }

  /* ---------- videos: load lazily, play only when seen ---------- */
  function prime(v) { if (!v.src && v.dataset.src && !v.dataset.still) { v.src = v.dataset.src; v.load(); } }
  var coreVid = $('#coreVid');
  if (HAS_IO && coreVid) new IntersectionObserver(function (e) {
    if (e[0].isIntersecting) { prime(coreVid); coreVid.play().catch(function () {}); } else coreVid.pause();
  }, { threshold: .2 }).observe(coreVid);
  var heroVid = $('#heroVid');
  if (HAS_IO) new IntersectionObserver(function (e) { if (e[0].isIntersecting) heroVid.play().catch(function () {}); else heroVid.pause(); }, { threshold: .05 }).observe(hero);

  /* ---------- showreel ---------- */
  var scenes = $$('.scene'), tabs = $$('.tabs button'), fill = $('#barFill'), pp = $('#pp'), ppIcon = $('#ppIcon'),
      capT = $('#capTitle'), capS = $('#capSub'), reelNo = $('#reelNo'), player = $('#player');
  var DUR = 7000, cur = 0, t0 = 0, elapsed = 0, playing = false, raf = 0, userPaused = false;
  var PAUSE = '<rect x="3" y="2" width="3.5" height="12" fill="currentColor"/><rect x="9.5" y="2" width="3.5" height="12" fill="currentColor"/>';
  var PLAY = '<path d="M4 2l10 6-10 6z" fill="currentColor"/>';
  function vidOf(i) { return $('video', scenes[i]); }
  function show(i) {
    cur = (i + scenes.length) % scenes.length;
    scenes.forEach(function (s, k) {
      s.classList.toggle('active', k === cur);
      var v = $('video', s);
      if (k === cur) { if (playing) prime(v); v.currentTime = 0; if (playing) v.play().catch(function () {}); } else v.pause();
    });
    tabs.forEach(function (b, k) { b.classList.toggle('on', k === cur); });
    capT.textContent = scenes[cur].dataset.title; capS.textContent = scenes[cur].dataset.sub;
    reelNo.textContent = '0' + (cur + 1) + '/0' + scenes.length;
    elapsed = 0; t0 = performance.now(); fill.style.width = (cur / scenes.length * 100) + '%';
    var nx = vidOf((cur + 1) % scenes.length); if (nx && playing) prime(nx);
  }
  function reelLoop(t) {
    if (!playing) return;
    var e = elapsed + (t - t0);
    fill.style.width = Math.min(100, ((cur + e / DUR) / scenes.length) * 100) + '%';
    if (e >= DUR) show(cur + 1);
    raf = requestAnimationFrame(reelLoop);
  }
  function setPlaying(on) {
    if (playing === on) return;
    playing = on;
    ppIcon.innerHTML = on ? PAUSE : PLAY;
    pp.setAttribute('aria-label', on ? 'Pause showreel' : 'Play showreel');
    var v = vidOf(cur);
    if (on) { prime(v); t0 = performance.now(); raf = requestAnimationFrame(reelLoop); v.play().catch(function () {}); }
    else { elapsed += performance.now() - t0; cancelAnimationFrame(raf); v.pause(); }
  }
  pp.addEventListener('click', function () { setPlaying(!playing); userPaused = !playing; });
  tabs.forEach(function (b) { b.addEventListener('click', function () { show(+b.dataset.i); if (!playing) { setPlaying(true); userPaused = false; } }); });
  show(0);
  if (reduce) userPaused = true;
  if (HAS_IO) new IntersectionObserver(function (e) {
    if (e[0].isIntersecting && !userPaused && !reduce) setPlaying(true); else if (!e[0].isIntersecting) setPlaying(false);
  }, { threshold: 0.4 }).observe(player);

  /* ---------- contact form -> WhatsApp ---------- */
  var form = $('#form');
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var ok = true;
    ['name', 'contact'].forEach(function (n) {
      var f = form.elements[n], bad = !f.value.trim(); f.classList.toggle('bad', bad); if (bad) ok = false;
    });
    if (!ok) { $('#formNote').textContent = 'Please add your name and a way to reach you.'; return; }
    var m = 'Hello Citadel Apex Solutions,\n\nName: ' + form.elements.name.value.trim() +
      '\nContact: ' + form.elements.contact.value.trim() +
      '\nI need: ' + form.elements.type.value +
      (form.elements.msg.value.trim() ? '\n\n' + form.elements.msg.value.trim() : '');
    window.open('https://wa.me/2348055777000?text=' + encodeURIComponent(m), '_blank', 'noopener');
    $('#formNote').textContent = 'WhatsApp should now be open with your message ready to send.';
  });

  frame();
})();
