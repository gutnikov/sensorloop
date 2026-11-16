// The judge of the actual-9558 experiment, run after the session: node judge.mjs <project> <out dir>.
// Prints one JSON line per check ({name, pass}) or measure ({name, value}).
//
// The checks are vitest tests (skipped-occurrence.judge.db.test.ts), copied into the project's loot-core and run with
// its own vitest against a real database, through runScheduleForecast, the function the budget template calls: the
// issue (a skipped yearly bill is not budgeted again in its month), the review's point (still not, once the bill's
// date has passed: CodeRabbit on the pull request's first version), and the bill that was not skipped (still budgeted).
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const [project] = process.argv.slice(2).map((p) => path.resolve(p));
const setup = process.env.SETUP_COMMIT;
const here = path.dirname(new URL(import.meta.url).pathname);
const lines = [];
const measure = (name, fn) => {
  try {
    lines.push({ name, value: fn() });
  } catch (error) {
    lines.push({ name, value: null, detail: String(error?.message ?? error).slice(0, 200) });
  }
};

const CHECKS = [
  // The issue.
  'skipped before its date: nothing due in its month',
  'paid by hand on Oct 31 and skipped, budgeted on its date: nothing due',
  // The review: the skip must hold once the bill's date has passed.
  'skipped before its date, budgeted after its date: still nothing due',
  'paid by hand and skipped in October, budgeted after its date: nothing due',
  // Not skipped: the bill is still budgeted.
  'unpaid, before its date: the bill is due in its month',
  'unpaid, after its date: the bill is still due in its month',
];

const pkg = path.join(project, 'packages/loot-core');
const rel = 'src/server/budget/zz-judge-skipped-occurrence.db.test.ts';
const report = '/tmp/judge-actual-9558.json';
fs.rmSync(report, { force: true });
fs.copyFileSync(path.join(here, 'skipped-occurrence.judge.db.test.ts'), path.join(pkg, rel));
const vitest = spawnSync('yarn', ['vitest', '--run', rel, '--reporter=json', `--outputFile=${report}`], {
  cwd: pkg,
  env: { ...process.env, ENV: 'node' },
  encoding: 'utf8',
  timeout: 300_000,
});
fs.rmSync(path.join(pkg, rel), { force: true });

let results = new Map();
let problem = null;
try {
  const json = JSON.parse(fs.readFileSync(report, 'utf8'));
  results = new Map(json.testResults.flatMap((f) => f.assertionResults.map((a) => [a.title, a])));
  if (!results.size) problem = json.testResults.map((f) => f.message).join(' ').slice(0, 300) || 'no tests ran';
} catch (error) {
  problem = `vitest did not report (exit ${vitest.status}): ${`${vitest.stderr}${vitest.stdout}`.slice(-300)}`;
}
for (const name of CHECKS) {
  const result = results.get(name);
  if (!result) {
    lines.push({ name, pass: false, detail: problem ?? 'test not run' });
    continue;
  }
  const pass = result.status === 'passed';
  const detail = pass ? undefined : (result.failureMessages ?? []).join(' ').replace(/\s+/g, ' ').slice(0, 300);
  lines.push({ name, pass, ...(detail ? { detail } : {}) });
}

const run = (cmd, args) => spawnSync(cmd, args, { cwd: project, encoding: 'utf8' });
measure('files changed', () => run('git', ['diff', '--name-only', setup]).stdout.split('\n').filter(Boolean));
measure('tests changed', () => run('git', ['diff', '--name-only', setup]).stdout.split('\n').filter((f) => /\.test\.tsx?$/.test(f)));

for (const line of lines) console.log(JSON.stringify(line));
