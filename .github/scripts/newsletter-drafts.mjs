// Reads public/blog/feed.xml and creates a Buttondown DRAFT for any post not
// already in .github/newsletter-seen.json, then updates that state file.
// It NEVER sends: every email is created with status "draft".
//
// Runs in GitHub Actions (Node 20, global fetch). No dependencies.

import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const FEED = 'public/blog/feed.xml';
const STATE = '.github/newsletter-seen.json';
const BUTTONDOWN = 'https://api.buttondown.com/v1/emails';

const apiKey = process.env.BUTTONDOWN_API_KEY;
if (!apiKey) {
  console.error('BUTTONDOWN_API_KEY is not set');
  process.exit(1);
}

const seen = existsSync(STATE) ? new Set(JSON.parse(readFileSync(STATE, 'utf8'))) : new Set();
const items = parseItems(readFileSync(FEED, 'utf8'));

let created = 0;
for (const item of items) {
  const id = item.guid || item.link;
  if (!id || seen.has(id)) continue;
  await createDraft(item);
  seen.add(id);
  created++;
  console.log('drafted:', item.title);
}

writeFileSync(STATE, JSON.stringify([...seen], null, 2) + '\n');
console.log(`done: ${created} new draft(s), ${seen.size} seen total.`);

async function createDraft(item) {
  const body = `${item.description || ''}\n\nRead the full Field Note: ${item.link}`;
  const res = await fetch(BUTTONDOWN, {
    method: 'POST',
    headers: { Authorization: `Token ${apiKey}`, 'Content-Type': 'application/json' },
    // status "draft" is explicit. This script never sends.
    body: JSON.stringify({ subject: item.title || 'New Field Note', body, status: 'draft' }),
  });
  if (!res.ok) {
    console.error('Buttondown draft failed:', res.status, await res.text());
    process.exit(1);
  }
}

/* --- tiny dependency-free RSS parser --- */
function parseItems(xml) {
  return (xml.match(/<item\b[\s\S]*?<\/item>/g) || []).map((b) => ({
    title: tag(b, 'title'),
    link: tag(b, 'link'),
    guid: tag(b, 'guid'),
    description: tag(b, 'description'),
  }));
}
function tag(b, name) {
  const m = new RegExp(`<${name}\\b[^>]*>([\\s\\S]*?)</${name}>`).exec(b);
  return m ? decode(m[1].replace(/^\s*<!\[CDATA\[/, '').replace(/\]\]>\s*$/, '').trim()) : '';
}
function decode(s) {
  return s
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#0?39;/g, "'")
    .replace(/&apos;/g, "'").replace(/&amp;/g, '&');
}
