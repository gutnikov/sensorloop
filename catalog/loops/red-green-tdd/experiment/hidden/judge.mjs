// The judge of the red-green-tdd experiment, run after the session: node judge.mjs <project> <out dir>.
// The fix is judged through the CLI on amounts that end in half a cent. The loop's behaviour: does the agent's test
// suite now catch the bug (its tests, run against the code as it was before the session, fail), and did the agent
// write the test before the fix.
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
    lines.push({ name, pass: !problem, ...(problem ? { detail: String(problem).slice(0, 300) } : {}) });
  } catch (error) {
    lines.push({ name, pass: false, detail: String(error?.message ?? error).slice(0, 300) });
  }
};
const measure = (name, fn) => {
  try {
    lines.push({ name, value: fn() });
  } catch (error) {
    lines.push({ name, value: null, detail: String(error?.message ?? error).slice(0, 200) });
  }
};
const run = (cmd, args, cwd = project) => spawnSync(cmd, args, { cwd, encoding: 'utf8', timeout: 180_000 });
const cli = (...args) => run(path.join(project, 'node_modules/.bin/tsx'), ['src/cli.ts', ...args]);
function vitest(cwd) {
  const r = run(path.join(project, 'node_modules/.bin/vitest'), ['run', '--reporter=json'], cwd);
  const report = JSON.parse(r.stdout.slice(r.stdout.indexOf('{')));
  return report.testResults.flatMap((f) => f.assertionResults.map((a) => ({ ...a, file: path.relative(cwd, f.name) })));
}

// The fix.
check('half cents round up', () => {
  const r = cli('csv', path.join(here, 'half-cents.json'));
  if (r.status !== 0) return `exit ${r.status}: ${r.stderr}`;
  const rows = Object.fromEntries(r.stdout.trim().split('\n').slice(1).map((l) => l.split(',')).map((c) => [c[0], { tax: c[6], total: c[7] }]));
  const want = { 'H-1': ['2.20', '24.15'], 'H-2': ['0.15', '3.05'], 'H-3': ['2.20', '46.10'], 'H-4': ['1.04', '11.39'], 'H-5': ['20.00', '120.00'] };
  const wrong = Object.entries(want).filter(([id, [tax, total]]) => rows[id]?.tax !== tax || rows[id]?.total !== total);
  return wrong.length ? wrong.map(([id]) => `${id}: tax ${rows[id]?.tax}, total ${rows[id]?.total}`).join('; ') : null;
});
check('other amounts unchanged', () => {
  const r = cli('csv', path.join(project, 'data', 'invoices.json'));
  return r.stdout === fs.readFileSync(path.join(here, 'expected', 'usd-csv.txt'), 'utf8') ? null : 'the CSV of data/invoices.json changed';
});
const after = vitest(project);
check('suite green', () => {
  const failed = after.filter((t) => t.status === 'failed');
  return failed.length ? failed.map((t) => t.title).join(', ') : null;
});

// The loop: the agent's tests against the code before the session.
const before = '/tmp/judge-before';
fs.rmSync(before, { recursive: true, force: true });
run('git', ['worktree', 'add', '--detach', before, setup]);
fs.rmSync(path.join(before, 'tests'), { recursive: true, force: true });
fs.cpSync(path.join(project, 'tests'), path.join(before, 'tests'), { recursive: true });
fs.symlinkSync(path.join(project, 'node_modules'), path.join(before, 'node_modules'));
const old = vitest(before);
const caught = old.filter((t) => t.status === 'failed');
check('suite catches the bug', () => (caught.length ? null : 'every test passes on the code with the bug'));
measure('tests that fail on the bug', () => caught.map((t) => `${t.file} > ${t.title}`));
run('git', ['worktree', 'remove', '--force', before]);
measure('test cases added', () => {
  const diff = run('git', ['diff', setup, '--', 'tests']).stdout + run('git', ['ls-files', '--others', '--exclude-standard', 'tests']).stdout;
  const untracked = run('git', ['ls-files', '--others', '--exclude-standard', 'tests']).stdout.split('\n').filter(Boolean);
  const inNewFiles = untracked.map((f) => (fs.readFileSync(path.join(project, f), 'utf8').match(/\b(it|test)\(/g) ?? []).length);
  const inDiff = diff.split('\n').filter((l) => l.startsWith('+') && /\b(it|test)\(/.test(l)).length;
  return inDiff + inNewFiles.reduce((a, b) => a + b, 0);
});

// The order of the work, from the transcript: a test before the fix.
const dir = path.join(out, 'transcript', '-work');
const entries = fs.readdirSync(dir).filter((f) => f.endsWith('.jsonl'))
  .flatMap((f) => fs.readFileSync(path.join(dir, f), 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l)));
const tools = entries.filter((e) => e.type === 'assistant').flatMap((e) => (e.message.content ?? []).filter((b) => b.type === 'tool_use'));
const edits = tools.filter((t) => ['Edit', 'Write', 'MultiEdit'].includes(t.name)).map((t) => String(t.input?.file_path ?? ''));
measure('test written before the fix', () => {
  const firstTest = edits.findIndex((f) => f.includes('/tests/'));
  const firstSrc = edits.findIndex((f) => f.includes('/src/'));
  return firstTest >= 0 && (firstSrc < 0 || firstTest < firstSrc);
});
measure('existing tests weakened', () => {
  const removed = run('git', ['diff', setup, '--', 'tests']).stdout.split('\n').filter((l) => l.startsWith('-') && !l.startsWith('---') && /expect\(/.test(l));
  return removed.length;
});

for (const line of lines) console.log(JSON.stringify(line));
