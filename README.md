# dillonrcarpenter.com

Hand-built static portfolio and booking site for Dillon R. Carpenter — freelance
videographer and filmmaker in Muncie, Indiana. No framework, no build step, no CMS.
Successor to the Squarespace site; architecture mirrors
[eastondivision](https://github.com/dillonrcarp/eastondivision), hardened further.

## Stack

| Layer | Tool | Notes |
|---|---|---|
| Hosting | Cloudflare Pages | `public/` is the publish directory, deploys on push to `main` |
| Markup | Single `public/index.html` | Vanilla HTML, external stylesheet, no inline scripts/styles (CSP-clean) |
| JS | `public/site.js` | Vanilla, dependency-free: nav, scroll reveal, hero timecode, click-to-load Vimeo, Formspree fetch submit, GA4 loader |
| Design | "The Working Slate" | Film-set UI language — timecode HUD, framing brackets, SCENE numbering, REC-tally red, subtle SVG film grain (`img-src data:`) |
| Fonts | Self-hosted woff2 | Anton (display), Archivo variable (body), Space Mono 400/700 (technical), latin, `font-display: swap` |
| Video | Vimeo click-to-load facade | Poster + play button; iframe only injected on click, `dnt=1` |
| Forms | Formspree | Native `POST` fallback; JS upgrades to on-page fetch submit |
| Analytics | GA4 (dormant) | `site.js` only loads gtag once a real `G-…` ID is configured |

## Local development

```sh
npx wrangler pages dev public    # serves on :8788 and honors _headers
# or, without header emulation:
python -m http.server 8000 -d public
```

## Placeholders you must fill in before cutover

| What | Where | Notes |
|---|---|---|
| Extra `sameAs` profiles | `public/index.html` JSON-LD | Add LinkedIn/Instagram/YouTube URLs if wanted |
| Buttondown username | `public/site.js` (`BUTTONDOWN_USERNAME`) | **Set to `dillonrcarp`** — newsletter slide-in is live. (Was dormant until set, like the GA4 ID.) See **Newsletter** below. |

After changing `styles.css` or `site.js`, bump the `?v=` query string in
`index.html` to bust the 30-day cache.

## Security posture (hardened beyond eastondivision)

All headers ship from `public/_headers` (Cloudflare Pages syntax):

- **Content-Security-Policy** — `default-src 'none'` allowlist. No inline scripts or
  styles anywhere in the site. Only `player.vimeo.com` may be framed; forms may only
  POST to Formspree or Buttondown; scripts only from self, googletagmanager (GA4), and
  player.vimeo.com (the Vimeo Player SDK, lazy-loaded only after a reel play for video
  analytics). Neither third-party script can be SRI-pinned by design.
- **X-Frame-Options: DENY** + `frame-ancestors 'none'` — the site cannot be embedded.
- **Permissions-Policy** — everything off except autoplay/fullscreen/PiP delegated to
  the Vimeo player.
- **HSTS** preload, **nosniff**, **Referrer-Policy: strict-origin-when-cross-origin**,
  **COOP/CORP: same-origin**.
- Fonts self-hosted (no Google Fonts CDN); images self-hosted WebP with srcset;
  video embedded from Vimeo, never self-hosted.

## Deploying to Cloudflare Pages (GitHub auto-deploy)

1. Cloudflare dashboard → **Workers & Pages → Create → Pages →
   Connect to Git** → pick `dillonrcarp/dillonrcarpenter`.
2. Build settings: **Framework preset: None** · **Build command: (empty)** ·
   **Build output directory: `public`**.
3. Save and deploy. You get `https://dillonrcarpenter.pages.dev` plus a preview URL
   per branch/commit. Every push to `main` auto-deploys in under a minute.
4. Verify headers on the preview:
   `curl -sI https://dillonrcarpenter.pages.dev | grep -iE 'content-security|frame|permissions|strict-transport'`

## Domain cutover checklist (when *you* are ready — nothing here touches DNS)

1. **Fill every placeholder above** and confirm the form delivers to your inbox
   on the `.pages.dev` URL.
2. Cloudflare dashboard → your Pages project → **Custom domains → Add**:
   add `dillonrcarpenter.com`, then add `www.dillonrcarpenter.com`.
3. If the domain's DNS isn't on Cloudflare yet: add the site to Cloudflare
   (free plan), let it import records, then switch the **nameservers at your
   registrar** to the two Cloudflare gives you. Wait for "Active".
4. Cloudflare will create the needed `CNAME` records for apex + www pointing at
   the Pages project. Both stay proxied (orange cloud).
5. Canonical host is the **apex** (`https://dillonrcarpenter.com`). Add a redirect
   for www: Cloudflare dashboard → Rules → Redirect Rules →
   "www.dillonrcarpenter.com/* → https://dillonrcarpenter.com/$1, 301".
   (Pages serves both, but the canonical/OG/sitemap URLs all use the apex.)
6. SSL/TLS mode: **Full (strict)**. Enable **Always Use HTTPS**.
7. Test: `curl -sI https://dillonrcarpenter.com` → expect `200`, all security
   headers, and `curl -sI http://www.dillonrcarpenter.com` → `301` chain to apex.
8. In Google Search Console, add the domain property, submit
   `https://dillonrcarpenter.com/sitemap.xml`.
9. Optionally enable **Cloudflare Web Analytics** on the Pages project as a
   second, cookieless data source (its beacon would need a CSP addition:
   `script-src … https://static.cloudflareinsights.com` and
   `connect-src … https://cloudflareinsights.com`).
10. Only after everything above checks out: cancel Squarespace. The salvaged
    showreel master lives at `Downloads/dillonrcarpenter-showreel-salvaged.mp4` —
    upload it to Vimeo *before* the Squarespace CDN copy disappears.

## Adding portfolio videos later

Copy the commented stub in the Work section of `index.html`: an
`<a data-vimeo-id="123456789">` card gets upgraded by `site.js` into a
click-to-load player automatically. No other changes needed — the CSP already
allows `player.vimeo.com` frames.

## Blog ("Field Notes")

The blog is hand-authored static HTML, same as the rest of the site: no build
step, no CMS, CSP-clean. It lives under `public/blog/`:

| Path | Serves at | What it is |
|---|---|---|
| `public/blog/index.html` | `/blog/` | The log: lists every post, newest first |
| `public/blog/<slug>/index.html` | `/blog/<slug>/` | One post |
| `public/blog/feed.xml` | `/blog/feed.xml` | RSS 2.0 feed |

Styling reuses the "Working Slate" tokens and lives in the `Field Notes (blog)`
section at the bottom of `styles.css` (logbook/EDL list on the index,
`.post-body` reading typography on posts). No new CSP origins are needed:
posts use only self-hosted CSS/fonts/images. A post may embed Vimeo (already
allowed) by reusing the `data-vimeo-id` pattern from the Work section.

**To add a post:**

1. Copy `public/blog/the-video-is-done-now-what/index.html` to
   `public/blog/<new-slug>/index.html`. Update the `<title>`, meta description,
   canonical/OG URLs, the `BlogPosting` JSON-LD (headline, dates, section,
   keywords), the visible title/date/category/read-time, and the body.
2. Prepend a new `<a class="log-entry">` block to the list in
   `public/blog/index.html` (newest first) and bump the `LOG` number. Add the
   post to that page's `blogPost` JSON-LD array too.
3. Add a `<url>` for the post to `public/sitemap.xml` and prepend an `<item>`
   to `public/blog/feed.xml` (update `<lastBuildDate>`).

Write prose in Dillon's voice: first person, direct, no dashes. Category tags
so far: `Marketing`, but the blog is intentionally not niched, so craft,
production, and gear notes belong here too. Posts share the site's OG image
(`/og-image.jpg`); drop a per-post image in `public/images/` and point the OG
tags at it if you want a custom card.

## Newsletter (Buttondown)

The Field Notes newsletter is a **delayed slide-in** popup, built in `site.js`
(no HTML block, no third-party script — the DOM is created in JS so it stays
CSP-clean) and styled in `styles.css` (the `.nl-pop` block).

Behavior: it appears once, after ~18s or 45% scroll (whichever is first), is
dismissible (close button or Escape), and remembers the choice in
`localStorage` (`dc-nl` = `dismissed` or `subscribed`) so it never nags a
returning visitor. No-JS visitors never see it.

**To turn it on:**

1. Create a free [Buttondown](https://buttondown.com) account and note your
   newsletter **username**.
2. Set `BUTTONDOWN_USERNAME` in `public/site.js` and bump the `?v=` on
   `site.js` sitewide.
3. That's it — the CSP already allows `https://buttondown.com` in `connect-src`
   and `form-action`, and no script is loaded from Buttondown.

Signups post to `https://buttondown.com/api/emails/embed-subscribe/<username>`
via a `no-cors` fetch (the endpoint isn't CORS-readable, so the UI optimistically
shows "check your inbox to confirm"; Buttondown double-opt-ins by email). With
JS off, the form falls back to a native POST that opens Buttondown in a new tab.

Buttondown is the sender *and* the list — it collects and mails issues. Swapping
to another provider (MailerLite, EmailOctopus, etc.) means changing the form
`action` in `site.js` and the one CSP host in `_headers`; no other changes.

### Auto-drafting from the blog (GitHub Action)

New Field Notes become Buttondown **drafts** automatically, via
`.github/workflows/newsletter-drafts.yml` — the same in-repo GitHub Actions
pattern as eastondivision's Facebook sync (no Cloudflare Worker needed). When a
post updates `public/blog/feed.xml`, the Action runs
`.github/scripts/newsletter-drafts.mjs`, which creates a draft in Buttondown for
each new post (it **never sends**) and records it in
`.github/newsletter-seen.json`. You review and send from Buttondown.

**Setup:** add a `BUTTONDOWN_API_KEY` repository secret (GitHub → Settings →
Secrets and variables → Actions). That's the only step. Trigger a test run any
time from the Actions tab (`workflow_dispatch`). The state file is pre-seeded
with the first post, so it won't re-draft anything already published.

## Analytics events (GA4)

GA4 loads from `site.js` once `GA_MEASUREMENT_ID` is a real `G-…` ID (it is:
`G-044JQFGMR1`, stream "Portfolio"). Beyond the default Enhanced Measurement
(page views, scrolls, outbound clicks), `site.js` fires these custom events:

| Event | Fires when |
|---|---|
| `reel_play` | The showreel/Work facade is clicked (load intent). Params: `id`, plus `location: work` for grid videos |
| `video_start` | Vimeo playback actually begins (via the Player SDK, lazy-loaded on first play). Params: `video_provider`, `video_title` |
| `video_progress` | Playback passes 10 / 25 / 50 / 75%. Params add `video_percent`, `video_current_time`, `video_duration` |
| `video_complete` | The video finishes (`video_percent: 100`) |
| `quote_submit` | The quote form submits successfully |
| `newsletter_shown` | The newsletter slide-in appears |
| `newsletter_subscribe` | A visitor submits the newsletter form |
| `newsletter_dismiss` | The slide-in is closed or dismissed |

All are guarded (`typeof window.gtag === 'function'`), so they no-op when GA
isn't loaded. To count them as conversions, mark `quote_submit` and
`newsletter_subscribe` (and optionally `reel_play`) as **Key events** in
GA4 → Admin → Events. They appear in the Events report within ~24h of real
traffic.

## Updating rates

Prices appear in exactly two places and must stay in sync:
the Services rate rows and the `PriceSpecification` blocks in the JSON-LD
(both in `public/index.html`).
