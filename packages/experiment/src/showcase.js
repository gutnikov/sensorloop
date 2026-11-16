// The pair of runs a loop's page shows, from one set of runs of both arms, picked by the rule fixed before the runs:
// in each arm, a run whose outcome matches the arm's majority, with the duration closest to the arm's median. Writes
// the experiment's results/<label>/: runs.jsonl (every run), A.cast and B.cast (the pair, with chapter markers), and
// showcase.json (the conditions, the counts, the pair and why). notes.md is written by hand, from the transcripts.
//
//   node packages/experiment/src/showcase.js <loop-id> [--name <experiment>] --label <label>
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';
import { prepareCast } from './cast.js';
import { madeMistake } from './qualify.js';
import { score } from './score.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const args = process.argv.slice(2);
const loop = args[0];
const opt = (name) => (args.includes(name) ? args[args.indexOf(name) + 1] : undefined);
const label = opt('--label');
const name = opt('--name');
if (!loop || !label) {
  console.error('usage: node packages/experiment/src/showcase.js <loop-id> [--name <experiment>] --label <label>');
  process.exit(2);
}
const expDir = name ? path.join(root, 'catalog/loops', loop, 'experiments', name) : path.join(root, 'catalog/loops', loop, 'experiment');
const config = parse(fs.readFileSync(path.join(expDir, 'experiment.yaml'), 'utf8'), { merge: true });
const runsDir = path.join(expDir, 'runs', label);
const runDirOf = (r) => path.join(runsDir, r.run.replace(`${label}-`, ''));
// Each run scored again from its folder, so a run judged again (hidden/CALIBRATION.md) counts with its current verdict;
// a run that cannot be scored keeps the line run.js wrote.
const runs = fs.readFileSync(path.join(runsDir, 'runs.jsonl'), 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l))
  .map((r) => {
    try {
      return r.error ? r : score(runDirOf(r));
    } catch {
      return r;
    }
  });
/** Every message the person typed after the task (driver.log's "person" events): answers, replies, reports, nudges. */
function personMessages(r) {
  const file = path.join(runDirOf(r), 'driver.log');
  if (!fs.existsSync(file)) return r.person_reports ?? 0;
  return fs.readFileSync(file, 'utf8').split('\n').filter((l) => l.includes('"event":"person"')).length;
}
const atEnd = config.judge_at === 'end';
const median = (xs) => {
  const s = [...xs].sort((a, b) => a - b);
  return s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2;
};

const arms = {};
for (const arm of ['A', 'B']) {
  const own = runs.filter((r) => r.arm === arm && !r.error);
  if (!own.length) throw new Error(`no runs of arm ${arm} in ${label}`);
  const mistakes = own.filter((r) => madeMistake(config.qualify, r, atEnd));
  const majority = mistakes.length * 2 > own.length; // a tie counts as no mistake
  const candidates = own.filter((r) => madeMistake(config.qualify, r, atEnd) === majority);
  const mid = median(own.map((r) => r.minutes));
  const pick = candidates.sort((a, b) => Math.abs(a.minutes - mid) - Math.abs(b.minutes - mid))[0];
  arms[arm] = {
    runs: own.length,
    made_the_mistake: mistakes.length,
    minutes: own.map((r) => r.minutes),
    median_minutes: mid,
    shown: pick.run,
    shown_made_the_mistake: majority,
    shown_minutes: pick.minutes,
  };
}

const out = path.join(expDir, 'results', label);
fs.mkdirSync(out, { recursive: true });
fs.writeFileSync(path.join(out, 'runs.jsonl'), runs.map((r) => JSON.stringify(r)).join('\n') + '\n');
for (const arm of ['A', 'B']) {
  arms[arm].cast = prepareCast(runDirOf({ run: arms[arm].shown }), path.join(out, `${arm}.cast`));
}
const sample = runs[0];
const showcase = {
  loop,
  experiment: name ?? null,
  label,
  date: (sample.run && fs.statSync(runsDir).mtime.toISOString().slice(0, 10)) || null,
  model: sample.model,
  effort: parse(fs.readFileSync(path.join(root, 'packages/experiment/models.yaml'), 'utf8'), { merge: true })[sample.model]?.env
    ?.CLAUDE_CODE_EFFORT_LEVEL ?? null,
  claude_code: sample.claude_code,
  judged_at: atEnd || !runs.some((r) => r.first) ? 'end' : 'first hand-over',
  task: config.task ?? null,
  question: config.question,
  rule: "In each arm, a run whose outcome matches the arm's majority, with the duration closest to the arm's median.",
  arms,
  // Every run, for the page's table.
  runs: runs
    .filter((r) => !r.error)
    .map((r) => ({
      arm: r.arm,
      run: Number(r.run.split('-').at(-1)),
      made_the_mistake: madeMistake(config.qualify, r, atEnd),
      minutes: r.minutes,
      person_messages: personMessages(r),
      permission_asks: r.permission_asks ?? 0,
      shown: r.run === arms[r.arm]?.shown,
    }))
    .sort((a, b) => a.arm.localeCompare(b.arm) || a.run - b.run),
};
fs.writeFileSync(path.join(out, 'showcase.json'), `${JSON.stringify(showcase, null, 2)}\n`);
console.log(JSON.stringify({ out: path.relative(root, out), A: arms.A.shown, B: arms.B.shown, mistakes: { A: arms.A.made_the_mistake, B: arms.B.made_the_mistake } }));
