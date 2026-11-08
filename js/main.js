/* ==========================================================
   LUXURY PEARL WEDDING — interactions
   ========================================================== */
(function () {
  'use strict';

  var WEDDING_DATE = new Date('2027-06-19T15:00:00+02:00'); // 15:00 за часом Італії
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---------- online photos with local fallback ---------- */
  function useFallback(img) {
    var fb = img.getAttribute('data-fallback');
    if (fb && img.getAttribute('src') !== fb) { img.src = fb; img.removeAttribute('data-full'); }
  }
  document.addEventListener('error', function (e) {
    if (e.target && e.target.tagName === 'IMG') useFallback(e.target);
  }, true);
  $$('img[data-fallback]').forEach(function (img) {
    if (img.complete && img.naturalWidth === 0 && img.getAttribute('loading') !== 'lazy') useFallback(img);
  });

  /* ---------- gentle parallax for the venue photo ---------- */
  var band = $('.venue-band img');
  if (band && !reduceMotion) {
    window.addEventListener('scroll', function () {
      var r = band.parentElement.getBoundingClientRect();
      if (r.bottom < 0 || r.top > innerHeight) return;
      band.style.transform = 'translateY(' + (-(r.top / innerHeight) * 60 - 40) + 'px)';
    }, { passive: true });
  }

  /* ---------- helpers ---------- */
  function makePearl(size, x, y, delay) {
    var p = document.createElement('span');
    p.className = 'pearl';
    p.style.width = p.style.height = size + 'px';
    p.style.left = (x - size / 2) + 'px';
    p.style.top = (y - size / 2) + 'px';
    if (delay != null) p.style.animationDelay = delay + 's';
    return p;
  }

  function seeded(seed) {
    return function () {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };
  }

  var toastTimer;
  function toast(msg) {
    var t = $('#toast');
    t.textContent = msg;
    t.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove('is-on'); }, 3200);
  }

  /* ---------- pearl ring around the seals ---------- */
  $$('.seal__ring').forEach(function (ring) {
    var seal = ring.parentElement;
    var build = function () {
      ring.innerHTML = '';
      var size = seal.offsetWidth;
      var R = size / 2 + 6;
      var n = Math.max(16, Math.round((2 * Math.PI * R) / 11));
      var c = size / 2 + 9;
      for (var i = 0; i < n; i++) {
        var a = (i / n) * Math.PI * 2;
        var p = makePearl(9, c + Math.cos(a) * R, c + Math.sin(a) * R);
        p.style.margin = '0';
        ring.appendChild(p);
      }
    };
    build();
    window.addEventListener('resize', debounce(build, 200));
  });

  /* ---------- draped pearl strands ---------- */
  function buildStrand(el) {
    el.innerHTML = '';
    var w = el.offsetWidth;
    var mobile = w < 640;
    var size = mobile ? 7 : 10;
    var swags = mobile ? 2 : 3;
    var sag = mobile ? 46 : 80;
    var seg = w / swags;
    var idx = 0;
    var frag = document.createDocumentFragment();
    // main row
    for (var s = 0; s < swags; s++) {
      var x0 = s * seg, x1 = x0 + seg;
      addCurve(x0, -4, (x0 + x1) / 2, sag * 2 - 4, x1, -4, size);
    }
    // finer second row
    for (var k = 0; k < swags; k++) {
      var a0 = k * seg + seg * 0.18, a1 = (k + 1) * seg - seg * 0.18;
      addCurve(a0, -4, (a0 + a1) / 2, sag * 1.25, a1, -4, size * 0.6);
    }
    // drop pendants at the joins
    for (var j = 1; j < swags; j++) {
      var jx = j * seg;
      for (var d = 0; d < 4; d++) frag.appendChild(makePearl(size * 0.75, jx, 4 + d * size * 0.78, 0.6 + d * 0.05));
      frag.appendChild(makePearl(size * 1.7, jx, 6 + 4 * size * 0.78 + size * 0.6, 0.9));
    }
    el.appendChild(frag);

    function addCurve(ax, ay, cx, cy, bx, by, r) {
      var pts = [], prev = null, acc = 0;
      for (var i = 0; i <= 600; i++) {
        var t = i / 600;
        var x = (1 - t) * (1 - t) * ax + 2 * (1 - t) * t * cx + t * t * bx;
        var y = (1 - t) * (1 - t) * ay + 2 * (1 - t) * t * cy + t * t * by;
        if (prev) acc += Math.hypot(x - prev[0], y - prev[1]);
        if (!prev || acc >= r * 0.98) { pts.push([x, y]); acc = 0; }
        prev = [x, y];
      }
      pts.forEach(function (p, i) {
        frag.appendChild(makePearl(r, p[0], p[1], 0.3 + (idx++ % 200) * 0.012));
      });
    }
  }
  var strands = $$('[data-strand]');
  strands.forEach(buildStrand);
  window.addEventListener('resize', debounce(function () { strands.forEach(buildStrand); }, 250));

  /* ---------- scattered pearls on the vellum band ---------- */
  $$('[data-scatter]').forEach(function (box) {
    var build = function () {
      box.innerHTML = '';
      var n = +box.getAttribute('data-scatter');
      var w = box.offsetWidth, h = box.offsetHeight;
      var rnd = seeded(42);
      var placed = [], tries = 0;
      while (placed.length < n && tries < 600) {
        tries++;
        var s = 5 + rnd() * 8;
        var x = 14 + rnd() * (w - 28), y = 12 + rnd() * (h - 24);
        if (Math.hypot(x - w / 2, y - h / 2) < 64) continue;
        if (placed.some(function (p) { return Math.hypot(p[0] - x, p[1] - y) < 26; })) continue;
        placed.push([x, y]);
        var p = makePearl(s, x, y);
        p.style.animationDelay = (-rnd() * 9) + 's';
        box.appendChild(p);
      }
    };
    build();
    window.addEventListener('resize', debounce(build, 250));
  });

  /* ---------- static pearls, laid out by hand-like scatter ---------- */
  function layoutScatter(box) {
    box.innerHTML = '';
    var W = box.offsetWidth, H = box.offsetHeight;
    if (!W || !H) return;
    var mobile = W < 700;
    var n = +box.getAttribute('data-pearls') || 16;
    if (mobile) n = Math.round(n * 0.55);
    var rnd = seeded(+box.getAttribute('data-seed') || 7);
    var band = mobile ? 0.075 : 0.2;           // pearls stay in the side margins
    var placed = [], tries = 0, frag = document.createDocumentFragment();
    while (placed.length < n && tries < 2000) {
      tries++;
      var left = rnd() < 0.5;
      var u = Math.pow(rnd(), 1.4) * band;    // denser towards the edge
      var x = (left ? u : 1 - u) * W;
      var y = (0.04 + rnd() * 0.92) * H;
      var big = rnd() < 0.18;
      var s = mobile ? (big ? 10 : 5 + rnd() * 4) : (big ? 14 + rnd() * 6 : 5 + rnd() * 7);
      if (placed.some(function (p) { return Math.hypot(p[0] - x, p[1] - y) < (p[2] + s) * 1.6; })) continue;
      placed.push([x, y, s]);
      var pe = makePearl(s, x, y);
      pe.classList.add('pearl--still');
      pe.style.animationDelay = (rnd() * 1.2).toFixed(2) + 's';
      frag.appendChild(pe);
      // occasionally a tiny companion pearl, like a fallen cluster
      if (!mobile && rnd() < 0.3) {
        var a2 = rnd() * 6.283, d = s * 1.15;
        var c = makePearl(s * 0.5, x + Math.cos(a2) * d, y + Math.sin(a2) * d);
        c.classList.add('pearl--still');
        frag.appendChild(c);
      }
    }
    box.appendChild(frag);
  }
  var scatters = $$('.pearl-scatter');
  scatters.forEach(layoutScatter);
  var lastW = window.innerWidth;
  window.addEventListener('resize', debounce(function () {
    if (window.innerWidth === lastW) return;   // ignore mobile address-bar resizes
    lastW = window.innerWidth; scatters.forEach(layoutScatter);
  }, 250));

  /* ---------- gold dust on the intro (light, stops when opening) ---------- */
  (function () {
    var cv = $('.dust-canvas');
    if (!cv || reduceMotion) return;
    var ctx = cv.getContext('2d'), W, H, P = [], on = true;
    function size() {
      W = cv.offsetWidth; H = cv.offsetHeight; cv.width = W; cv.height = H;
      P = []; var n = W < 640 ? 22 : 40;
      for (var i = 0; i < n; i++) P.push({ x: Math.random() * W, y: Math.random() * H, r: .6 + Math.random() * 1.3, v: .1 + Math.random() * .25, t: Math.random() * 6.28, s: .01 + Math.random() * .025 });
    }
    function f() {
      if (!on) return;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = 'rgb(222,194,140)';
      for (var i = 0; i < P.length; i++) {
        var p = P[i]; p.y -= p.v; p.t += p.s; if (p.y < -5) { p.y = H + 5; p.x = Math.random() * W; }
        ctx.globalAlpha = .2 + .6 * (0.5 + 0.5 * Math.sin(p.t));
        ctx.fillRect(p.x, p.y, p.r * 1.6, p.r * 1.6);
      }
      ctx.globalAlpha = 1;
      requestAnimationFrame(f);
    }
    size(); f();
    window.addEventListener('resize', debounce(size, 250));
    document.addEventListener('pearl:opening', function () { on = false; cv.style.transition = 'opacity .6s'; cv.style.opacity = 0; });
  })();

  /* ---------- 1. envelope intro ---------- */
  var intro = $('#intro');
  var envelope = $('#envelope');
  var nav = $('#nav');
  var opened = false;

  function openEnvelope() {
    if (opened) return;
    opened = true;
    document.dispatchEvent(new Event('pearl:opening'));
    envelope.setAttribute('aria-label', 'Запрошення відкрито');
    intro.classList.add('is-opened');                                  // clasp lifts away
    if (reduceMotion) { envelope.classList.add('is-open'); finish(400); return; }
    setTimeout(function () { envelope.classList.add('is-open'); }, 550);   // doors swing open
    setTimeout(function () { envelope.classList.add('is-revealed'); }, 1900); // card glows
    finish(3300);
  }
  function finish(at) {
    setTimeout(function () {
      document.body.classList.add('is-ready');       // hero starts fading in underneath
      intro.classList.add('is-gone');                 // intro dissolves (1.6s)
      nav.classList.add('is-visible');
      document.documentElement.classList.remove('is-locked');
      document.body.classList.remove('is-locked');
      setTimeout(function () {
        document.dispatchEvent(new Event('pearl:intro-gone'));
        intro.parentNode && intro.parentNode.removeChild(intro);
      }, 1800);
    }, at);
  }
  envelope.addEventListener('click', openEnvelope);
  envelope.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openEnvelope(); }
  });

  /* ---------- nav ---------- */
  var burger = $('#burger');
  var links = $('#navLinks');
  burger.addEventListener('click', function () {
    var open = links.classList.toggle('is-open');
    burger.setAttribute('aria-expanded', open);
    document.body.style.overflow = open ? 'hidden' : '';
  });
  $$('a', links).forEach(function (a) {
    a.addEventListener('click', function () {
      links.classList.remove('is-open');
      burger.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    });
  });
  function onScroll() {
    nav.classList.toggle('is-scrolled', window.scrollY > 40);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  if ('IntersectionObserver' in window) {
    var sectionObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        $$('a', links).forEach(function (x) {
          x.classList.toggle('is-active', x.getAttribute('href') === '#' + e.target.id);
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    ['story', 'gallery', 'details', 'rsvp'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) sectionObserver.observe(el);
    });
  }

  /* ---------- reveal on scroll ---------- */
  var revealEls = $$('.reveal');
  if ('IntersectionObserver' in window && !reduceMotion) {
    var ro = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('is-in'); ro.unobserve(e.target); }
      });
    }, { threshold: 0.14, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(function (el, i) {
      if (el.classList.contains('g-item')) el.style.transitionDelay = (i % 4) * 0.12 + 's';
      ro.observe(el);
    });
  } else {
    revealEls.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ---------- countdown ---------- */
  var cd = {};
  $$('[data-cd]').forEach(function (el) { cd[el.getAttribute('data-cd')] = el; });
  function pad(n, l) { n = String(n); while (n.length < (l || 2)) n = '0' + n; return n; }
  function tick() {
    var diff = Math.max(0, WEDDING_DATE - new Date());
    var s = Math.floor(diff / 1000);
    cd.d.textContent = pad(Math.floor(s / 86400), 3);
    cd.h.textContent = pad(Math.floor(s % 86400 / 3600));
    cd.m.textContent = pad(Math.floor(s % 3600 / 60));
    cd.s.textContent = pad(s % 60);
  }
  tick();
  setInterval(tick, 1000);

  /* ---------- subtle tilt on the invitation card ---------- */
  var card = $('[data-tilt]');
  if (card && window.matchMedia('(hover: hover) and (pointer: fine)').matches && !reduceMotion) {
    var hero = $('#hero');
    hero.addEventListener('mousemove', function (e) {
      var r = hero.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width - 0.5;
      var y = (e.clientY - r.top) / r.height - 0.5;
      card.style.transform = 'perspective(1400px) rotateY(' + (x * 5) + 'deg) rotateX(' + (-y * 5) + 'deg)';
    });
    hero.addEventListener('mouseleave', function () { card.style.transform = ''; });
  }

  /* ---------- gallery lightbox ---------- */
  var items = $$('#galleryGrid img');
  var lb = $('#lightbox'), lbImg = $('#lbImg'), lbCount = $('#lbCount');
  var current = 0, lastFocus = null;

  function show(i, animate) {
    current = (i + items.length) % items.length;
    var src = items[current].getAttribute('data-full') || items[current].currentSrc || items[current].src;
    var apply = function () {
      lbImg.src = src;
      lbImg.alt = items[current].alt;
      lbCount.textContent = (current + 1) + ' / ' + items.length;
      lbImg.classList.remove('is-swapping');
    };
    if (animate) { lbImg.classList.add('is-swapping'); setTimeout(apply, 260); } else apply();
  }
  function openLb(i) {
    lastFocus = document.activeElement;
    show(i, false);
    lb.hidden = false;
    requestAnimationFrame(function () { lb.classList.add('is-open'); });
    document.body.style.overflow = 'hidden';
    $('.lb-close').focus();
  }
  function closeLb() {
    lb.classList.remove('is-open');
    document.body.style.overflow = '';
    setTimeout(function () { lb.hidden = true; }, 450);
    if (lastFocus) lastFocus.focus();
  }
  items.forEach(function (img, i) {
    var fig = img.parentElement;
    fig.setAttribute('tabindex', '0');
    fig.setAttribute('role', 'button');
    fig.setAttribute('aria-label', 'Відкрити фото ' + (i + 1));
    fig.addEventListener('click', function () { openLb(i); });
    fig.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openLb(i); } });
  });
  lb.addEventListener('click', function (e) {
    var act = e.target.getAttribute('data-lb');
    if (act === 'close' || e.target === lb) closeLb();
    else if (act === 'prev') show(current - 1, true);
    else if (act === 'next') show(current + 1, true);
  });
  document.addEventListener('keydown', function (e) {
    if (lb.hidden) return;
    if (e.key === 'Escape') closeLb();
    if (e.key === 'ArrowLeft') show(current - 1, true);
    if (e.key === 'ArrowRight') show(current + 1, true);
  });
  var tx = null;
  lb.addEventListener('touchstart', function (e) { tx = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener('touchend', function (e) {
    if (tx === null) return;
    var dx = e.changedTouches[0].clientX - tx;
    if (Math.abs(dx) > 50) show(current + (dx < 0 ? 1 : -1), true);
    tx = null;
  });

  /* ---------- add to calendar (.ics) ---------- */
  $('#addCalendar').addEventListener('click', function () {
    var ics = [
      'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Luxury Pearl Wedding//UA', 'CALSCALE:GREGORIAN',
      'BEGIN:VEVENT',
      'UID:sophia-alexander-20270619@luxury-pearl-wedding',
      'DTSTAMP:' + new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z',
      'DTSTART:20270619T123000Z',
      'DTEND:20270619T220000Z',
      'SUMMARY:Весілля Sophia & Alexander',
      'LOCATION:Villa Erba\\, Largo Luchino Visconti 4\\, 22012 Cernobbio (CO)\\, Italia',
      'DESCRIPTION:Зустріч гостей 14:30 · Церемонія 15:00 · Банкет 17:30',
      'BEGIN:VALARM', 'TRIGGER:-P7D', 'ACTION:DISPLAY', 'DESCRIPTION:Весілля Sophia & Alexander через тиждень', 'END:VALARM',
      'END:VEVENT', 'END:VCALENDAR'
    ].join('\r\n');
    var blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = 'Sophia-Alexander-19-06-2027.ics';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1500);
    toast('Подію збережено — відкрийте файл, щоб додати в календар');
  });

  /* ---------- RSVP ---------- */
  var form = $('#rsvpForm');
  var thanks = $('#rsvpThanks');
  var guestsRow = $('#guestsRow');
  var fName = form.elements['name'];

  $$('input[name="attendance"]', form).forEach(function (r) {
    r.addEventListener('change', function () {
      guestsRow.classList.toggle('is-hidden', form.elements.attendance.value === 'no');
      r.closest('fieldset').classList.remove('has-error');
    });
  });
  fName.addEventListener('input', function () { fName.parentElement.classList.remove('has-error'); });

  function encode(fd) {
    var parts = [];
    fd.forEach(function (v, k) { parts.push(encodeURIComponent(k) + '=' + encodeURIComponent(v)); });
    return parts.join('&');
  }

  function showThanks(data) {
    var first = (data.name || '').trim().split(/\s+/)[0];
    $('#thanksText').textContent = data.attendance === 'yes'
      ? (first ? first + ', ' : '') + 'ми безмежно раді! Чекаємо на вас 19 червня 2027 року.'
      : (first ? first + ', ' : '') + 'дякуємо, що повідомили. Ми будемо сумувати за вами.';
    form.hidden = true;
    thanks.hidden = false;
    thanks.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var ok = true;
    if (!fName.value.trim()) { fName.parentElement.classList.add('has-error'); ok = false; }
    if (!form.elements.attendance.value) { $('.choice', form).classList.add('has-error'); ok = false; }
    if (!ok) { toast('Будь ласка, заповніть обов’язкові поля'); return; }

    var fd = new FormData(form);
    var data = {};
    fd.forEach(function (v, k) { data[k] = v; });
    if (data.attendance === 'no') { delete data.guests; delete data.menu; fd.delete('guests'); fd.delete('menu'); }
    try { localStorage.setItem('pearl-rsvp', JSON.stringify(data)); } catch (err) {}

    var online = /^https?:$/.test(location.protocol) && !/^(localhost|127\.)/.test(location.hostname);
    if (!online) { showThanks(data); return; }

    form.classList.add('is-sending');
    fetch('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: encode(fd)
    }).then(function (res) {
      form.classList.remove('is-sending');
      showThanks(data);
      if (!res.ok) console.warn('RSVP: сервер відповів ' + res.status + '. На Netlify форми працюють автоматично.');
    }).catch(function () {
      form.classList.remove('is-sending');
      showThanks(data);
    });
  });

  $('#rsvpAgain').addEventListener('click', function () {
    thanks.hidden = true;
    form.hidden = false;
  });

  /* ---------- util ---------- */
  function debounce(fn, ms) {
    var t;
    return function () { clearTimeout(t); t = setTimeout(fn, ms); };
  }
})();
