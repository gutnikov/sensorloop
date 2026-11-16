#!/usr/bin/env node
// sensorloop: the check of user-feedback, from a Claude Code hook. Copied into the project as
// .sensorloop/hooks/feedback.mjs.
//
//   feedback.mjs <id pattern>     SessionStart: notes where the session began. Stop: checks the tag.
//
// The feedback items are the ids (`FB-[0-9]+`) in the person's messages of the session's transcript. Once the session
// has changed the code (src/), each item needs a test, added or changed in the session, whose name holds its id
// (`it('FB-112: ...')`). A missing one is printed to stderr with exit 2, so the turn goes on; the same failure three
// times in a row hands the work to the person instead. A session that has not changed the code is not checked.
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const LABEL = 'feedback';
const pattern = new RegExp(`\\b(${process.argv[2] ?? 'FB-[0-9]+'})\\b`, 'g');
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

/** What the person wrote in this session: their messages, not tool results, commands or hook feedback. */
function personMessages() {
  const file = input.transcript_path;
  if (!file || !fs.existsSync(file)) return [];
  const texts = [];
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    let e;
    try {
      e = JSON.parse(line);
    } catch {
      continue;
    }
    if (e.type !== 'user' || e.isMeta) continue;
    const c = e.message?.content;
    const text = typeof c === 'string' ? c
      : Array.isArray(c) && !c.some((b) => b.type === 'tool_result') ? c.filter((b) => b.type === 'text').map((b) => b.text).join('\n') : '';
    if (text && !/<command-name>|<local-command|<command-message>|sensorloop:|hook feedback/i.test(text)) texts.push(text);
  }
  return texts;
}

/** The names of the tests in a file: the titles of its it(), test() and describe() calls. */
function testNames(file) {
  const text = fs.readFileSync(path.join(project, file), 'utf8');
  const title = /\b(?:it|test|describe)(?:\.\w+)*\s*\(\s*(['"`])((?:\\.|(?!\1)[^\\])*)\1/g;
  return [...text.matchAll(title)].map((m) => m[2]);
}

/** A test name holds an id when it has its letters and its number, written FB-112, FB112 or FB 112. */
const holds = (name, id) => {
  const [, letters, number] = id.match(/^([A-Za-z]+)[\s-]*(\d+)$/) ?? [null, id, ''];
  return new RegExp(`\\b${letters}[\\s-]*${number}\\b`, 'i').test(name);
};

const streakFile = path.join(state, `${LABEL}.streak`);
const code = changed('src');
const items = [...new Set(personMessages().flatMap((t) => [...t.matchAll(pattern)].map((m) => m[1].toUpperCase())))];
if (!code.length || !items.length) {
  fs.rmSync(streakFile, { force: true });
  process.exit(0);
}
const testFiles = changed('.').filter((f) => /\.(test|spec)\.[cm]?[jt]sx?$/.test(f) && fs.existsSync(path.join(project, f)));
const names = testFiles.flatMap(testNames);
const missing = items.filter((id) => !names.some((n) => holds(n, id)));
if (!missing.length) {
  fs.rmSync(streakFile, { force: true });
  process.exit(0);
}

// The same failure three times in a row at the end of a turn: over to the person.
const key = createHash('sha256').update(missing.join(',')).digest('hex').slice(0, 12);
const [previous, count] = (fs.existsSync(streakFile) ? fs.readFileSync(streakFile, 'utf8') : '').trim().split(' ');
const streak = previous === key ? Number(count) + 1 : 1;
fs.writeFileSync(streakFile, `${key} ${streak}\n`);
if (streak >= 3) {
  fs.rmSync(streakFile, { force: true });
  const message = `sensorloop: ${LABEL} still has no test that names ${missing.join(', ')} after 3 rounds; over to you.`;
  process.stdout.write(`${JSON.stringify({ systemMessage: message })}\n`);
  process.exit(0);
}
process.stderr.write([
  `sensorloop: ${LABEL} failed. The code changed (${code.slice(0, 4).join(', ')}) for ${missing.join(', ')}, and no test`,
  `added or changed in this session names ${missing.length > 1 ? 'them' : 'it'}.`,
  'Code for a feedback item is built from criteria the person approved. If they have not approved any yet, put src/',
  'back as it was and send them your draft criteria, with the user\'s words beside them: the code waits for their',
  `answer. If they have, each criterion gets a test named after the item (\`it('${missing[0]}: ...')\`) that fails on`,
  'the code before your change and passes after it.',
].join('\n') + '\n');
process.exit(2);
