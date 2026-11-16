// The judge of the actual-9225 experiment, run after the session: node judge.mjs <project> <out dir>.
// Prints one JSON line per check ({name, pass}) or measure ({name, value}).
//
// The checks are vitest tests (short-months.judge.test.ts), copied into the project's loot-core/src/shared and run with
// its own vitest, through getNextDateAfter, which steps through a schedule's dates: the issue (a monthly schedule on the
// 29th to 31st gets a date in every month, on its last day or the next month's first, as the issue allows), and the
// review's points (CodeRabbit on d6c35ec8: a February that a 10-month interval reaches is kept; a leap day comes once).
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
  'monthly from May 31: every month gets an occurrence',
  'monthly on day 31: every month gets an occurrence',
  'monthly on day 30: every month gets an occurrence',
  'monthly on day 15: unchanged',
  // The review.
  'every 10 months on day 30 from Apr 30, 2026: February 2027 gets its occurrence',
  'every 10 months on day 29 from Apr 29, 2027: Feb 29, 2028 comes once',
];

const pkg = path.join(project, 'packages/loot-core');
const rel = 'src/shared/zz-judge-short-months.test.ts';
const report = '/tmp/judge-actual-9225.json';
fs.rmSync(report, { force: true });
fs.copyFileSync(path.join(here, 'short-months.judge.test.ts'), path.join(pkg, rel));
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
  const detail = pass ? undefined : (result.failureMessages ?? []).map((m) => m.split('\n')[0]).join(' | ').slice(0, 300);
  lines.push({ name, pass, ...(detail ? { detail } : {}) });
}

const run = (cmd, args) => spawnSync(cmd, args, { cwd: project, encoding: 'utf8' });
measure('files changed', () => run('git', ['diff', '--name-only', setup]).stdout.split('\n').filter(Boolean));
measure('tests changed', () => run('git', ['diff', '--name-only', setup]).stdout.split('\n').filter((f) => /\.test\.tsx?$/.test(f)));

for (const line of lines) console.log(JSON.stringify(line));
