#!/usr/bin/env node
// sensorloop: triage of the tracker in issues/. Copied into the project as .sensorloop/hooks/triage.mjs.
//
//   node .sensorloop/hooks/triage.mjs     prints the report (the agent runs it before picking up an item)
//   triage.mjs --hook                     from UserPromptSubmit: the same report, once per session, as context
//
// For each item labelled `ready`, it lists the items that look like it (open and closed, ranked by the rare words
// they share in their title and text) and what it lacks to be worked. It decides nothing and writes nothing: the agent
// reads each candidate, and flags in the item's file a duplicate, an item short of information, or a kind that is
// wrong (a bug asking to change what a closed feature chose).
import fs from 'node:fs';
import path from 'node:path';

const hook = process.argv.includes('--hook');
const input = hook ? JSON.parse(fs.readFileSync(0, 'utf8') || '{}') : {};
const project = process.env.CLAUDE_PROJECT_DIR || input.cwd || process.cwd();
const dir = path.join(project, 'issues');
if (!fs.existsSync(dir)) process.exit(0);

// Once per session from the hook: the report is in the context from the first prompt on.
if (hook) {
  const state = path.join(project, '.sensorloop', 'state');
  fs.mkdirSync(state, { recursive: true });
  const seen = path.join(state, `triage-${input.session_id ?? 'unknown'}`);
  if (fs.existsSync(seen)) process.exit(0);
  fs.writeFileSync(seen, new Date().toISOString());
}

/** An item: its front matter, its text without the comments, and its words. */
function read(file) {
  const raw = fs.readFileSync(path.join(dir, file), 'utf8');
  const [, front = '', body = raw] = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/) ?? [];
  const field = (name) => front.match(new RegExp(`^${name}:\\s*(.*)$`, 'm'))?.[1].trim().replace(/^["']|["']$/g, '') ?? '';
  const text = body.split(/^## Comments/m)[0];
  return {
    file,
    number: field('number') || file.match(/^(\d+)/)?.[1] || '',
    title: field('title'),
    type: field('type'),
    status: field('status'),
    labels: (field('labels').match(/[\w-]+/g) ?? []),
    assignee: field('assignee'),
    reporter: field('reporter'),
    opened: field('opened'),
    text,
  };
}
const items = fs.readdirSync(dir).filter((f) => /^\d+.*\.md$/.test(f)).map(read)
  .sort((a, b) => Number(a.number) - Number(b.number));

const STOP = new Set(('the and for are but not you all any can had her was one our out has his how its may new now see way who did ' +
  'get got let put say she too use with that this from they them then than when what which while will would should could ' +
  'there their these those into onto over under about after before because instead other some such only also just very ' +
  'here each every both does doesn done have having been being were your yours mine ours please thanks invoicer issue ' +
  'like look looks make makes made want wants need needs know think time times day days file files invoice inv').split(' '));
const stem = (w) => w.replace(/ies$/, 'y').replace(/(?<=[a-z]{3}[^s])s$/, '');
const words = (it) => new Set(`${it.title} ${it.text}`.toLowerCase().replace(/[^a-z0-9]+/g, ' ').split(' ')
  .filter((w) => w.length >= 3 && !/^\d+$/.test(w) && !STOP.has(w)).map(stem));
for (const it of items) it.words = words(it);
// A word shared by few items says more than one most of them use.
const df = new Map();
for (const it of items) for (const w of it.words) df.set(w, (df.get(w) ?? 0) + 1);
const idf = (w) => Math.log((items.length + 1) / (df.get(w) ?? 1));

function lookalikes(item) {
  return items.filter((o) => o !== item).map((o) => {
    const shared = [...item.words].filter((w) => o.words.has(w)).sort((a, b) => idf(b) - idf(a));
    return { o, shared, score: shared.reduce((s, w) => s + idf(w), 0) };
  }).filter((c) => c.shared.length >= 2 && c.score >= 3).sort((a, b) => b.score - a.score).slice(0, 3);
}

/** What an item lacks to be worked: for a bug, a way to see it and an example; for any item, its fields. */
function lacks(item) {
  const missing = ['type', 'status', 'reporter', 'opened'].filter((f) => !item[f]).map((f) => `the field ${f}`);
  if (!item.text.trim()) missing.push('a description');
  if (item.type === 'bug') {
    const command = /```|`[^`\n]*\b(npm|npx|node|invoicer|tsx)\b[^`\n]*`/.test(item.text);
    const example = /\b[A-Z]{2,}-\d+\b|\$\s?\d|\d+[.,]\d{2}\b|```|\b\d{4}-\d{2}-\d{2}\b/.test(item.text);
    if (!command) missing.push('a way to see it (a command, or steps)');
    if (!example) missing.push('an example (an invoice, or the figures seen and expected)');
  }
  return missing;
}

const ready = items.filter((it) => it.status === 'open' && it.labels.includes('ready'));
const describe = (o) => `#${o.number} "${o.title}" (${[o.type, o.status, ...o.labels, o.assignee && `assignee ${o.assignee}`].filter(Boolean).join(', ')})`;
const out = [
  `sensorloop triage: ${ready.length} item(s) labelled ready in issues/. Before you work one, read the items that look`,
  'like it, and decide: a duplicate of an open item, short of information, or the wrong kind (a bug that asks to',
  'change what a feature chose is a new requirement). Flag such an item in its file under ## Comments, and do not',
  'work it. This report decides nothing.',
  '',
];
for (const item of ready) {
  out.push(`#${item.number} "${item.title}" (${item.type || 'no type'})`);
  const similar = lookalikes(item);
  if (!similar.length) out.push('  looks like: no other item');
  for (const { o, shared } of similar) {
    out.push(`  looks like: ${describe(o)}; shared words: ${shared.slice(0, 6).join(', ')}`);
    if (item.type === 'bug' && o.type === 'feature' && o.status === 'closed') {
      out.push(`    #${o.number} is a closed feature: if #${item.number} asks to change what #${o.number} chose, it is a new requirement, not a bug.`);
    }
    if (o.status === 'open' && o.labels.includes('in-progress')) {
      out.push(`    #${o.number} is in progress${o.assignee ? ` (${o.assignee})` : ''}: if it is the same problem, #${item.number} joins it and is not worked.`);
    }
  }
  const missing = lacks(item);
  out.push(`  lacks: ${missing.length ? missing.join('; ') : 'nothing found'}`);
}
process.stdout.write(`${out.join('\n')}\n`);
