// What the runs of every experiment show: how many runs made the loop's mistake at the first hand-over (the
// experiment's `qualify` rule), and every check that failed there, the loop's or not.
//
//   node packages/experiment/src/report.js [--label <label>]... [--json]
//
// A run is judged at its first hand-over when the run has one (runs from 2026-11-15 on); older runs at their end.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';
import { judged as judgedAt, madeMistake as mistakeIn } from './qualify.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const args = process.argv.slice(2);
const labels = args.flatMap((a, i) => (a === '--label' ? [args[i + 1]] : []));
const asJson = args.includes('--json');

function experiments() {
  const loops = path.join(root, 'catalog/loops');
  const out = [];
  for (const loop of fs.readdirSync(loops)) {
    const one = path.join(loops, loop, 'experiment');
    if (fs.existsSync(path.join(one, 'experiment.yaml'))) out.push({ loop, name: null, dir: one });
    const many = path.join(loops, loop, 'experiments');
    if (fs.existsSync(many)) {
      for (const name of fs.readdirSync(many)) {
        const dir = path.join(many, name);
        if (fs.existsSync(path.join(dir, 'experiment.yaml'))) out.push({ loop, name, dir });
      }
    }
  }
  return out;
}

let judgeAtEnd = false;
const judged = (run) => judgedAt(run, judgeAtEnd);
const madeMistake = (rules, run) => mistakeIn(rules, run, judgeAtEnd);

const rows = [];
for (const exp of experiments()) {
  const config = parse(fs.readFileSync(path.join(exp.dir, 'experiment.yaml'), 'utf8'), { merge: true });
  judgeAtEnd = config.judge_at === 'end';
  const runsDir = path.join(exp.dir, 'runs');
  if (!fs.existsSync(runsDir)) continue;
  for (const label of fs.readdirSync(runsDir)) {
    if (labels.length ? !labels.includes(label) : label.startsWith('smoke')) continue;
    const file = path.join(runsDir, label, 'runs.jsonl');
    if (!fs.existsSync(file)) continue;
    const runs = fs.readFileSync(file, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));
    const byArm = {};
    for (const run of runs) (byArm[run.arm] ??= []).push(run);
    for (const [arm, armRuns] of Object.entries(byArm)) {
      const failed = {};
      for (const run of armRuns) for (const [k, v] of Object.entries(judged(run).checks)) if (v === false) failed[k] = (failed[k] ?? 0) + 1;
      const row = {
        loop: exp.loop,
        experiment: exp.name ?? 'experiment',
        label,
        arm,
        runs: armRuns.length,
        judged_at: [...new Set(armRuns.map((r) => judged(r).at))].join('/'),
        mistake: config.qualify ? armRuns.filter((r) => madeMistake(config.qualify, r)).length : null,
        also: Object.fromEntries(Object.entries(config.qualify_also ?? {}).map(([loop, rules]) => [loop, armRuns.filter((r) => madeMistake(rules, r)).length])),
        failed_checks: failed,
        person_messages: armRuns.reduce((n, r) => n + (r.person_reports ?? 0), 0),
        minutes: armRuns.map((r) => r.minutes),
      };
      rows.push(row);
    }
  }
}

if (asJson) {
  console.log(JSON.stringify(rows, null, 2));
} else {
  console.log('| loop | experiment | runs (label, arm) | made the mistake | failed checks at the first hand-over | person messages |');
  console.log('|---|---|---|---|---|---|');
  for (const r of rows.sort((a, b) => a.loop.localeCompare(b.loop) || a.label.localeCompare(b.label))) {
    const also = Object.entries(r.also).map(([l, n]) => `; ${l}: ${n} of ${r.runs}`).join('');
    const failed = Object.entries(r.failed_checks).map(([k, n]) => `${k} (${n})`).join('; ') || '-';
    const mistake = r.mistake === null ? 'no rule' : `${r.mistake} of ${r.runs}`;
    console.log(`| ${r.loop} | ${r.experiment} | ${r.runs} (${r.label}, ${r.arm}, at ${r.judged_at}) | ${mistake}${also} | ${failed} | ${r.person_messages} |`);
  }
}
