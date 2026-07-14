/* dillonrcarpenter.com : vanilla JS, no dependencies */
(function () {
  'use strict';

  /* Flag JS on so CSS can gate scroll-reveal hiding. A no-JS visitor
     keeps everything visible (the .reveal default is fully shown). */
  document.documentElement.classList.add('js');

  var reduceMotion = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- Fill these in (see README "Placeholders") -------------------- */
  var GA_MEASUREMENT_ID = 'G-044JQFGMR1';   // GA4 measurement ID
  var VIMEO_REEL_ID = '429732990';          // vimeo.com/429732990 : Dillon R. Carpenter Showreel
  var BUTTONDOWN_USERNAME = 'BUTTONDOWN_USERNAME';  // your Buttondown username (newsletter)
  /* -------------------------------------------------------------------- */

  /* Google Analytics 4 loads only once a real ID is configured, so the
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

  /* Tiny GA4 event helper. No-ops when GA isn't loaded (dormant ID). */
  function track(name, params) {
    if (typeof window.gtag === 'function') { window.gtag('event', name, params || {}); }
  }

  /* Footer year */
  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* Hero HUD timecode: a running SMPTE-style counter (HH:MM:SS:FF @ 24fps).
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
  function mountVimeo(container, id, title) {
    var iframe = document.createElement('iframe');
    iframe.src = 'https://player.vimeo.com/video/' + id + '?autoplay=1&dnt=1&title=0&byline=0&portrait=0&badge=0';
    iframe.allow = 'autoplay; fullscreen; picture-in-picture; encrypted-media';
    iframe.setAttribute('allowfullscreen', '');
    iframe.title = title || 'Dillon R. Carpenter Showreel';
    container.textContent = '';
    container.appendChild(iframe);
    trackVimeoProgress(iframe, title || 'Showreel');
  }

  /* Lazy-load the Vimeo Player SDK (only after a play), then report GA4 video
     events. No SDK loads until someone actually watches. dnt=1 stays on, so
     Vimeo's own tracking is still off; the Player API works regardless. */
  var vimeoApiState = 0; // 0 idle, 1 loading, 2 ready
  var vimeoApiQueue = [];
  function withVimeoApi(cb) {
    if (vimeoApiState === 2) { cb(); return; }
    vimeoApiQueue.push(cb);
    if (vimeoApiState === 1) return;
    vimeoApiState = 1;
    var s = document.createElement('script');
    s.src = 'https://player.vimeo.com/api/player.js';
    s.async = true;
    s.onload = function () {
      vimeoApiState = 2;
      vimeoApiQueue.forEach(function (fn) { fn(); });
      vimeoApiQueue = [];
    };
    s.onerror = function () { vimeoApiState = 0; vimeoApiQueue = []; }; // give up quietly; playback still works
    document.head.appendChild(s);
  }

  function trackVimeoProgress(iframe, title) {
    withVimeoApi(function () {
      if (!(window.Vimeo && window.Vimeo.Player)) return;
      var player = new window.Vimeo.Player(iframe);
      var started = false;
      var thresholds = [10, 25, 50, 75];
      var hit = {};
      var dur = 0;
      player.getDuration().then(function (d) { dur = d || 0; }).catch(function () {});
      player.on('play', function () {
        if (started) return;
        started = true;
        track('video_start', { video_provider: 'vimeo', video_title: title });
      });
      player.on('timeupdate', function (data) {
        var pct = Math.floor((data.percent || 0) * 100);
        for (var i = 0; i < thresholds.length; i++) {
          var m = thresholds[i];
          if (pct >= m && !hit[m]) {
            hit[m] = true;
            track('video_progress', {
              video_provider: 'vimeo',
              video_title: title,
              video_percent: m,
              video_current_time: Math.round(data.seconds || 0),
              video_duration: Math.round(data.duration || dur)
            });
          }
        }
      });
      player.on('ended', function (data) {
        track('video_complete', {
          video_provider: 'vimeo',
          video_title: title,
          video_percent: 100,
          video_duration: Math.round((data && data.duration) || dur)
        });
      });
    });
  }

  var reelFrame = document.getElementById('reel-frame');
  var reelPlay = document.getElementById('reel-play');
  if (reelFrame && reelPlay) {
    reelPlay.addEventListener('click', function () {
      if (/^\d+$/.test(VIMEO_REEL_ID)) {
        mountVimeo(reelFrame, VIMEO_REEL_ID, 'Showreel');
        track('reel_play', { id: VIMEO_REEL_ID });
      } else {
        var note = document.getElementById('reel-note');
        if (note) note.textContent = 'The full reel is on its way to Vimeo. Check back shortly.';
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
      mountVimeo(frame, id, 'Work video');
      track('reel_play', { id: id, location: 'work' });
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
        status.textContent = 'The form isn’t wired up yet. The Formspree form ID still needs to be configured.';
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
          status.textContent = 'Got it, thanks. I’ll be in touch within one business day.';
          track('quote_submit');
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

  /* Newsletter slide-in (Field Notes). DOM built in JS so it stays CSP-clean.
     Shows once after a delay or 45% scroll, remembers dismissal/signup, and
     posts to Buttondown. No-JS visitors simply never see it. */
  (function () {
    // Dormant until a Buttondown username is configured (like the GA4 ID).
    if (BUTTONDOWN_USERNAME.indexOf('BUTTONDOWN_USERNAME') !== -1) return;
    var KEY = 'dc-nl';
    var saved = '';
    try { saved = window.localStorage.getItem(KEY) || ''; } catch (e) {}
    if (saved === 'dismissed' || saved === 'subscribed') return;
    if (!document.body) return;

    var shown = false;
    var timer = 0;

    function remember(v) { try { window.localStorage.setItem(KEY, v); } catch (e) {} }

    function build() {
      var pop = document.createElement('aside');
      pop.className = 'nl-pop';
      pop.setAttribute('role', 'dialog');
      pop.setAttribute('aria-label', 'Subscribe to Field Notes');

      var close = document.createElement('button');
      close.type = 'button';
      close.className = 'nl-close';
      close.setAttribute('aria-label', 'Close');
      close.innerHTML = '&times;';

      var eye = document.createElement('p');
      eye.className = 'nl-pop-eye';
      eye.textContent = 'Field Notes · Newsletter';

      var title = document.createElement('h2');
      title.className = 'nl-pop-title';
      title.textContent = 'Notes worth keeping.';

      var copy = document.createElement('p');
      copy.className = 'nl-pop-copy';
      copy.textContent = 'New Field Notes on video and marketing, straight to your inbox. No spam, unsubscribe anytime.';

      var form = document.createElement('form');
      form.className = 'nl-pop-form';
      form.action = 'https://buttondown.com/api/emails/embed-subscribe/' + BUTTONDOWN_USERNAME;
      form.method = 'post';
      form.target = '_blank';
      form.rel = 'noopener';

      var label = document.createElement('label');
      label.className = 'visually-hidden';
      label.setAttribute('for', 'nl-email');
      label.textContent = 'Email address';

      var input = document.createElement('input');
      input.type = 'email';
      input.name = 'email';
      input.id = 'nl-email';
      input.required = true;
      input.autocomplete = 'email';
      input.placeholder = 'you@example.com';

      var btn = document.createElement('button');
      btn.type = 'submit';
      btn.className = 'btn btn-fill nl-pop-btn';
      btn.textContent = 'Subscribe';

      var status = document.createElement('p');
      status.className = 'nl-pop-status';
      status.setAttribute('role', 'status');
      status.setAttribute('aria-live', 'polite');

      form.appendChild(label);
      form.appendChild(input);
      form.appendChild(btn);
      pop.appendChild(close);
      pop.appendChild(eye);
      pop.appendChild(title);
      pop.appendChild(copy);
      pop.appendChild(form);
      pop.appendChild(status);
      document.body.appendChild(pop);

      function hide(mark) {
        pop.classList.remove('nl-open');
        if (mark) remember(mark);
        if (mark === 'dismissed') track('newsletter_dismiss');
        setTimeout(function () { if (pop.parentNode) pop.parentNode.removeChild(pop); }, 550);
      }

      close.addEventListener('click', function () { hide('dismissed'); });
      document.addEventListener('keydown', function (e) {
        if ((e.key === 'Escape' || e.keyCode === 27) && pop.classList.contains('nl-open')) hide('dismissed');
      });

      form.addEventListener('submit', function (e) {
        if (BUTTONDOWN_USERNAME.indexOf('BUTTONDOWN_USERNAME') !== -1) {
          e.preventDefault();
          status.className = 'nl-pop-status err';
          status.textContent = 'The newsletter isn’t wired up yet.';
          return;
        }
        if (!window.fetch) return; // no fetch: fall through to native POST (opens a tab)
        e.preventDefault();
        btn.disabled = true;
        status.className = 'nl-pop-status';
        status.textContent = 'Signing you up…';
        // Buttondown's embed endpoint isn't CORS-readable, so submit opaque and
        // optimistically confirm (Buttondown double-opt-ins by email anyway).
        fetch(form.action, { method: 'POST', mode: 'no-cors', body: new FormData(form) })
          .then(function () {
            status.className = 'nl-pop-status ok';
            status.textContent = 'Almost there. Check your inbox to confirm.';
            remember('subscribed');
            track('newsletter_subscribe');
            setTimeout(function () { hide(); }, 4000);
          })
          .catch(function () {
            btn.disabled = false;
            status.className = 'nl-pop-status err';
            status.textContent = 'Something went sideways. Please try again.';
          });
      });

      requestAnimationFrame(function () {
        requestAnimationFrame(function () { pop.classList.add('nl-open'); });
      });
      track('newsletter_shown');
    }

    function trigger() {
      if (shown) return;
      shown = true;
      if (timer) clearTimeout(timer);
      window.removeEventListener('scroll', onScroll);
      build();
    }

    function onScroll() {
      var el = document.documentElement;
      var max = el.scrollHeight - el.clientHeight;
      if (max > 0 && el.scrollTop / max > 0.45) trigger();
    }

    timer = setTimeout(trigger, 18000);
    window.addEventListener('scroll', onScroll, { passive: true });
  })();
})();
