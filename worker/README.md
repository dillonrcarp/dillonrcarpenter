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

## Deploy via the Cloudflare dashboard (no CLI)

All of this works in the browser. When you configure a Worker in the dashboard,
the repo's `wrangler.toml` is **not** used — you set the binding, variables, and
cron in the dashboard instead. The names must match the code exactly: `SEEN`,
`FEED_URL`, `BUTTONDOWN_API_KEY`, and (optional) `MANUAL_TRIGGER_KEY`.

1. **Create the KV namespace.** Dashboard → *Storage & Databases → KV* →
   "Create a namespace" → name it e.g. `newsletter-seen`.
2. **Create the Worker.** *Workers & Pages → Create → Workers* → start from
   "Hello World" → name it `dillonrcarpenter-newsletter` → Deploy. Then
   **Edit code**: delete the starter and paste the full contents of
   `src/index.js` from this folder → Deploy.
3. **Bind the KV namespace.** The Worker → *Settings → Bindings → Add → KV
   namespace*. Variable name **`SEEN`**, namespace `newsletter-seen` → Deploy.
4. **Add the variable + secrets.** *Settings → Variables and Secrets*:
   - Plaintext variable **`FEED_URL`** = `https://dillonrcarpenter.com/blog/feed.xml`
   - Secret **`BUTTONDOWN_API_KEY`** = your key from Buttondown → Settings → API
     (mark it **Encrypt/secret** so it's hidden).
   - Optional secret **`MANUAL_TRIGGER_KEY`** = any random string (guards the test URL).
   - Deploy after adding.
5. **Add the cron trigger.** *Settings → Triggers → Cron Triggers → Add* →
   `0 13 * * *` (daily, 13:00 UTC) → Add.

To test, open `https://dillonrcarpenter-newsletter.<your-subdomain>.workers.dev/?key=YOUR_MANUAL_TRIGGER_KEY`
and check Buttondown for a new draft. (Dashboard labels shift as Cloudflare
updates; go by the feature names: KV, Bindings, Variables and Secrets, Cron Triggers.)

## Alternative: setup via CLI (wrangler)

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
