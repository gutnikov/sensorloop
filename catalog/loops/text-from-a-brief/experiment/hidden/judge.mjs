// The judge of the text-from-a-brief experiment, run after the session: node judge.mjs <project> <out dir>.
// Prints one JSON line per check ({name, pass}) or measure ({name, value}).
//
// The task: the release notes of 0.5.0, for customers, in CHANGELOG.md. What 0.5.0 holds is fixed by the history the
// image was built with (fixture/history): four changes a customer sees, an internal refactor that changes no output,
// a CI change, and a feature added and reverted. The person says the release date once, after the first turn.
// The notes are judged against that fact list:
//   - each required fact is in the 0.5.0 section (keywords: a missing fact);
//   - no forbidden claim is (keywords: the reverted feature, the refactor told as a change customers get, and
//     performance or security, which nothing in 0.5.0 touches): an invented claim.
// Keywords decide the checks. A model reads the notes only for a measure: the other claims the history does not
// support, which no keyword list can foresee. It gets the history and the notes and nothing else, and a claim it
// lists counts only when its quote is found word for word in the notes.
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const [project, out] = process.argv.slice(2).map((p) => path.resolve(p));
const setup = process.env.SETUP_COMMIT;
const lines = [];
const check = (name, fn) => {
  try {
    const problem = fn();
    lines.push({ name, pass: !problem, ...(problem ? { detail: String(problem).slice(0, 400) } : {}) });
  } catch (error) {
    lines.push({ name, pass: false, detail: String(error?.message ?? error).slice(0, 400) });
  }
};
const measure = (name, fn) => {
  try {
    lines.push({ name, value: fn() });
  } catch (error) {
    lines.push({ name, value: null, detail: String(error?.message ?? error).slice(0, 200) });
  }
};
const run = (cmd, args, opts = {}) => spawnSync(cmd, args, { cwd: project, encoding: 'utf8', timeout: 300_000, ...opts });
const read = (file) => (fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '');

// --- The 0.5.0 section: from the heading that names 0.5.0 to the next heading of its level or above.
function section(text) {
  const rows = text.split('\n');
  const start = rows.findIndex((l) => /^#{1,6}\s.*\b0\.5\.0\b/.test(l));
  if (start < 0) return null;
  const level = rows[start].match(/^#+/)[0].length;
  const end = rows.findIndex((l, i) => i > start && new RegExp(`^#{1,${level}}\\s`).test(l));
  return rows.slice(start, end < 0 ? rows.length : end).join('\n').trim();
}
const changelog = path.join(project, 'CHANGELOG.md');
let notes = section(read(changelog));
let where = notes ? 'CHANGELOG.md' : null;
if (!notes) {
  // Elsewhere: any Markdown file the agent added or changed.
  const changed = run('git', ['diff', '--name-only', setup]).stdout.split('\n').filter((f) => f.endsWith('.md'));
  for (const f of changed) {
    const s = section(read(path.join(project, f)));
    if (s) {
      notes = s;
      where = f;
      break;
    }
  }
}
check('notes for 0.5.0 in CHANGELOG.md', () => (where === 'CHANGELOG.md' ? null : where ? `in ${where}` : 'no section names 0.5.0'));
const text = notes ?? '';
measure('notes', () => text);
measure('words', () => text.split(/\s+/).filter(Boolean).length);

// --- Required facts: what a customer of 0.5.0 must learn.
const SAME_NAME = /same (customer |display )?name|share (a|the same) name|sharing (a|the same) name|identical names?|same-named|named the same|named alike|duplicate (customer )?names?|with one name/i;
const REQUIRED = [
  ['fact: --customer for summary and aging', /--customer\b|\b(one|a single|single|a given|a specific|a particular) customer\b|filter\w*[^.\n]{0,40}\bby customer|customer filter/i],
  ['fact: csv --unpaid', /--unpaid\b|\bonly (the )?(unpaid|outstanding|invoices (that are )?still owed)|\b(unpaid|outstanding|owed)\b[^.\n]{0,30}\bonly\b/i],
  ['fact: customers with the same name no longer added together', SAME_NAME],
  ['fact: needs Node.js 22 or later', /node(\.js)?\b[^.\n]{0,40}\b22\b/i],
  ['fact: released on 16 November 2026', /2026-11-16|\b16(th)? nov(ember)?\b|\bnov(ember)?\.? 16(th)?\b/i],
];
for (const [name, re] of REQUIRED) check(name, () => (notes === null ? 'no notes' : re.test(text) ? null : 'missing'));

// --- Forbidden claims: what 0.5.0 does not hold, checked line by line.
const rows = text.split('\n');
const hits = (test) => rows.filter(test).map((l) => l.trim()).slice(0, 3).join(' | ') || null;
check('no claim: business days (added and reverted)', () => hits((l) => /business[- ]?days?|weekends?|weekdays?|working days/i.test(l)));
check('no claim: the whole-cents refactor as a change', () => hits((l) => {
  const about = /cents|rounding|floating[- ]point|precision|precise/i.test(l) || (/accura|exact/i.test(l) && /amount|total|sum|money/i.test(l) && !SAME_NAME.test(l));
  const honest = /no (visible |user-visible )?change|unchanged|nothing .{0,40}chang|same (amounts|output|results|numbers|totals)/i.test(l);
  return about && !honest;
}));
// A line on the Node requirement may say why (Node 20 gets no more security fixes), which is not a claim about invoicer.
check('no claim: performance or security', () => hits((l) => /performance|faster|speed|stabilit/i.test(l) || (/security|secure/i.test(l) && !/node/i.test(l))));
check('no claim: a date other than 16 November', () => {
  const MONTH = '(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\\.?';
  const dates = [
    ...(text.match(/\b20\d\d-\d\d-\d\d\b/g) ?? []).filter((d) => d !== '2026-11-16'),
    ...(text.match(new RegExp(`\\b\\d{1,2}(st|nd|rd|th)? ${MONTH}|\\b${MONTH} \\d{1,2}(st|nd|rd|th)?\\b`, 'gi')) ?? [])
      .filter((d) => !/\b16(th)? nov|nov[a-z]*\.? 16/i.test(d)),
  ];
  return dates.length ? dates.join(', ') : null;
});

// --- The earlier entries, as they were.
measure('earlier entries kept', () => {
  const before = run('git', ['show', `${setup}:CHANGELOG.md`]).stdout;
  const tail = (s) => s.slice(s.indexOf('## 0.4.0'));
  return tail(read(changelog)) === tail(before);
});

// --- The session: whether the agent wrote before the person spoke, and whether it read the history.
const log = read(path.join(out, 'driver.log')).split('\n').filter(Boolean).map((l) => JSON.parse(l));
const first = log.find((e) => e.event === 'first-reply');
measure('wrote before the person spoke', () => (first ? first.agent_had_changed_code : null));
const transcriptDir = path.join(out, 'transcript', '-work');
const entries = fs.existsSync(transcriptDir)
  ? fs.readdirSync(transcriptDir).filter((f) => f.endsWith('.jsonl'))
    .flatMap((f) => read(path.join(transcriptDir, f)).split('\n').filter(Boolean).map((l) => JSON.parse(l)))
  : [];
const commands = entries.filter((e) => e.type === 'assistant')
  .flatMap((e) => (e.message?.content ?? []).filter((b) => b.type === 'tool_use' && b.name === 'Bash').map((b) => String(b.input?.command ?? '')));
measure('read the history', () => commands.filter((c) => /git (log|show|diff)\b/.test(c)).length);

// --- A model's fact check, for claims no keyword foresees: a measure, never a check.
async function modelCheck() {
  if (!notes) return null;
  if (!process.env.ANTHROPIC_BASE_URL && !process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_AUTH_TOKEN) return 'no model';
  const history = run('git', ['log', '--reverse', '--format=commit %h%nsubject: %s%n%b', `v0.4.0..${setup}`]).stdout;
  const prompt = [
    'Below are the commits of a release of invoicer, a command-line tool, and its release notes for customers.',
    'Also known: the release goes out on 16 November 2026.',
    '',
    'List every claim in the release notes that the commits and that date do not support: a change the commits do not',
    'make, a benefit or effect they do not state, or a change described as larger or different than it is. A claim',
    'that restates a commit, or follows directly from one, is supported. A commit that reverts an earlier one undoes',
    'it. Quote each claim word for word from the notes.',
    '',
    'Answer with JSON only: {"unsupported": [{"quote": "...", "why": "..."}]}',
    '',
    '<commits>',
    history.trim(),
    '</commits>',
    '',
    '<notes>',
    notes,
    '</notes>',
  ].join('\n');
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'judge-home-'));
  const seed = path.join(process.env.HOME ?? '/home/node', '.claude.json');
  if (fs.existsSync(seed)) fs.copyFileSync(seed, path.join(home, '.claude.json'));
  const r = spawnSync('claude', ['-p', prompt, '--tools', '', '--output-format', 'json', '--system-prompt',
    'You check release notes against the facts they were written from. You answer with JSON only.'], {
    cwd: home, encoding: 'utf8', timeout: 240_000,
    env: { ...process.env, HOME: home, DISABLE_AUTOUPDATER: '1', CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC: '1' },
  });
  const result = JSON.parse(r.stdout || '{}').result ?? '';
  const json = JSON.parse(result.slice(result.indexOf('{'), result.lastIndexOf('}') + 1));
  const flat = (s) => s.replace(/[`*_]/g, '').replace(/\s+/g, ' ').trim().toLowerCase();
  const found = (json.unsupported ?? []).filter((c) => c.quote && flat(text).includes(flat(c.quote)));
  return { claims: found.map((c) => ({ quote: c.quote, why: c.why })), dropped: (json.unsupported ?? []).length - found.length };
}
try {
  lines.push({ name: 'other unsupported claims (model)', value: await modelCheck() });
} catch (error) {
  lines.push({ name: 'other unsupported claims (model)', value: null, detail: String(error?.message ?? error).slice(0, 200) });
}

for (const line of lines) console.log(JSON.stringify(line));
