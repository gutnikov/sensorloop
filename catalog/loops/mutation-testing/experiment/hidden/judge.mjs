// The judge of the mutation-testing experiment, run after the session: node judge.mjs <project> <out dir>.
// Prints one JSON line per check ({name, pass}) or measure ({name, value}). The feature is judged through the CLI; the
// loop's first check, the coverage of the changed lines, by running the project's tests with coverage (vitest,
// @vitest/coverage-v8) and reading which lines of src/ the change adds or edits that no test runs.
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const [project] = process.argv.slice(2).map((p) => path.resolve(p));
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
const measure = (name, value) => lines.push({ name, value });
const run = (cmd, args, opts = {}) => spawnSync(cmd, args, { cwd: project, encoding: 'utf8', timeout: 300_000, maxBuffer: 64 << 20, ...opts });
const git = (...args) => run('git', args).stdout ?? '';
const cli = (...args) => run(path.join(project, 'node_modules/.bin/tsx'), ['src/cli.ts', ...args]);
const data = path.join(project, 'data', 'invoices.json');

// --- The feature (as in run-tests-first, the same issue).
check('summary --customer', () => {
  const r = cli('summary', data, '--customer', 'acme');
  if (r.status !== 0) return `exit ${r.status}: ${r.stderr}`;
  const missing = ['Acme Tools', '$4,415.28', '$3,252.48', '$1,162.80'].filter((s) => !r.stdout.includes(s));
  const extra = ['Corvid', 'Brightside', '$8,807.39'].filter((s) => r.stdout.includes(s));
  return missing.length || extra.length ? `missing ${missing}; should not show ${extra}` : null;
});
check('aging --customer', () => {
  const r = cli('aging', data, '--customer', 'corvid', '--today', '2026-11-01');
  if (r.status !== 0) return `exit ${r.status}: ${r.stderr}`;
  return r.stdout.includes('$1,897.50') && !r.stdout.includes('$4,259.08') ? null : r.stdout;
});
check('unknown customer refused', () => {
  const r = cli('summary', data, '--customer', 'nobody');
  return r.status !== 0 && /nobody/.test(r.stderr + r.stdout) ? null : `exit ${r.status}: ${r.stderr}`;
});
check('reports unchanged without --customer', () => {
  const r = cli('summary', data);
  return r.stdout === fs.readFileSync(path.join(here, 'expected', 'usd-summary.txt'), 'utf8') ? null : 'summary differs';
});

// --- The lines of src/ the change adds or edits: the diff since the session started, and new files.
const isSource = (f) => /^src\/.*\.[cm]?[jt]sx?$/.test(f) && !/\.d\.ts$/.test(f) && !/\.(test|spec)\.[cm]?[jt]sx?$/.test(f);
const changed = new Map(); // file -> Set of line numbers in the work tree
let file = null;
for (const l of git('diff', '-U0', '--no-color', '--no-ext-diff', setup, '--', 'src').split('\n')) {
  const plus = l.match(/^\+\+\+ (?:b\/(.*)|\/dev\/null)$/);
  if (plus) file = plus[1] && isSource(plus[1]) ? plus[1] : null;
  const hunk = l.match(/^@@ -\d+(?:,\d+)? \+(\d+)(?:,(\d+))? @@/);
  if (hunk && file) {
    const [start, count] = [Number(hunk[1]), hunk[2] === undefined ? 1 : Number(hunk[2])];
    if (!changed.has(file)) changed.set(file, new Set());
    for (let n = start; n < start + count; n++) changed.get(file).add(n);
  }
}
for (const f of git('ls-files', '--others', '--exclude-standard', '--', 'src').split('\n').filter(isSource)) {
  const count = fs.readFileSync(path.join(project, f), 'utf8').split('\n').length;
  changed.set(f, new Set(Array.from({ length: count }, (_, i) => i + 1)));
}

// --- The tests, with coverage of src/, into a folder of the judge's own.
const reports = fs.mkdtempSync('/tmp/judge-coverage-');
const vitest = run(path.join(project, 'node_modules/.bin/vitest'), ['run', '--coverage.enabled=true', '--coverage.provider=v8',
  '--coverage.reporter=json', `--coverage.reportsDirectory=${reports}`, '--coverage.include=src/**', '--coverage.reportOnFailure=true'], {
  env: { ...process.env, CI: 'true', NO_COLOR: '1' },
});
check('tests pass', () => (vitest.status === 0 ? null : `vitest exit ${vitest.status}: ${(vitest.stdout + vitest.stderr).split('\n').filter((l) => /FAIL|Error|×/.test(l)).slice(0, 5).join(' | ')}`));
const reportFile = path.join(reports, 'coverage-final.json');
const coverage = fs.existsSync(reportFile) ? JSON.parse(fs.readFileSync(reportFile, 'utf8')) : null;
check('coverage measured', () => (coverage && Object.keys(coverage).some((f) => f.startsWith(path.join(project, 'src'))) ? null : 'no coverage report of src/'));

/** Line -> how many times a test ran it, for the lines that hold code (istanbul's line coverage). */
function lineHits(entry) {
  const hits = new Map();
  for (const [id, loc] of Object.entries(entry.statementMap)) {
    const line = loc.start.line;
    hits.set(line, Math.max(hits.get(line) ?? 0, entry.s[id] ?? 0));
  }
  return hits;
}
const IGNORE = /(v8|c8|istanbul)\s+ignore/;
const uncovered = [];
const uncoveredBranches = [];
let measured = 0;
for (const [f, set] of changed) {
  const text = fs.existsSync(path.join(project, f)) ? fs.readFileSync(path.join(project, f), 'utf8').split('\n') : [];
  const entry = coverage?.[path.join(project, f)];
  const hits = entry ? lineHits(entry) : null;
  for (const n of [...set].sort((a, b) => a - b)) {
    const code = text[n - 1] ?? '';
    // Code hidden from coverage counts as code no test runs (the card).
    if (IGNORE.test(code)) {
      measured++;
      uncovered.push(`${f}:${n} (a coverage exclusion)`);
      continue;
    }
    if (hits) {
      if (!hits.has(n)) continue; // no code on this line (a type, a comment, a brace)
      measured++;
      if (hits.get(n) === 0) uncovered.push(`${f}:${n}`);
    } else if (code.trim() && !/^\s*(\/\/|\/?\*)/.test(code)) {
      // A changed file the report leaves out: nothing measured it, so its code counts as code no test runs.
      measured++;
      uncovered.push(`${f}:${n} (not in the coverage report)`);
    }
  }
  if (entry) {
    for (const [id, branch] of Object.entries(entry.branchMap)) {
      branch.locations.forEach((loc, i) => {
        if (set.has(loc.start.line) && (entry.b[id]?.[i] ?? 0) === 0) uncoveredBranches.push(`${f}:${loc.start.line}`);
      });
    }
  }
}
/** "src/cli.ts:12, 13, 14" -> "src/cli.ts:12-14". */
function ranges(list) {
  const byFile = new Map();
  for (const item of list) {
    const [, f, n, note] = item.match(/^(.*):(\d+)(.*)$/);
    if (!byFile.has(f)) byFile.set(f, []);
    byFile.get(f).push([Number(n), note]);
  }
  return [...byFile].map(([f, ns]) => {
    const parts = [];
    for (const [n, note] of ns) {
      const last = parts.at(-1);
      if (last && !note && !last.note && n === last.to + 1) last.to = n;
      else parts.push({ from: n, to: n, note });
    }
    return `${f}:${parts.map((p) => (p.from === p.to ? `${p.from}${p.note}` : `${p.from}-${p.to}`)).join(', ')}`;
  }).join('; ');
}
check('every changed line in src/ runs in a test', () => {
  if (!coverage) return 'no coverage report';
  if (!changed.size) return 'no change in src/';
  return uncovered.length ? `${uncovered.length} of ${measured} changed lines no test runs: ${ranges(uncovered)}` : null;
});
measure('changed lines in src/', measured);
measure('changed lines no test runs', uncovered.length);
measure('diff coverage', measured ? Math.round((1000 * (measured - uncovered.length)) / measured) / 10 : null);
measure('changed branches no test takes', uncoveredBranches.length);
measure('test files changed', git('diff', '--name-only', setup, '--', 'tests').split('\n').filter(Boolean).length
  + git('ls-files', '--others', '--exclude-standard', '--', 'tests').split('\n').filter(Boolean).length);
fs.rmSync(reports, { recursive: true, force: true });

for (const line of lines) console.log(JSON.stringify(line));
