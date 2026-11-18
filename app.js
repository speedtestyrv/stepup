'use strict';
// StepUp download page. No trackers, no third-party code: everything here comes from this site.
(() => {
  // Never shown inside someone else's page (clickjacking).
  if (window.top !== window.self) { try { window.top.location = window.self.location; } catch (e) { document.documentElement.hidden = true; } return; }

  document.documentElement.classList.add('js');
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => Array.from(document.querySelectorAll(s));
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fmt = (n) => Math.round(n).toLocaleString('en-US');

  // The APK lives on the GitHub releases of the repo that serves this page (owner.github.io/repo/).
  const owner = location.hostname.endsWith('.github.io') ? location.hostname.split('.')[0] : 'speedtestyrv';
  const repo = location.pathname.split('/').filter(Boolean)[0] || 'stepup';
  // Only ever link to the official releases: a value from version.json must point there too.
  const official = (u) => typeof u === 'string' && u.startsWith(`https://github.com/${owner}/${repo}/releases/`);
  let apk = `https://github.com/${owner}/${repo}/releases/latest/download/StepUp.apk`;
  const setLinks = () => $$('.dl').forEach((a) => { a.href = apk; a.rel = 'noopener'; });
  setLinks();

  // Version, size, notes and checksum of the newest release.
  fetch('version.json', { cache: 'no-store', credentials: 'omit' }).then((r) => (r.ok ? r.json() : null)).then((v) => {
    if (!v || typeof v.versionName !== 'string' || !/^[0-9A-Za-z.\-]{1,32}$/.test(v.versionName)) return;
    $('#ver').textContent = `Version ${v.versionName} · Android`;
    $('#vername').textContent = `Version ${v.versionName} · the latest for Android`;
    $$('.dltext').forEach((e) => { e.textContent = `Download StepUp ${v.versionName}`; });
    // The file carries its version in the name, so an old StepUp.apk in Downloads is never opened by mistake.
    const named = official(v.apk) ? v.apk : `https://github.com/${owner}/${repo}/releases/download/v${v.versionName}/StepUp-${v.versionName}.apk`;
    apk = named; setLinks();
    if (typeof v.sizeMb === 'number') $$('.size').forEach((e) => { e.textContent = `Android 9+ · ${v.sizeMb} MB`; });
    if (typeof v.sha256 === 'string' && /^[0-9a-fA-F]{64}$/.test(v.sha256)) $('#sha').textContent = v.sha256.toUpperCase();
    if (typeof v.cert === 'string' && /^[0-9A-Fa-f:]{64,95}$/.test(v.cert)) $('#cert').textContent = v.cert.toUpperCase();
    if (Array.isArray(v.notes) && v.notes.length) {
      $('#notes-title').textContent = `What's new in ${v.versionName}`;
      const ul = $('#notes');
      v.notes.slice(0, 12).forEach((n) => { if (typeof n !== 'string') return; const li = document.createElement('li'); li.textContent = n; ul.appendChild(li); });
      $('#notes-box').hidden = false;
    }
  }).catch(() => {});

  // Copy buttons for the checksums.
  $$('.copy').forEach((b) => b.addEventListener('click', () => {
    const text = document.getElementById(b.dataset.copy).textContent.trim();
    (navigator.clipboard ? navigator.clipboard.writeText(text) : Promise.reject()).then(() => {
      b.textContent = 'Copied'; setTimeout(() => { b.textContent = 'Copy'; }, 1600);
    }).catch(() => {});
  }));

  // Sticky nav gets a glass background once the page scrolls.
  const nav = $('#nav');
  const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 8);
  onScroll(); window.addEventListener('scroll', onScroll, { passive: true });

  // Count a number up when it comes into view.
  const countUp = (el, to, ms, suffix = '') => {
    if (reduce) { el.textContent = fmt(to) + suffix; return; }
    const t0 = performance.now();
    const tick = (t) => {
      const k = Math.min(1, (t - t0) / ms);
      el.textContent = fmt(to * (1 - Math.pow(1 - k, 3))) + suffix;
      if (k < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  // The phone: the step ring fills, the clan bar grows.
  const playPhone = () => {
    const steps = 12480, goal = 15000;
    const fill = $('#ringfill');
    const c = 2 * Math.PI * 50;
    fill.style.transition = reduce ? 'none' : 'stroke-dashoffset 2.4s cubic-bezier(.2,.8,.2,1)';
    requestAnimationFrame(() => { fill.style.strokeDashoffset = String(c * (1 - steps / goal)); });
    countUp($('#steps'), steps, 2400);
    $('#clanbar').style.width = '68%';
    setTimeout(() => { $('#next').textContent = `${fmt(20000 - steps)} steps to go`; }, reduce ? 0 : 2400);
  };

  // The clan track: the line fills and the chests it passes light up.
  const playTrack = () => {
    $('.line-fill').style.width = '72%';
    $$('.node').forEach((n, i) => setTimeout(() => { if (i < 3) n.classList.add('on'); }, reduce ? 0 : 500 + i * 650));
  };

  const once = new WeakSet();
  const io = 'IntersectionObserver' in window ? new IntersectionObserver((entries) => entries.forEach((e) => {
    if (!e.isIntersecting) return;
    const el = e.target;
    el.classList.add('in');
    if (!once.has(el)) {
      once.add(el);
      if (el.classList.contains('hero-art')) playPhone();
      if (el.classList.contains('track-demo')) playTrack();
      if (el.classList.contains('stat')) { const b = el.querySelector('b'); countUp(b, Number(b.dataset.count), 1400); }
    }
    io.unobserve(el);
  }), { threshold: 0.18, rootMargin: '0px 0px -40px 0px' }) : null;

  $$('.reveal, .ladder').forEach((el, i) => {
    if (io) { el.style.transitionDelay = el.closest('.cards, .steps, .stats') ? `${(i % 3) * 90}ms` : ''; io.observe(el); }
    else { el.classList.add('in'); }
  });
  if (!io) { playPhone(); playTrack(); $$('.stat b').forEach((b) => { b.textContent = b.dataset.count; }); }
})();
