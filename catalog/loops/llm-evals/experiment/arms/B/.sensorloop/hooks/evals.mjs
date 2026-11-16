#!/usr/bin/env node
// sensorloop: the evals of `invoicer categorize` before the turn ends (catalog/loops/llm-evals). Built by hand from the
// card, in check.sh's conventions: a failure prints `sensorloop: evals failed (...)` to stderr and exits 2, so the
// agent reads it and its turn goes on; three failing rounds in a row hand the work to the person instead.
//
//   node .sensorloop/hooks/evals.mjs --hook       the Stop hook (its JSON on stdin)
//   node .sensorloop/hooks/evals.mjs              by hand: the same comparison, without the hook's count of rounds
//   node .sensorloop/hooks/evals.mjs --baseline   measures the baseline on this commit and writes evals/baseline.json,
//                                                 for a person to review and commit
//
// When the files that decide the categories changed since the baseline was stored, it runs the eval set three times
// (`npm run eval -- --runs 1`: every case once, a run) and compares the mean pass rate with the stored baseline. Within
// the noise (the spread of the baseline's runs), it passes. Below it, each case that failed is run four more times:
// two passes clear it as noise; three failures make it a regression, or pre-existing if it failed in the baseline too.
// A regression fails the change. A run the API failed is missing, never a failure; too many missing withhold the
// comparison, and a withheld comparison is not a pass. The same state of the files is not evaluated twice.
import { spawn, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const project = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const state = path.join(project, '.sensorloop', 'state');
const stateFile = path.join(state, 'evals.json');
const baselineFile = 'evals/baseline.json';
// The prompt, the model and its parameters, the request and the answer's checks, the command that calls them, the
// eval runner and the dependencies: a change to any of them can change the categories.
const WATCHED = ['src/categorize', 'src/cli.ts', 'scripts/eval.ts', 'package.json', 'package-lock.json'];
const SUITE = ['evals'];
const RUNS = 3;
const RERUNS = 4;
const COMMAND = ['npm', 'run', 'eval', '--', '--runs', '1'];
const MAX_ROUNDS = 3;

const git = (...args) => spawnSync('git', args, { cwd: project, encoding: 'utf8' });
const pct = (x) => Math.round(x * 1000) / 10;

function evalOnce() {
  return new Promise((resolve) => {
    const child = spawn(COMMAND[0], COMMAND.slice(1), { cwd: project, env: process.env });
    let out = '';
    child.stdout.on('data', (d) => (out += d));
    child.stderr.on('data', (d) => (out += d));
    const timer = setTimeout(() => child.kill('SIGKILL'), 240_000);
    child.on('close', (status) => {
      clearTimeout(timer);
      resolve({ status, out });
    });
  });
}

/** One run of the eval set: passed and counted cases, the failed cases with why, the cases the API failed. */
function parse({ status, out }) {
  const rate = out.match(/pass rate \S+% \((\d+)\/(\d+) runs: (\d+) cases/);
  const failed = new Map([...out.matchAll(/^([\w.-]+): passed \d+\/\d+: (.*)$/gm)].map((m) => [m[1], m[2]]));
  const missing = [...out.matchAll(/^not counted, the API failed: ([\w.-]+): (.*)$/gm)].map((m) => ({ id: m[1], why: m[2] }));
  if (!rate) return { error: `exit ${status}: ${out.trim().split('\n').slice(-6).join('\n')}` };
  return { passed: Number(rate[1]), total: Number(rate[2]), cases: Number(rate[3]), failed, missing };
}
const outcome = (run, id) => (run.failed.has(id) ? 'fail' : run.missing.some((m) => m.id === id) ? 'missing' : 'pass');

async function measure(n) {
  return (await Promise.all(Array.from({ length: n }, evalOnce))).map(parse);
}

if (process.argv.includes('--baseline')) {
  const runs = await measure(RUNS);
  const broken = runs.find((r) => r.error);
  if (broken) {
    console.error(`the eval set did not run: ${broken.error}`);
    process.exit(1);
  }
  const rates = runs.map((r) => r.passed / r.total);
  const failing = {};
  for (const r of runs) for (const id of r.failed.keys()) failing[id] = (failing[id] ?? 0) + 1;
  const baseline = {
    command: COMMAND.join(' '),
    measured: new Date().toISOString().slice(0, 10),
    commit: git('rev-parse', '--short', 'HEAD').stdout.trim(),
    cases: runs[0].cases,
    runs: runs.map((r) => ({ passed: r.passed, total: r.total })),
    pass_rate: pct(rates.reduce((a, b) => a + b, 0) / rates.length),
    spread: pct(Math.max(...rates) - Math.min(...rates)),
    failing_cases: failing,
    missing: runs.reduce((a, r) => a + r.missing.length, 0),
  };
  fs.writeFileSync(path.join(project, baselineFile), `${JSON.stringify(baseline, null, 2)}\n`);
  console.log(JSON.stringify(baseline));
  process.exit(0);
}

// --- Before the turn ends (or by hand).
const fromHook = process.argv.includes('--hook');
if (fromHook) fs.readFileSync(0, 'utf8'); // the hook's input; nothing in it is needed
fs.mkdirSync(state, { recursive: true });
const saved = fs.existsSync(stateFile) ? JSON.parse(fs.readFileSync(stateFile, 'utf8')) : {};
const save = (s) => fs.writeFileSync(stateFile, `${JSON.stringify(s, null, 2)}\n`);
let key = null;

function pass(message) {
  save({ key, verdict: 'pass', message, streak: 0 });
  if (fromHook) console.log(JSON.stringify({ systemMessage: `sensorloop: evals pass: ${message}` }));
  else console.log(`evals pass: ${message}`);
  process.exit(0);
}
function fail(reason, detail, verdict = 'fail') {
  const streak = fromHook ? (saved.streak ?? 0) + 1 : saved.streak ?? 0;
  save({ key, verdict, reason, detail, streak: streak >= MAX_ROUNDS ? 0 : streak });
  if (fromHook && streak >= MAX_ROUNDS) {
    console.log(JSON.stringify({
      systemMessage: `sensorloop: evals: ${reason}, for ${MAX_ROUNDS} rounds in a row; over to you. Hand the person the failed cases with their outputs.`,
    }));
    process.exit(0);
  }
  console.error(`sensorloop: evals failed (${reason}). ${detail}`);
  process.exit(2);
}

// The baseline: stored with the suite, in the commit that added it.
const since = git('log', '--diff-filter=A', '--format=%H', '--', baselineFile).stdout.trim().split('\n').filter(Boolean).at(-1);
if (!since) {
  if (fromHook) process.exit(0); // no baseline, no loop
  console.error(`no ${baselineFile}: measure one with --baseline on the base commit, and have a person commit it`);
  process.exit(1);
}
const baseline = JSON.parse(git('show', `${since}:${baselineFile}`).stdout);
const untracked = (paths) => git('ls-files', '--others', '--exclude-standard', '--', ...paths).stdout.split('\n').filter(Boolean);
const changedSince = (paths) => git('diff', '--name-only', since, '--', ...paths).stdout.split('\n').filter(Boolean).concat(untracked(paths));

// The suite and its baseline change only through a person's review.
const suiteChanged = changedSince(SUITE);
if (suiteChanged.length) {
  key = `suite:${suiteChanged.join(',')}`;
  fail(`the eval set or its baseline changed: ${suiteChanged.join(', ')}`,
    `The cases, the baseline and the threshold change only through a person's review. Put them back ` +
      `(\`git checkout ${since.slice(0, 7)} -- evals/\`, and remove new files there), and tell the person what you would ` +
      `change and why.`);
}

// Nothing the categories depend on changed: nothing to evaluate.
if (!changedSince(WATCHED).length) process.exit(0);
key = createHash('sha256')
  .update(git('diff', since, '--', ...WATCHED).stdout)
  .update(untracked(WATCHED).map((f) => `${f}\0${fs.readFileSync(path.join(project, f), 'utf8')}`).join('\0'))
  .digest('hex').slice(0, 16);
if (saved.key === key && saved.verdict === 'pass') pass(saved.message);
if (saved.key === key && saved.verdict === 'fail') fail(saved.reason, saved.detail, saved.verdict);

const runs = await measure(RUNS);
const brokenRun = runs.find((r) => r.error);
if (brokenRun) fail('the eval set did not run', `\`${COMMAND.join(' ')}\` gave no pass rate. Its output:\n${brokenRun.error}`);
const missing = runs.flatMap((r) => r.missing);
function withheld(count, total, errors) {
  fail(`withheld: ${count} of ${total} case runs got no answer from the API`,
    `A withheld comparison is not a pass. Run the evals again (end the turn, or \`node .sensorloop/hooks/evals.mjs\`); ` +
      `if runs are still missing, tell the person instead of saying you are done. The errors:\n` +
      [...new Set(errors.map((m) => `${m.id}: ${m.why}`))].slice(0, 5).join('\n'), 'withheld');
}
if (missing.length > Math.ceil(0.1 * baseline.cases * RUNS)) withheld(missing.length, baseline.cases * RUNS, missing);

const rates = runs.filter((r) => r.total > 0).map((r) => r.passed / r.total);
const mean = rates.reduce((a, b) => a + b, 0) / rates.length;
const noise = baseline.spread / 100;
const drop = baseline.pass_rate / 100 - mean;
const summary = `pass rate ${pct(mean)}% (runs ${rates.map(pct).join(', ')}), baseline ${baseline.pass_rate}% (runs ` +
  `${baseline.runs.map((r) => pct(r.passed / r.total)).join(', ')}), noise ${baseline.spread} points` +
  (missing.length ? `, ${missing.length} case runs missing` : '');
if (drop <= noise + 1e-9) pass(summary);

// Below the baseline by more than the noise: which cases, and is each one noise, pre-existing or a regression?
const failing = [...new Set(runs.flatMap((r) => [...r.failed.keys()]))];
const reruns = await measure(RERUNS);
const brokenRerun = reruns.find((r) => r.error);
if (brokenRerun) fail('the eval set did not run', `\`${COMMAND.join(' ')}\` gave no pass rate. Its output:\n${brokenRerun.error}`);
const verdicts = failing.map((id) => {
  const first = runs.map((r) => outcome(r, id));
  const again = reruns.map((r) => outcome(r, id));
  const passes = again.filter((o) => o === 'pass').length;
  const fails = again.filter((o) => o === 'fail').length;
  const kind = passes >= 2 ? 'noise' : fails >= 3 ? (baseline.failing_cases?.[id] ? 'pre-existing' : 'regression') : 'undecided';
  const why = [...new Set([...runs, ...reruns].map((r) => r.failed.get(id)).filter(Boolean))].join(' | ');
  return { id, kind, line: `${id}: ${kind}: failed ${first.filter((o) => o === 'fail').length}/${RUNS}, then ${fails}/${RERUNS} more: ${why}` };
});
const lines = verdicts.map((v) => v.line).join('\n');
if (verdicts.some((v) => v.kind === 'regression')) {
  fail(`the pass rate fell below the baseline by more than its noise, and ${verdicts.filter((v) => v.kind === 'regression').length} case(s) regressed`,
    `Fix the prompt or the model settings so that these cases pass again; never the cases, the baseline or how the ` +
      `runner grades. Reproduce with \`npm run eval\`.\n${lines}\n${summary}`);
}
if (verdicts.some((v) => v.kind === 'undecided')) {
  withheld(reruns.flatMap((r) => r.missing).length, baseline.cases * RERUNS, reruns.flatMap((r) => r.missing));
}
pass(`${summary}; the cases that failed are noise or pre-existing:\n${lines}`);
