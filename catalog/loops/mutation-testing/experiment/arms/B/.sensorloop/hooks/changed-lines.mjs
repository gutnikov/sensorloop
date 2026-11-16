#!/usr/bin/env node
// sensorloop: the coverage of the changed lines (loop mutation-testing, its first check). Run by check.sh when the
// agent ends its turn. Runs the tests with coverage (vitest, @vitest/coverage-v8), and lists each line of src/ the
// change adds or edits that no test runs; exits 1 on any, on a red suite, or on a run that measured nothing.
//
// The change: everything since the main branch (its merge base with HEAD), committed or not, new files included.
//   node .sensorloop/hooks/changed-lines.mjs
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const root = process.env.CLAUDE_PROJECT_DIR ?? process.cwd();
const run = (cmd, args, opts = {}) => spawnSync(cmd, args, { cwd: root, encoding: 'utf8', maxBuffer: 64 << 20, ...opts });
const git = (...args) => run('git', args);
const out = (...parts) => console.log(...parts);

const mainRef = ['origin/HEAD', 'origin/main', 'main'].find((ref) => git('rev-parse', '--verify', '-q', ref).status === 0);
const base = mainRef ? git('merge-base', 'HEAD', mainRef).stdout.trim() : 'HEAD';

const isSource = (f) => /^src\/.*\.[cm]?[jt]sx?$/.test(f) && !/\.d\.ts$/.test(f) && !/\.(test|spec)\.[cm]?[jt]sx?$/.test(f);
const changed = new Map();
let file = null;
for (const l of git('diff', '-U0', '--no-color', '--no-ext-diff', base, '--', 'src').stdout.split('\n')) {
  const plus = l.match(/^\+\+\+ (?:b\/(.*)|\/dev\/null)$/);
  if (plus) file = plus[1] && isSource(plus[1]) ? plus[1] : null;
  const hunk = l.match(/^@@ -\d+(?:,\d+)? \+(\d+)(?:,(\d+))? @@/);
  if (hunk && file) {
    const [start, count] = [Number(hunk[1]), hunk[2] === undefined ? 1 : Number(hunk[2])];
    if (!changed.has(file)) changed.set(file, new Set());
    for (let n = start; n < start + count; n++) changed.get(file).add(n);
  }
}
for (const f of git('ls-files', '--others', '--exclude-standard', '--', 'src').stdout.split('\n').filter(isSource)) {
  const count = fs.readFileSync(path.join(root, f), 'utf8').split('\n').length;
  changed.set(f, new Set(Array.from({ length: count }, (_, i) => i + 1)));
}
if (!changed.size) process.exit(0); // nothing in src/ changed

const reports = path.join(root, '.sensorloop', 'state', 'coverage');
fs.rmSync(reports, { recursive: true, force: true });
const vitest = run(path.join(root, 'node_modules', '.bin', 'vitest'), ['run', '--coverage.enabled=true', '--coverage.provider=v8',
  '--coverage.reporter=json', `--coverage.reportsDirectory=${reports}`, '--coverage.include=src/**', '--coverage.reportOnFailure=true'],
{ env: { ...process.env, CI: 'true', NO_COLOR: '1' } });
if (vitest.status !== 0) {
  out('The tests fail, so their coverage means nothing yet. Make them pass first. The end of their output:');
  out((vitest.stdout + vitest.stderr).trim().split('\n').slice(-25).join('\n'));
  process.exit(1);
}
const reportFile = path.join(reports, 'coverage-final.json');
if (!fs.existsSync(reportFile)) {
  out(`The coverage run wrote no report (${path.relative(root, reportFile)}): nothing was measured.`);
  process.exit(1);
}
const coverage = JSON.parse(fs.readFileSync(reportFile, 'utf8'));

const IGNORE = /(v8|c8|istanbul)\s+ignore/;
const gaps = [];
let measured = 0;
for (const [f, set] of changed) {
  const text = fs.existsSync(path.join(root, f)) ? fs.readFileSync(path.join(root, f), 'utf8').split('\n') : [];
  const entry = coverage[path.join(root, f)];
  const hits = new Map();
  for (const [id, loc] of Object.entries(entry?.statementMap ?? {})) hits.set(loc.start.line, Math.max(hits.get(loc.start.line) ?? 0, entry.s[id] ?? 0));
  for (const n of [...set].sort((a, b) => a - b)) {
    const code = text[n - 1] ?? '';
    let why = null;
    if (IGNORE.test(code)) why = 'hidden from coverage';
    else if (!entry) why = code.trim() && !/^\s*(\/\/|\/?\*)/.test(code) ? 'its file is not in the coverage report' : null;
    else if (!hits.has(n)) continue; // no code on this line: a type, a comment, a brace
    else if (hits.get(n) === 0) why = 'no test runs it';
    if (why === null && !entry) continue;
    measured++;
    if (why) gaps.push(`  ${f}:${n}  ${code.trim().slice(0, 90)}${why === 'no test runs it' ? '' : `   (${why})`}`);
  }
}
if (!gaps.length) process.exit(0);

out(`${gaps.length} of the ${measured} lines of src/ this change adds or edits run in no test:`);
out(gaps.slice(0, 40).join('\n'));
if (gaps.length > 40) out(`  ... and ${gaps.length - 40} more`);
out(`Write a test that runs each of these lines and checks what it does, then end your turn again.
Coverage counts only code a test runs in its own process: a test that starts the command line as another process
(spawn, exec, tsx) does not count. Call the function from the test, exporting it if it is not.
Never hide code from coverage (a v8 or istanbul ignore comment, an exclude in a config) or delete a test to pass.`);
process.exit(1);
