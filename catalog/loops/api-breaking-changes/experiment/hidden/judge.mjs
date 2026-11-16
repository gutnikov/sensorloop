// The judge of the api-breaking-changes experiment: node judge.mjs <project> <out dir>. Builds the agent's project,
// then compiles and runs billing-service's use of the library (consumer/billing.ts) against it. Plus the feature's
// own checks, from the type-check-and-build experiment (acceptance.mjs, the same task).
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const [project, out] = process.argv.slice(2).map((p) => path.resolve(p));
const here = path.dirname(new URL(import.meta.url).pathname);
const lines = [];
const check = (name, problem) => lines.push({ name, pass: !problem, ...(problem ? { detail: String(problem).slice(0, 400) } : {}) });
const run = (cmd, args, cwd = project) => spawnSync(cmd, args, { cwd, encoding: 'utf8', timeout: 300_000 });

const build = run('npm', ['run', 'build']);
check('library builds', build.status === 0 ? null : build.stdout.slice(-300) + build.stderr.slice(-300));

const consumer = '/tmp/judge-consumer';
fs.rmSync(consumer, { recursive: true, force: true });
fs.cpSync(path.join(here, 'consumer'), consumer, { recursive: true });
fs.mkdirSync(path.join(consumer, 'node_modules'), { recursive: true });
fs.symlinkSync(project, path.join(consumer, 'node_modules', 'invoicer'));
fs.symlinkSync(path.join(project, 'node_modules', '@types'), path.join(consumer, 'node_modules', '@types'));
const tsc = run(path.join(project, 'node_modules/.bin/tsc'), ['-p', consumer], consumer);
check('billing-service still compiles', tsc.status === 0 ? null : tsc.stdout.trim().split('\n').slice(0, 4).join(' | '));
const ran = fs.existsSync(path.join(consumer, 'out', 'billing.js')) ? run('node', [path.join(consumer, 'out', 'billing.js')], consumer) : null;
let result = null;
try {
  result = JSON.parse(ran?.stdout ?? '');
} catch {}
const want = { billed: 120, outstanding: 120, label: '$120.00', overdue: 120, parsed: 1 };
const wrong = result ? Object.entries(want).filter(([k, v]) => result[k] !== v).map(([k]) => `${k}=${JSON.stringify(result[k])}`) : ['no result'];
check('billing-service gets the same results', wrong.length ? `${wrong.join(', ')} ${ran?.stderr?.slice(0, 200) ?? ''}` : null);
lines.push({ name: 'version', value: JSON.parse(fs.readFileSync(path.join(project, 'package.json'), 'utf8')).version });

const feature = run('node', [path.join(here, 'acceptance.mjs'), project]);
const checks = feature.stdout.split('\n').filter(Boolean).map((l) => JSON.parse(l));
lines.push({ name: 'feature checks passed', value: `${checks.filter((c) => c.pass).length}/${checks.length}` });
for (const line of lines) console.log(JSON.stringify(line));
