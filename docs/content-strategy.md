# Content strategy: pillars & topic clusters

This is the plan the blog is built around. It exists so that when a topic is
ready, publishing a pillar page is fill-in-the-blanks, and so every Field Note
gets written on purpose instead of at random.

## The model (read this first)

A **pillar page** is a long, comprehensive guide targeting a broad topic
(e.g. "small business video marketing"). A **cluster** is a set of narrower
posts (the Field Notes) that each cover one sub-topic in depth. The pillar
links down to its clusters; every cluster links back up to its pillar. That
reciprocal linking is what builds topical authority.

Two things worth being clear about, because the instinct is usually backwards:

- **Pillar-early beats pillar-late.** You do *not* wait to accumulate a pile of
  posts and then restructure. Pages gain authority with age, so the pillar (the
  page most likely to rank for the valuable head term) is worth publishing as
  early as it can stand on its own. Plan the topics now; build clusters around
  each pillar deliberately.
- **The kernel of truth about "critical mass":** a pillar with zero clusters
  underneath it is weak. A *functioning* cluster is roughly **1 pillar + 3 to 5
  interlinked posts**, not thirty. So you don't wait for a huge library; you
  just want a pillar plus a few clusters before a topic is at full strength.

Because we are planning up front, we skip the painful big-bang reorganization
that hits blogs that grew without a plan. The "restructure" becomes continuous
interlinking instead.

## Information architecture

| Content type | Lives at | Nature | Sitemap priority |
|---|---|---|---|
| Home | `/` | Conversion | 1.0 |
| Pillars / guides | `/guides/<slug>/` | Evergreen, long-form | 0.8 |
| Guides hub | `/guides/` | Lists all pillars | 0.7 |
| Field Notes (clusters) | `/blog/<slug>/` | Dated posts | 0.6 |
| Field Notes index | `/blog/` | Lists all posts | 0.8 |

Guides are deliberately separated from Field Notes: guides are evergreen
resources, notes are dated. Keep guide `dateModified` current when you revise
them; that freshness is part of why guides rank.

## The topic-cluster map

Status legend: **live** = published, **planned** = mapped, not written.

### Pillar 1 — "Small Business Video Marketing: The Complete Guide"
Commercial intent, the digital-marketing niche. **Start here.**

| Cluster post | Status |
|---|---|
| The video is done. Now what? (`/blog/the-video-is-done-now-what/`) | **live** |
| How much should a small business video cost? | planned |
| The types of video every small business actually needs | planned |
| How to plan a promo shoot (so you don't waste the day) | planned |
| One shoot, a month of content: a repurposing system | planned |
| What to measure (and what to ignore) after you post | planned |

### Pillar 2 — "Hiring a Videographer in Muncie & East Central Indiana"
Local intent, highest conversion. **Start here too.**

| Cluster post | Status |
|---|---|
| What a local video shoot actually costs around here | planned |
| Best places to shoot in and around Muncie | planned |
| Local videographer vs. DIY vs. national agency | planned |
| Event coverage in East Central Indiana | planned |

### Pillar 3 — "Event Videography: A Guide for Organizers"
Matches the event service line. Build after 1 and 2 have traction.

| Cluster post | Status |
|---|---|
| Single vs. multi-camera: what your event needs | planned |
| The recap video that actually gets shared | planned |
| How to brief your videographer before an event | planned |

> This map is a starting point, not a contract. Reweight it toward whatever the
> business actually wants more of (non-profit work, narrative/film, etc.).

## Internal-linking rules

1. Every cluster post links **up** to its pillar, in the body where it's
   relevant and naturally, not just in a footer.
2. Every pillar links **down** to each of its clusters (the `.guide-related`
   "In this series" block, plus contextual links in the prose).
3. Clusters in the same pillar may link **sideways** to each other when it
   genuinely helps the reader.
4. The home page and nav link to the guides hub once it exists.

## When to flip the switch (launch a pillar)

Publish a pillar when **the pillar page itself is written and at least ~3 of its
clusters exist** (Pillar 1 already has 1). Until then, keep writing Field Notes
tagged to a pillar; you can retro-link them up the moment the pillar goes live.

## Checklist: publish a pillar

1. Copy `docs/templates/guide-template.html` to
   `public/guides/<slug>/index.html`; fill every `{{placeholder}}` and TODO.
2. Fill all three JSON-LD blocks (Article, BreadcrumbList, FAQPage). Keep the
   FAQ schema text identical to the visible `<details>` answers.
3. Wire cluster links both ways (pillar → clusters, and add an "up" link in
   each cluster post's body back to the pillar).
4. **Build/extend the guides hub** at `public/guides/index.html` (clone the
   pattern from `public/blog/index.html`: swap the log list for a list of
   guides). List the new pillar there.
5. **Add the "Guides" nav + footer item sitewide** — to `public/index.html`,
   `public/blog/index.html`, every post, and the hub. It is intentionally
   absent everywhere today so we never ship an empty menu item.
6. Add `<url>` entries to `public/sitemap.xml` for `/guides/` (priority 0.7)
   and the pillar (0.8), with today's `lastmod`.
7. **Bump `?v=` on `styles.css` sitewide** (the guide CSS shipped with this
   commit is `v=7`-ready; when the first guide goes live, set every page's
   `styles.css?v=` to match so the pillar styles load everywhere). Per the
   root README, any `styles.css` change gets a version bump.
8. Verify locally (`python -m http.server 8000 -d public`): the guide renders,
   the Contents anchors jump correctly under the fixed nav, the FAQ toggles
   with no JS, and breadcrumb/links resolve.

## Checklist: publish a cluster (Field Note)

Follow the "Blog (Field Notes)" section in the root `README.md`, and
additionally: add a body link **up** to the cluster's pillar (once that pillar
is live), and add the post to the pillar's `.guide-related` list.

## What already exists (foundation, shipped)

- Guide CSS in `styles.css` (`.guide-breadcrumb`, `.guide-toc`, `.guide-faq`,
  `.guide-related`) reusing the "Working Slate" tokens and the `.post-body`
  reading frame.
- The fill-in-the-blanks pillar template at `docs/templates/guide-template.html`
  (kept out of `public/` so nothing half-built deploys).
- This plan.

Nothing is linked from the public site yet. The `/guides/` hub, the nav item,
and the first pillar's content are the remaining pieces, and they go live
together per the checklist above.
