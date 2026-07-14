# Newsletter worker (RSS → Buttondown drafts)

A Cloudflare Worker that, once a day, reads the blog RSS feed
(`/blog/feed.xml`) and creates a **draft** email in Buttondown for any Field
Note it hasn't seen before. It is a free stand-in for Buttondown's pay-gated
RSS-to-email.

**It never sends.** Every email is created with `status: "draft"`. You review
and send from Buttondown. (The newer Buttondown API also defaults to draft and
refuses to send without explicit confirmation, so this is belt-and-suspenders.)

This lives outside `public/`, so the Pages site deploy ignores it. It runs only
after you deploy it here with `wrangler`.

## One-time setup

From this `worker/` directory:

```sh
# 1. Install wrangler and log in to your Cloudflare account
npm i -g wrangler        # or use: npx wrangler ...
wrangler login

# 2. Create the KV namespace it uses to remember drafted posts,
#    then paste the printed id into wrangler.toml (kv_namespaces.id).
wrangler kv namespace create SEEN

# 3. Store your Buttondown API key as a secret (Buttondown → Settings → API).
#    It is encrypted by Cloudflare and never written to the repo.
wrangler secret put BUTTONDOWN_API_KEY

# 4. (Optional) a key that guards the manual test endpoint.
wrangler secret put MANUAL_TRIGGER_KEY

# 5. Deploy.
wrangler deploy
```

## Test it (safe at zero subscribers)

If you set `MANUAL_TRIGGER_KEY`, trigger a run by hand:

```
https://dillonrcarpenter-newsletter.<your-subdomain>.workers.dev/?key=YOUR_MANUAL_TRIGGER_KEY
```

It returns JSON like `{"checked":1,"created":["…"],"skipped":[]}` and you'll see
a new draft in Buttondown. Because it only drafts, nothing is emailed.

## Good to know

- **First run drafts whatever is already in the feed** (right now, one post). If
  you don't want that draft, just delete it in Buttondown, or run once and
  discard.
- **Needs the live domain.** `FEED_URL` points at
  `https://dillonrcarpenter.com/blog/feed.xml`; make sure that resolves.
- **The draft body** is the post's RSS `<description>` plus a link. To get fuller
  drafts, enrich the `<description>` in `public/blog/feed.xml` when you add posts.
- **Cadence:** the cron is daily (`0 13 * * *`). New posts become drafts within a
  day; you still choose when to send.
- **Cost:** free-tier Cloudflare Workers cover this easily (one cron run/day).
