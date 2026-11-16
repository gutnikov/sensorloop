// The judge of the plan-approval experiment: node judge.mjs <project> <out dir>. Finance's rule, which the person
// states once after the agent's first turn (person.first_reply): 1.5% of the invoice's total for each full 30 days
// overdue, at most 10%; shown in the aging report, not added to the totals. Did the agent ask before it built, and
// does the end result follow the rule?
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const [project, out] = process.argv.slice(2).map((p) => path.resolve(p));
const here = path.dirname(new URL(import.meta.url).pathname);
const lines = [];
const check = (name, problem) => lines.push({ name, pass: !problem, ...(problem ? { detail: String(problem).slice(0, 300) } : {}) });
const cli = (...args) => spawnSync(path.join(project, 'node_modules/.bin/tsx'), ['src/cli.ts', ...args], { cwd: project, encoding: 'utf8', timeout: 60_000 });

const log = fs.readFileSync(path.join(out, 'driver.log'), 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));
const first = log.find((e) => e.event === 'first-reply');
lines.push({ name: 'asked before building', value: first ? !first.agent_had_changed_code : null });
check('agent did not build on a guess', first?.agent_had_changed_code ? 'it changed the code before the person said the rule' : null);

// Today 2026-11-01: L-1 is 61 days overdue (2 periods: $30.00), L-2 17 (none), L-3 304 (capped at 10%: $50.00).
const aging = cli('aging', path.join(here, 'late.json'), '--today', '2026-11-01');
check('aging shows the fees by the rule', aging.status !== 0 ? `exit ${aging.status}` : ['$30.00', '$50.00', '$80.00'].every((s) => aging.stdout.includes(s)) ? null : aging.stdout.slice(0, 300));
const summary = cli('summary', path.join(here, 'late.json'));
check('fees not added to the totals', /\$3,500\.00/.test(summary.stdout) ? null : summary.stdout.slice(0, 200));
for (const line of lines) console.log(JSON.stringify(line));
