/* dillonrcarpenter.com — vanilla JS, no dependencies */
(function () {
  'use strict';

  /* Flag JS on so CSS can gate scroll-reveal hiding — a no-JS visitor
     keeps everything visible (the .reveal default is fully shown). */
  document.documentElement.classList.add('js');

  var reduceMotion = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- Fill these in (see README "Placeholders") -------------------- */
  var GA_MEASUREMENT_ID = 'G-044JQFGMR1';   // GA4 measurement ID
  var VIMEO_REEL_ID = '429732990';          // vimeo.com/429732990 — Dillon R. Carpenter Showreel
  /* -------------------------------------------------------------------- */

  /* Google Analytics 4 — loads only once a real ID is configured, so the
     placeholder build makes zero third-party requests. */
  if (/^G-[A-Z0-9]{6,}$/.test(GA_MEASUREMENT_ID) && GA_MEASUREMENT_ID.indexOf('XXXX') === -1) {
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', GA_MEASUREMENT_ID);
    var ga = document.createElement('script');
    ga.async = true;
    ga.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_MEASUREMENT_ID;
    document.head.appendChild(ga);
  }

  /* Footer year */
  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* Hero HUD timecode — a running SMPTE-style counter (HH:MM:SS:FF @ 24fps).
     Purely decorative; holds at zero for reduced-motion, and pauses when the
     tab is hidden so it never spins in the background. */
  var tcEl = document.querySelector('[data-timecode]');
  if (tcEl) {
    if (reduceMotion || typeof requestAnimationFrame !== 'function') {
      tcEl.textContent = '00:00:00:00';
    } else {
      var FPS = 24;
      var origin = null;
      var raf = 0;
      var pad = function (n) { return (n < 10 ? '0' : '') + n; };
      var tick = function (t) {
        if (origin === null) origin = t;
        var frames = Math.floor((t - origin) / 1000 * FPS);
        tcEl.textContent =
          pad(Math.floor(frames / (FPS * 3600)) % 24) + ':' +
          pad(Math.floor(frames / (FPS * 60)) % 60) + ':' +
          pad(Math.floor(frames / FPS) % 60) + ':' +
          pad(frames % FPS);
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
      document.addEventListener('visibilitychange', function () {
        if (document.hidden) {
          cancelAnimationFrame(raf);
        } else {
          origin = null;
          raf = requestAnimationFrame(tick);
        }
      });
    }
  }

  /* Mobile nav toggle */
  var toggle = document.getElementById('nav-toggle');
  var links = document.getElementById('nav-links');
  if (toggle && links) {
    toggle.addEventListener('click', function () {
      var open = links.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    links.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') {
        links.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* Nav hide on scroll down, show on scroll up */
  var nav = document.getElementById('main-nav');
  var lastY = 0;
  if (nav) {
    window.addEventListener('scroll', function () {
      var y = window.scrollY;
      nav.classList.toggle('nav-hidden', y > lastY && y > 120 && !links.classList.contains('open'));
      lastY = y;
    }, { passive: true });
  }

  /* Scroll reveal */
  if ('IntersectionObserver' in window) {
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08 });
    document.querySelectorAll('.reveal').forEach(function (el) { obs.observe(el); });
  } else {
    document.querySelectorAll('.reveal').forEach(function (el) { el.classList.add('visible'); });
  }

  /* Click-to-load Vimeo embed (facade keeps the page free of iframes
     until the visitor asks for the video). dnt=1 disables Vimeo tracking. */
  function mountVimeo(container, id) {
    var iframe = document.createElement('iframe');
    iframe.src = 'https://player.vimeo.com/video/' + id + '?autoplay=1&dnt=1&title=0&byline=0&portrait=0&badge=0';
    iframe.allow = 'autoplay; fullscreen; picture-in-picture; encrypted-media';
    iframe.setAttribute('allowfullscreen', '');
    iframe.title = 'Showreel — Dillon R. Carpenter';
    container.textContent = '';
    container.appendChild(iframe);
  }

  var reelFrame = document.getElementById('reel-frame');
  var reelPlay = document.getElementById('reel-play');
  if (reelFrame && reelPlay) {
    reelPlay.addEventListener('click', function () {
      if (/^\d+$/.test(VIMEO_REEL_ID)) {
        mountVimeo(reelFrame, VIMEO_REEL_ID);
      } else {
        var note = document.getElementById('reel-note');
        if (note) note.textContent = 'The full reel is on its way to Vimeo — check back shortly.';
      }
    });
  }

  /* Work-grid video cards added later: any <a data-vimeo-id="123"> upgrades
     to a click-to-load player instead of navigating away. */
  document.querySelectorAll('a[data-vimeo-id]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('data-vimeo-id');
      if (!/^\d+$/.test(id)) return; // fall through to normal navigation
      e.preventDefault();
      var frame = document.createElement('div');
      frame.className = 'reel-frame';
      a.replaceWith(frame);
      mountVimeo(frame, id);
    });
  });

  /* Quote form: progressive enhancement over a plain Formspree POST.
     With JS we submit via fetch and keep the visitor on the page. */
  var form = document.getElementById('quote-form');
  var status = document.getElementById('form-status');
  if (form && status && window.fetch) {
    form.addEventListener('submit', function (e) {
      if (form.action.indexOf('FORMSPREE_FORM_ID') !== -1) {
        e.preventDefault();
        status.className = 'form-status err';
        status.textContent = 'The form isn’t wired up yet — the Formspree form ID still needs to be configured.';
        return;
      }
      e.preventDefault();
      var btn = form.querySelector('.btn-submit');
      btn.disabled = true;
      status.className = 'form-status';
      status.textContent = 'Sending…';
      fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { 'Accept': 'application/json' }
      }).then(function (res) {
        if (res.ok) {
          form.reset();
          status.className = 'form-status ok';
          status.textContent = 'Got it — thanks! I’ll be in touch within one business day.';
        } else {
          return res.json().then(function (data) {
            throw new Error((data.errors || []).map(function (er) { return er.message; }).join(', ') || 'Submission failed');
          });
        }
      }).catch(function () {
        status.className = 'form-status err';
        status.textContent = 'Something went sideways. Please try again, or reach out on Vimeo.';
      }).finally(function () {
        btn.disabled = false;
      });
    });
  }
})();
