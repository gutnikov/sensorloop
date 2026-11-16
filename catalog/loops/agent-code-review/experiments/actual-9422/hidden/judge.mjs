// The judge of the actual-9422 experiment, run after the session: node judge.mjs <project> <out dir>.
// Prints one JSON line per check ({name, pass}) or measure ({name, value}).
//
// The checks are vitest tests, copied into the project's loot-core/src/shared and run with its own vitest against
// looselyParseAmount, the function the CSV import reads amounts with: the issue's amounts (parse-amount.judge.test.ts,
// "the issue"), the review's cases (CodeRabbit on the first two versions of #9422, "the review"), and the project's own
// util tests as they were on the base commit (util.base.test.ts), which must still pass.
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
  'scientific notation from the issue',
  'more than nine decimal places',
  'every amount of the issue CSV parses, and their total is safe',
  // The review (first version).
  'a comma decimal in the mantissa',
  'a currency sign before the mantissa',
  // The review (second version).
  'three digits after the separator in the mantissa',
  'a small mantissa with a positive exponent',
  'a large mantissa with a negative exponent',
];
const BASE_TESTS = 'existing parsing unchanged (the base commit\'s util tests)';

const pkg = path.join(project, 'packages/loot-core');
const files = {
  'src/shared/zz-judge-parse-amount.test.ts': 'parse-amount.judge.test.ts',
  'src/shared/zz-judge-util-base.test.ts': 'util.base.test.ts',
};
const report = '/tmp/judge-actual-9422.json';
fs.rmSync(report, { force: true });
for (const [rel, src] of Object.entries(files)) fs.copyFileSync(path.join(here, src), path.join(pkg, rel));
const vitest = spawnSync('yarn', ['vitest', '--run', ...Object.keys(files), '--reporter=json', `--outputFile=${report}`], {
  cwd: pkg,
  env: { ...process.env, ENV: 'node' },
  encoding: 'utf8',
  timeout: 300_000,
});
for (const rel of Object.keys(files)) fs.rmSync(path.join(pkg, rel), { force: true });

let suites = [];
let problem = null;
try {
  suites = JSON.parse(fs.readFileSync(report, 'utf8')).testResults;
} catch {
  problem = `vitest did not report (exit ${vitest.status}): ${`${vitest.stderr}${vitest.stdout}`.slice(-300)}`;
}
const suite = (name) => suites.find((s) => s.name.endsWith(name));
const failureOf = (a) => (a.failureMessages ?? []).join(' ').replace(/\s+/g, ' ').slice(0, 300);

const judgeSuite = suite('zz-judge-parse-amount.test.ts');
const results = new Map((judgeSuite?.assertionResults ?? []).map((a) => [a.title, a]));
for (const name of CHECKS) {
  const result = results.get(name);
  if (!result) {
    lines.push({ name, pass: false, detail: problem ?? judgeSuite?.message?.slice(0, 300) ?? 'test not run' });
    continue;
  }
  const pass = result.status === 'passed';
  lines.push({ name, pass, ...(pass ? {} : { detail: failureOf(result) }) });
}

const baseSuite = suite('zz-judge-util-base.test.ts');
const baseFailed = (baseSuite?.assertionResults ?? []).filter((a) => a.status !== 'passed');
if (!baseSuite?.assertionResults?.length) {
  lines.push({ name: BASE_TESTS, pass: false, detail: problem ?? baseSuite?.message?.slice(0, 300) ?? 'tests not run' });
} else {
  lines.push({
    name: BASE_TESTS,
    pass: baseFailed.length === 0,
    ...(baseFailed.length ? { detail: baseFailed.map((a) => `${a.title}: ${failureOf(a)}`).join(' | ').slice(0, 300) } : {}),
  });
}

const run = (cmd, args) => spawnSync(cmd, args, { cwd: project, encoding: 'utf8' });
measure('files changed', () => run('git', ['diff', '--name-only', setup]).stdout.split('\n').filter(Boolean));
measure('tests changed', () => run('git', ['diff', '--name-only', setup]).stdout.split('\n').filter((f) => /\.test\.tsx?$/.test(f)));

for (const line of lines) console.log(JSON.stringify(line));
