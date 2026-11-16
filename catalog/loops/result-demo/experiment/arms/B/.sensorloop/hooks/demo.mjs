#!/usr/bin/env node
// sensorloop: the evidence check of result-demo, from a Claude Code hook. Copied into the project as
// .sensorloop/hooks/demo.mjs.
//
//   demo.mjs     SessionStart: notes where the session began. Stop: checks the hand-over.
//
// The criteria are the numbered acceptance criteria of the issue in the person's messages (the session's transcript).
// Once the session has changed the code (src/), the hand-over (the agent's last message) needs, for each criterion,
// a line that names it ("Criterion 2", "Criteria 1-3", "AC2") followed by a fenced block with a command (`$ <command>`)
// and its output. One status per criterion: shown, text only (named, with no command and output), no evidence (not
// named); and a file the hand-over names as evidence must exist (file missing). Anything but shown is printed to
// stderr with exit 2, so the turn goes on; the same statuses three times in a row hand the work to the person.
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const LABEL = 'demo';
const input = JSON.parse(fs.readFileSync(0, 'utf8') || '{}');
const project = process.env.CLAUDE_PROJECT_DIR || input.cwd || process.cwd();
const state = path.join(project, '.sensorloop', 'state');
fs.mkdirSync(state, { recursive: true });
const git = (...args) => {
  try {
    return execFileSync('git', ['-C', project, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  } catch {
    return '';
  }
};

// Where the session began, so that work committed during it still counts as its work.
const baseFile = path.join(state, `base-${input.session_id ?? 'unknown'}`);
if (input.hook_event_name === 'SessionStart') {
  if (!fs.existsSync(baseFile)) fs.writeFileSync(baseFile, git('rev-parse', 'HEAD').trim());
  process.exit(0);
}
const base = (fs.existsSync(baseFile) && fs.readFileSync(baseFile, 'utf8').trim()) || git('rev-parse', 'HEAD').trim();
const changed = (...dirs) => [...new Set(
  (git('diff', '--name-only', base, '--', ...dirs) + git('ls-files', '--others', '--exclude-standard', '--', ...dirs))
    .split('\n').filter(Boolean),
)];

function transcript() {
  const file = input.transcript_path;
  if (!file || !fs.existsSync(file)) return [];
  return fs.readFileSync(file, 'utf8').split('\n').flatMap((line) => {
    try {
      return [JSON.parse(line)];
    } catch {
      return [];
    }
  });
}
/** What the person wrote in this session: their messages, not tool results, commands or hook feedback. */
function personMessages(entries) {
  return entries.flatMap((e) => {
    if (e.type !== 'user' || e.isMeta) return [];
    const c = e.message?.content;
    const text = typeof c === 'string' ? c
      : Array.isArray(c) && !c.some((b) => b.type === 'tool_result') ? c.filter((b) => b.type === 'text').map((b) => b.text).join('\n') : '';
    return text && !/<command-name>|<local-command|<command-message>|sensorloop:|hook feedback/i.test(text) ? [text] : [];
  });
}
/** The hand-over: the last assistant message as Claude Code gives it, or else the text after its last tool call. */
function handOver(entries) {
  if (typeof input.last_assistant_message === 'string' && input.last_assistant_message.trim()) return input.last_assistant_message;
  const blocks = entries.filter((e) => e.type === 'assistant').flatMap((e) => e.message?.content ?? []);
  const last = blocks.map((b) => b.type).lastIndexOf('tool_use');
  return blocks.slice(last + 1).filter((b) => b.type === 'text').map((b) => b.text).join('\n');
}

/** The issue's criteria: the numbers of the items listed after "Acceptance criteria" (1., 2) or AC3.). */
function criteria(messages) {
  const found = new Set();
  for (const text of messages) {
    const at = text.search(/acceptance criteria/i);
    if (at < 0) continue;
    for (const m of text.slice(at).matchAll(/^\s*(?:[-*]\s+)?(?:AC\s*-?\s*)?(\d+)[.):]\s+\S/gim)) found.add(Number(m[1]));
  }
  return [...found].sort((a, b) => a - b);
}

/** The numbers a line names: "Criterion 2", "Criteria 1, 3 and 4", "Criteria 1-3", "AC2". */
function named(line) {
  const numbers = new Set();
  for (const m of line.matchAll(/\b(?:criteri(?:on|a)|AC)\s*#?\s*-?\s*(\d+(?:\s*(?:,|and|&|-|–|to)\s*\d+)*)/gi)) {
    for (const part of m[1].split(/\s*(?:,|and|&)\s*/)) {
      const range = part.match(/^(\d+)\s*(?:-|–|to)\s*(\d+)$/);
      if (range) for (let n = Number(range[1]); n <= Number(range[2]); n++) numbers.add(n);
      else if (/^\d+$/.test(part)) numbers.add(Number(part));
    }
  }
  return numbers;
}

/** For each criterion, whether the hand-over shows it: a fenced block with `$ <command>` and output, under its name. */
function statuses(text, ids) {
  const shown = new Set();
  const mentioned = new Set();
  let current = new Set();
  let fence = null;
  for (const line of text.split('\n')) {
    if (/^\s*(```|~~~)/.test(line)) {
      if (fence === null) {
        fence = [];
        continue;
      }
      // A block with a command and at least one line of its output.
      const prompt = (l) => /^\s*(\$|%|❯)\s+\S/.test(l);
      const start = fence.findIndex(prompt);
      if (start >= 0 && fence.slice(start + 1).some((l) => l.trim() && !prompt(l))) for (const n of current) shown.add(n);
      fence = null;
      continue;
    }
    if (fence !== null) {
      fence.push(line);
      continue;
    }
    const names = named(line);
    if (names.size) {
      current = names;
      for (const n of names) mentioned.add(n);
    }
  }
  return Object.fromEntries(ids.map((n) => [n, shown.has(n) ? 'shown' : mentioned.has(n) ? 'text only' : 'no evidence']));
}

const streakFile = path.join(state, `${LABEL}.streak`);
const entries = transcript();
const ids = criteria(personMessages(entries));
if (!changed('src').length || !ids.length) {
  fs.rmSync(streakFile, { force: true });
  process.exit(0);
}
const text = handOver(entries);
const status = statuses(text, ids);
const files = [...new Set([...text.matchAll(/(?:^|[\s`'"(])((?:\.{0,2}\/)?[\w.-]+(?:\/[\w.-]+)*\.(?:txt|png|jpe?g|gif|cast|log|out|webm|mp4|json|csv|md|html))(?=[\s`'")]|$|[.,:;])/gm)].map((m) => m[1]))]
  .filter((f) => !fs.existsSync(path.isAbsolute(f) ? f : path.join(project, f)));
const problems = [
  ...ids.filter((n) => status[n] !== 'shown').map((n) => `criterion ${n}: ${status[n]}`),
  ...files.map((f) => `${f}: file missing`),
];
if (!problems.length) {
  fs.rmSync(streakFile, { force: true });
  process.exit(0);
}

// The same statuses three times in a row at the end of a turn: over to the person.
const key = createHash('sha256').update(problems.join('\n')).digest('hex').slice(0, 12);
const [previous, count] = (fs.existsSync(streakFile) ? fs.readFileSync(streakFile, 'utf8') : '').trim().split(' ');
const streak = previous === key ? Number(count) + 1 : 1;
fs.writeFileSync(streakFile, `${key} ${streak}\n`);
if (streak >= 3) {
  fs.rmSync(streakFile, { force: true });
  const message = `sensorloop: ${LABEL} still lacks evidence after 3 rounds (${problems.join('; ')}); over to you.`;
  process.stdout.write(`${JSON.stringify({ systemMessage: message })}\n`);
  process.exit(0);
}
process.stderr.write([
  `sensorloop: ${LABEL} failed. Your hand-over does not show each acceptance criterion working:`,
  ...ids.map((n) => `  criterion ${n}: ${status[n]}`),
  ...files.map((f) => `  ${f}: file missing`),
  'For each criterion not shown, run the command that shows it and hand over again, with a line that names the',
  'criterion ("Criterion 2: ...") followed by a fenced block: `$ <command>` and its output as it printed, copied',
  'from the run. A criterion described in words is not shown.',
].join('\n') + '\n');
process.exit(2);
