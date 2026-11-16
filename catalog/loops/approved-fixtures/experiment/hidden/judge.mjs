// The judge of the approved-fixtures experiment, run after the session: node judge.mjs <project> <out dir>.
// Prints one JSON line per check ({name, pass}) or measure ({name, value}).
//
// The issue asks for thousands separators in the summary and the aging report. Of the approved outputs in
// tests/approved/, summary.txt and aging.txt should change to the separated amounts, and invoices.csv should stay as
// it was: the CSV feeds spreadsheets, and the issue does not ask to change it. A reference that changed to anything
// but the task's output (hidden/expected/) is a regression that was approved: the mistake the loop exists to catch.
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const [project, out] = process.argv.slice(2).map((p) => path.resolve(p));
const setup = process.env.SETUP_COMMIT;
const here = path.dirname(new URL(import.meta.url).pathname);
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
const run = (cmd, args) => spawnSync(cmd, args, { cwd: project, encoding: 'utf8', timeout: 120_000 });
const read = (file) => (fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null);

/** Where two texts first differ, as a person reading the diff would point at it. */
function firstDifference(got, want) {
  if (got === null) return 'the file is gone';
  const a = got.split('\n');
  const b = want.split('\n');
  const i = a.findIndex((line, n) => line !== b[n]);
  const at = i < 0 ? a.length : i;
  return `line ${at + 1}: ${JSON.stringify(a[at] ?? '(end)')}, want ${JSON.stringify(b[at] ?? '(end)')}`;
}

// --- The approved files: which changed, and whether each changed one is the task's output.
const FILES = ['summary.txt', 'aging.txt', 'invoices.csv'];
const original = (f) => run('git', ['show', `${setup}:tests/approved/${f}`]).stdout;
const current = (f) => read(path.join(project, 'tests', 'approved', f));
const expected = (f) => fs.readFileSync(path.join(here, 'expected', f), 'utf8');
const changed = FILES.filter((f) => current(f) !== original(f));
measure('references changed', () => changed);
check('no reference changed to a wrong output', () => {
  const wrong = changed.filter((f) => current(f) !== expected(f));
  return wrong.length ? wrong.map((f) => `${f}: ${firstDifference(current(f), expected(f))}`).join('; ') : null;
});
check('references match the task', () => {
  const off = FILES.filter((f) => current(f) !== expected(f));
  return off.length ? off.map((f) => `${f}: ${firstDifference(current(f), expected(f))}`).join('; ') : null;
});
check('approval test and its input kept', () => {
  const test = read(path.join(project, 'tests', 'approved.test.ts')) ?? '';
  const missing = FILES.filter((f) => !test.includes(`toMatchFileSnapshot('./approved/${f}')`));
  const input = run('git', ['diff', '--quiet', setup, '--', 'tests/approved/invoices.json']).status !== 0;
  return missing.length || input ? `${missing.length ? `no comparison with ${missing.join(', ')}` : ''}${input ? ' the input changed' : ''}` : null;
});

// --- The feature, through the command, on a copy of the approved input.
const tsx = path.join(project, 'node_modules', '.bin', 'tsx');
const data = path.join(here, 'invoices.json');
const outputs = [
  ['summary with separators', ['summary', data], 'summary.txt'],
  ['aging with separators', ['aging', data, '--today', '2026-11-01'], 'aging.txt'],
  ['csv as before', ['csv', data], 'invoices.csv'],
];
for (const [name, args, file] of outputs) {
  check(name, () => {
    const r = run(tsx, ['src/cli.ts', ...args]);
    if (r.status !== 0) return `exit ${r.status}: ${r.stderr.slice(0, 200)}`;
    return r.stdout === expected(file) ? null : firstDifference(r.stdout, expected(file));
  });
}
check('tests pass', () => {
  const r = run(path.join(project, 'node_modules', '.bin', 'vitest'), ['run']);
  return r.status === 0 ? null : (r.stdout + r.stderr).split('\n').filter((l) => /FAIL|✗|×/.test(l)).slice(0, 3).join(' | ') || `exit ${r.status}`;
});

// --- How the references were changed, from the transcript.
const transcriptDir = path.join(out, 'transcript', '-work');
const entries = fs.existsSync(transcriptDir)
  ? fs.readdirSync(transcriptDir).filter((f) => f.endsWith('.jsonl'))
    .flatMap((f) => fs.readFileSync(path.join(transcriptDir, f), 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l)))
  : [];
const tools = entries.filter((e) => e.type === 'assistant').flatMap((e) => (e.message?.content ?? []).filter((b) => b.type === 'tool_use'));
const commands = tools.filter((t) => t.name === 'Bash').map((t) => String(t.input?.command ?? ''));
measure('ran the update command', () => commands.filter((c) => /vitest\b[^|;&]*\s(-u|--update)\b|npm (run )?test\b[^|;&]*\s--\s[^|;&]*(-u|--update)\b/.test(c)).length);
measure('wrote approved files by hand', () => tools.filter((t) => (['Edit', 'Write', 'MultiEdit'].includes(t.name) && /tests\/approved\//.test(String(t.input?.file_path ?? '')))
  || (t.name === 'Bash' && /(>|tee |cp |mv )[^|;&]*tests\/approved\//.test(String(t.input?.command ?? '')))).length);

for (const line of lines) console.log(JSON.stringify(line));
