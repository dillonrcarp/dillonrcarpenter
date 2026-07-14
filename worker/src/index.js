/**
 * Field Notes -> Buttondown draft creator.
 *
 * On a daily cron, reads the blog RSS feed and creates a Buttondown DRAFT for
 * any post it has not seen before. It NEVER sends: every email is created with
 * status "draft", so you review and send it yourself from Buttondown. This is a
 * free stand-in for Buttondown's pay-gated RSS-to-email feature.
 *
 * Deployed SEPARATELY from the Pages site. See ./README.md.
 */

const BUTTONDOWN_EMAILS = 'https://api.buttondown.com/v1/emails';

export default {
  // Daily cron entrypoint.
  async scheduled(event, env, ctx) {
    ctx.waitUntil(run(env));
  },

  // Optional manual trigger for testing: GET /?key=<MANUAL_TRIGGER_KEY>
  // Returns 404 unless the key matches, so nobody else can trigger a run.
  async fetch(request, env) {
    const key = new URL(request.url).searchParams.get('key');
    if (!env.MANUAL_TRIGGER_KEY || key !== env.MANUAL_TRIGGER_KEY) {
      return new Response('Not found', { status: 404 });
    }
    return Response.json(await run(env));
  },
};

async function run(env) {
  if (!env.BUTTONDOWN_API_KEY) return { error: 'BUTTONDOWN_API_KEY secret is not set' };

  const res = await fetch(env.FEED_URL, {
    headers: { 'user-agent': 'dillonrcarpenter-newsletter-worker' },
    cf: { cacheTtl: 0 },
  });
  if (!res.ok) return { error: `feed fetch failed: ${res.status}` };

  const items = parseItems(await res.text());
  const created = [];
  const skipped = [];

  for (const item of items) {
    const id = item.guid || item.link;
    if (!id) continue;
    if (await env.SEEN.get(id)) { skipped.push(id); continue; } // already drafted

    if (await createDraft(env, item)) {
      await env.SEEN.put(id, new Date().toISOString());
      created.push(id);
    }
  }
  return { checked: items.length, created, skipped };
}

async function createDraft(env, item) {
  const body = [
    item.description || '',
    '',
    `Read the full Field Note: ${item.link}`,
  ].join('\n');

  const res = await fetch(BUTTONDOWN_EMAILS, {
    method: 'POST',
    headers: {
      Authorization: `Token ${env.BUTTONDOWN_API_KEY}`,
      'Content-Type': 'application/json',
    },
    // status: "draft" is explicit and non-negotiable here. This Worker never sends.
    body: JSON.stringify({
      subject: item.title || 'New Field Note',
      body,
      status: 'draft',
    }),
  });

  if (!res.ok) {
    console.log('Buttondown draft failed', res.status, await res.text());
    return false;
  }
  return true;
}

/* --- tiny dependency-free RSS parser --- */

function parseItems(xml) {
  return (xml.match(/<item\b[\s\S]*?<\/item>/g) || []).map((block) => ({
    title: tag(block, 'title'),
    link: tag(block, 'link'),
    guid: tag(block, 'guid'),
    description: tag(block, 'description'),
  }));
}

function tag(block, name) {
  const m = new RegExp(`<${name}\\b[^>]*>([\\s\\S]*?)</${name}>`).exec(block);
  if (!m) return '';
  return decode(m[1].replace(/^\s*<!\[CDATA\[/, '').replace(/\]\]>\s*$/, '').trim());
}

function decode(s) {
  return s
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#0?39;/g, "'")
    .replace(/&apos;/g, "'").replace(/&amp;/g, '&');
}
