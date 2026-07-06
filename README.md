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

After changing `styles.css` or `site.js`, bump the `?v=` query string in
`index.html` to bust the 30-day cache.

## Security posture (hardened beyond eastondivision)

All headers ship from `public/_headers` (Cloudflare Pages syntax):

- **Content-Security-Policy** — `default-src 'none'` allowlist. No inline scripts or
  styles anywhere in the site. Only `player.vimeo.com` may be framed; forms may only
  POST to Formspree; scripts only from self + googletagmanager (the one documented
  exception, for GA4 — gtag.js cannot be SRI-pinned by design).
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

## Updating rates

Prices appear in exactly two places and must stay in sync:
the Services rate rows and the `PriceSpecification` blocks in the JSON-LD
(both in `public/index.html`).
